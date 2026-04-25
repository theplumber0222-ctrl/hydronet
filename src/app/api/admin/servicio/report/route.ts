import { NextResponse } from "next/server";
import { z } from "zod";
import type { ChecklistStatus } from "@/lib/servicio-report-types";
import { generateServicioPdf } from "@/lib/generate-servicio-pdf";
import { sendServicioReportEmail } from "@/lib/email";
import {
  isServicioLanguage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";
import { CONNECT_DEPOSIT_USD, HOURLY_PLUMBING_RATE_USD } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  uploadServicioPdf,
  type StoredPhotoRef,
} from "@/lib/servicio-report-storage";

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

async function fetchPhotoBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error(
        `[servicio-report] photo fetch ${res.status} ${res.statusText} for ${url}`,
      );
      return null;
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(new Uint8Array(ab));
  } catch (err) {
    console.error(`[servicio-report] fetch failed for ${url}`, err);
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

  const depositCredit = CONNECT_DEPOSIT_USD;
  const laborSubtotal =
    Math.round(parsed.laborHours * HOURLY_PLUMBING_RATE_USD * 100) / 100;
  const invoiceSubtotal =
    Math.round(
      (laborSubtotal +
        parsed.materialsSubtotal +
        parsed.partsSubtotal +
        parsed.otherChargesSubtotal) *
        100,
    ) / 100;
  const amountDue = Math.max(
    0,
    Math.round((invoiceSubtotal - depositCredit) * 100) / 100,
  );

  // Reconstruye Buffers de las fotos para el PDF descargando desde Blob.
  // Cada URL ya está alojada en Vercel Blob (validado por zod).
  const [photoBuffersBefore, photoBuffersAfter] = await Promise.all([
    Promise.all(parsed.photosBefore.map((r) => fetchPhotoBuffer(r.url))),
    Promise.all(parsed.photosAfter.map((r) => fetchPhotoBuffer(r.url))),
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
    invoiceSubtotal,
    depositCredit,
    amountDue,
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
