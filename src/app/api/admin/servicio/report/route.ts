import { NextResponse } from "next/server";
import { z } from "zod";
import { get } from "@vercel/blob";
import type { ChecklistStatus } from "@/lib/servicio-report-types";
import { generateServicioPdf } from "@/lib/generate-servicio-pdf";
import { sendServicioReportEmail } from "@/lib/email";
import {
  isServicioLanguage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";
import { computeServicioBilling } from "@/lib/servicio-billing-math";
import { getStripe, isStripeSecretKeyFailure } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  isBlobConfigured,
  uploadServicioPdf,
  type StoredPhotoRef,
} from "@/lib/servicio-report-storage";
import { isSafeServicioBlobPathname } from "@/lib/servicio-photo-view-token";

export const runtime = "nodejs";

const MAX_FILES_PER_SIDE = 6;
/** Retención del reporte+fotos en historial (2 años desde serviceDate). */
const RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000;

const checklist = z.enum(["pass", "fail", "na"]);

/**
 * Acepta sólo URLs https alojadas en Vercel Blob (sufijo .blob.vercel-storage.com).
 * Evita SSRF si alguien con admin key intentara meter URLs arbitrarias.
 */
function isVercelBlobUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

const photoRefSchema = z.object({
  url: z.string().url().refine(isVercelBlobUrl, {
    message: "Photo URL must be a Vercel Blob URL",
  }),
  pathname: z.string().min(1).max(500),
  contentType: z.string().min(1).max(100),
  size: z.number().int().nonnegative(),
});

/**
 * Fotos en Blob están en `access: "private"` — un GET anónimo a la URL suele ser 403.
 * El SDK usa `BLOB_READ_WRITE_TOKEN` y coincide con `/api/admin/servicio-photo-view`.
 */
async function fetchServicioPhotoBufferForPdf(
  ref: z.infer<typeof photoRefSchema>,
  reportId: string,
): Promise<Buffer | null> {
  const pathnameOk =
    isSafeServicioBlobPathname(ref.pathname) &&
    ref.pathname.startsWith(`servicio-reports/${reportId}/`);
  if (!pathnameOk) {
    console.error(
      `[servicio-report] rejected photo pathname for report ${reportId}`,
      ref.pathname,
    );
    return null;
  }

  if (isBlobConfigured()) {
    try {
      const result = await get(ref.pathname, {
        access: "private",
        useCache: false,
      });
      if (!result || result.statusCode !== 200 || !result.stream) {
        console.error(
          `[servicio-report] blob get ${result?.statusCode ?? "?"} for`,
          ref.pathname,
        );
        return null;
      }
      const ab = await new Response(result.stream).arrayBuffer();
      return Buffer.from(new Uint8Array(ab));
    } catch (err) {
      console.error(`[servicio-report] blob get failed`, ref.pathname, err);
      return null;
    }
  }

  try {
    const res = await fetch(ref.url, { cache: "no-store" });
    if (!res.ok) {
      console.error(
        `[servicio-report] photo fetch ${res.status} ${res.statusText} for ${ref.url}`,
      );
      return null;
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(new Uint8Array(ab));
  } catch (err) {
    console.error(`[servicio-report] fetch failed for ${ref.url}`, err);
    return null;
  }
}

/**
 * Convierte el string de fecha capturado en el form a un DateTime válido.
 * Soporta "YYYY-MM-DD" (date input) y cualquier ISO completo.
 * Si falla, devuelve `now`.
 */
function parseServiceDate(raw: string): Date {
  const trimmed = raw.trim();
  if (!trimmed) return new Date();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(`${trimmed}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Comprueba que el Checkout de Stripe se pagó y que los metadatos del cobro
 * de saldo (admin-servicio-balance) coinciden con el cálculo del informe.
 * No se usa `amount_total` (puede incluir impuestos) — sí `metadata.amount_due_cents`.
 */
async function assertPaidBalanceCheckoutSession(
  sessionId: string,
  amountDue: number,
  clientEmail: string,
): Promise<boolean> {
  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return false;
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    if (session.payment_status !== "paid") return false;
    if (session.metadata?.source !== "admin-servicio-balance") return false;
    const expectedCents = Math.round(amountDue * 100);
    const metaCents = parseInt(session.metadata?.amount_due_cents ?? "", 10);
    if (Number.isNaN(metaCents) || metaCents !== expectedCents) {
      return false;
    }
    const em = (session.customer_email || session.customer_details?.email || "")
      .trim()
      .toLowerCase();
    const want = clientEmail.trim().toLowerCase();
    if (em && em !== want) return false;
    return true;
  } catch (err) {
    if (isStripeSecretKeyFailure(err)) {
      console.error("[servicio-report] stripe retrieve failed (key)", err);
    } else {
      console.error("[servicio-report] stripe session retrieve failed", err);
    }
    return false;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: servicioReportCopy("es").apiInvalidForm },
      { status: 400 },
    );
  }

  const langRaw = String(
    (body as Record<string, unknown>)?.serviceLanguage ?? "",
  ).trim();
  const language: ServicioLanguage = isServicioLanguage(langRaw)
    ? langRaw
    : "es";
  const c = servicioReportCopy(language);

  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  if (adminKey && req.headers.get("x-hydronet-admin-key") !== adminKey) {
    return NextResponse.json({ error: c.apiUnauthorized }, { status: 401 });
  }

  const money = z.coerce.number().nonnegative();
  /** Horas; decimales permitidos; tope razonable para la visita. */
  const hoursField = z.coerce.number().nonnegative().max(1_000);

  const schema = z.object({
    /** Generado en cliente; se usa como Prisma id y prefijo del path Blob. */
    reportId: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/),
    bookingReference: z.string().max(200).optional().default(""),
    restaurantName: z.string().min(1),
    clientEmail: z.string().email(),
    technicianName: z.string().min(1),
    serviceDate: z.string().min(1),
    checklistAirGap: checklist,
    checklistHandSink: checklist,
    checklistGreaseTrap: checklist,
    notes: z.string().max(4000).optional().default(""),
    laborHours: hoursField,
    materialsSubtotal: money,
    partsSubtotal: money,
    otherChargesSubtotal: money,
    /** Si hay saldo a cobrar: id de sesión de Checkout pagada. */
    stripeCheckoutSessionId: z.string().min(1).max(200).optional(),
    photosBefore: z.array(photoRefSchema).max(MAX_FILES_PER_SIDE),
    photosAfter: z.array(photoRefSchema).max(MAX_FILES_PER_SIDE),
  });

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(body);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
    }
    return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
  }

  const snap = computeServicioBilling({
    laborHours: parsed.laborHours,
    materialsSubtotal: parsed.materialsSubtotal,
    partsSubtotal: parsed.partsSubtotal,
    otherChargesSubtotal: parsed.otherChargesSubtotal,
  });
  const {
    laborTotal: laborSubtotal,
    subtotal: invoiceSubtotal,
    dispatchCredit: depositCredit,
    amountDue,
  } = snap;

  if (snap.amountDue > 0) {
    const sid = parsed.stripeCheckoutSessionId?.trim();
    if (!sid) {
      return NextResponse.json({ error: c.apiPaymentRequired }, { status: 400 });
    }
    const ok = await assertPaidBalanceCheckoutSession(
      sid,
      snap.amountDue,
      parsed.clientEmail,
    );
    if (!ok) {
      return NextResponse.json(
        { error: c.apiPaymentNotVerified },
        { status: 402 },
      );
    }
  }

  // Reconstruye Buffers para el PDF (Blob privado → SDK `get`, no fetch anónimo).
  const [photoBuffersBefore, photoBuffersAfter] = await Promise.all([
    Promise.all(
      parsed.photosBefore.map((r) =>
        fetchServicioPhotoBufferForPdf(r, parsed.reportId),
      ),
    ),
    Promise.all(
      parsed.photosAfter.map((r) =>
        fetchServicioPhotoBufferForPdf(r, parsed.reportId),
      ),
    ),
  ]);

  const payload = {
    language,
    bookingReference: parsed.bookingReference || undefined,
    restaurantName: parsed.restaurantName,
    clientEmail: parsed.clientEmail,
    technicianName: parsed.technicianName,
    serviceDate: parsed.serviceDate,
    checklistAirGap: parsed.checklistAirGap as ChecklistStatus,
    checklistHandSink: parsed.checklistHandSink as ChecklistStatus,
    checklistGreaseTrap: parsed.checklistGreaseTrap as ChecklistStatus,
    notes: parsed.notes ?? "",
    hourlyRateUsd: snap.hourlyRateUsd,
    laborHours: snap.laborHours,
    laborSubtotal,
    materialsSubtotal: parsed.materialsSubtotal,
    partsSubtotal: parsed.partsSubtotal,
    otherChargesSubtotal: parsed.otherChargesSubtotal,
    invoiceSubtotal,
    depositCredit,
    amountDue,
    paymentStatus:
      snap.amountDue > 0 ? ("card_paid" as const) : ("no_balance_due" as const),
    photosBefore: photoBuffersBefore.filter((b): b is Buffer => b !== null),
    photosAfter: photoBuffersAfter.filter((b): b is Buffer => b !== null),
  };

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateServicioPdf(payload);
    await sendServicioReportEmail({
      to: parsed.clientEmail,
      restaurantName: parsed.restaurantName,
      pdfBuffer,
      amountDue,
      invoiceSubtotal,
      depositCredit,
      language,
      bookingReference: payload.bookingReference,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: c.apiGenerateFailed }, { status: 500 });
  }

  // Persistencia best-effort: si Blob/DB fallan, NO devolvemos error porque
  // el reporte ya se envió por correo al cliente. Sólo lo logueamos para
  // que el operador lo investigue.
  try {
    const serviceDateParsed = parseServiceDate(parsed.serviceDate);
    const purgeAfter = new Date(serviceDateParsed.getTime() + RETENTION_MS);

    const pdfRef = await uploadServicioPdf(pdfBuffer, parsed.reportId).catch(
      (err) => {
        console.error("[servicio-report] PDF upload failed", err);
        return null;
      },
    );

    const photosBeforeRefs: StoredPhotoRef[] = parsed.photosBefore.map((r) => ({
      url: r.url,
      pathname: r.pathname,
      contentType: r.contentType,
      size: r.size,
    }));
    const photosAfterRefs: StoredPhotoRef[] = parsed.photosAfter.map((r) => ({
      url: r.url,
      pathname: r.pathname,
      contentType: r.contentType,
      size: r.size,
    }));

    await prisma.servicioReport.create({
      data: {
        id: parsed.reportId,
        clientEmail: normalizeEmail(parsed.clientEmail),
        restaurantName: parsed.restaurantName,
        technicianName: parsed.technicianName,
        serviceDate: serviceDateParsed,
        serviceLanguage: language,
        bookingReference: parsed.bookingReference || null,
        checklistAirGap: parsed.checklistAirGap,
        checklistHandSink: parsed.checklistHandSink,
        checklistGreaseTrap: parsed.checklistGreaseTrap,
        notes: parsed.notes ? parsed.notes : null,
        laborHours: parsed.laborHours,
        laborSubtotal,
        materialsSubtotal: parsed.materialsSubtotal,
        partsSubtotal: parsed.partsSubtotal,
        otherChargesSubtotal: parsed.otherChargesSubtotal,
        invoiceSubtotal,
        depositCredit,
        amountDue,
        pdfUrl: pdfRef?.url ?? null,
        pdfPathname: pdfRef?.pathname ?? null,
        photosBefore: photosBeforeRefs,
        photosAfter: photosAfterRefs,
        purgeAfter,
      },
    });
  } catch (err) {
    console.error("[servicio-report] persistence failed (email already sent)", err);
  }

  return NextResponse.json({
    ok: true,
    amountDue,
    invoiceSubtotal,
    depositCredit,
  });
}
