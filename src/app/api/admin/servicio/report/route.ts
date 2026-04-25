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
  uploadServicioPhoto,
  uploadServicioPdf,
  type StoredPhotoRef,
} from "@/lib/servicio-report-storage";

export const runtime = "nodejs";

const checklist = z.enum(["pass", "fail", "na"]);

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_SIDE = 6;
/** Retención del reporte+fotos en historial (2 años desde serviceDate). */
const RETENTION_MS = 2 * 365 * 24 * 60 * 60 * 1000;

type CollectedFile = { buffer: Buffer; contentType: string };

async function collectFiles(
  form: FormData,
  prefix: string,
  lang: ServicioLanguage,
): Promise<{ files: CollectedFile[]; error?: string }> {
  const c = servicioReportCopy(lang);
  const files: CollectedFile[] = [];
  const keys = [...new Set([...form.keys()])]
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => {
      const na = parseInt(a.slice(prefix.length), 10) || 0;
      const nb = parseInt(b.slice(prefix.length), 10) || 0;
      return na - nb;
    });
  for (const key of keys) {
    if (files.length >= MAX_FILES_PER_SIDE) break;
    const v = form.get(key);
    if (!(v instanceof File) || v.size === 0) continue;
    if (!v.type.startsWith("image/")) {
      return { files: [], error: c.apiImagesOnly };
    }
    if (v.size > MAX_BYTES) {
      return { files: [], error: c.apiImageTooLarge };
    }
    const ab = await v.arrayBuffer();
    files.push({
      buffer: Buffer.from(new Uint8Array(ab)),
      contentType: v.type,
    });
  }
  return { files };
}

/**
 * Sube un set de fotos a Blob, ignorando errores individuales para no
 * abortar la persistencia entera (preferimos guardar parcialmente).
 */
async function uploadPhotoSet(
  files: CollectedFile[],
  side: "before" | "after",
  reportId: string,
): Promise<StoredPhotoRef[]> {
  const out: StoredPhotoRef[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const ref = await uploadServicioPhoto(
        files[i].buffer,
        files[i].contentType,
        side,
        reportId,
        i,
      );
      if (ref) out.push(ref);
    } catch (err) {
      console.error(`[servicio-report] photo upload failed (${side}#${i})`, err);
    }
  }
  return out;
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
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: servicioReportCopy("es").apiInvalidForm },
      { status: 400 },
    );
  }

  const langRaw = String(form.get("serviceLanguage") ?? "").trim();
  const language: ServicioLanguage = isServicioLanguage(langRaw)
    ? langRaw
    : "es";
  const c = servicioReportCopy(language);

  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  if (adminKey && req.headers.get("x-hydronet-admin-key") !== adminKey) {
    return NextResponse.json({ error: c.apiUnauthorized }, { status: 401 });
  }

  const raw = {
    bookingReference: String(form.get("bookingReference") ?? "").trim(),
    restaurantName: String(form.get("restaurantName") ?? "").trim(),
    clientEmail: String(form.get("clientEmail") ?? "").trim(),
    technicianName: String(form.get("technicianName") ?? "").trim(),
    serviceDate: String(form.get("serviceDate") ?? "").trim(),
    checklistAirGap: form.get("checklistAirGap"),
    checklistHandSink: form.get("checklistHandSink"),
    checklistGreaseTrap: form.get("checklistGreaseTrap"),
    notes: String(form.get("notes") ?? ""),
    laborHours: form.get("laborHours"),
    materialsSubtotal: form.get("materialsSubtotal"),
    partsSubtotal: form.get("partsSubtotal"),
    otherChargesSubtotal: form.get("otherChargesSubtotal"),
  };

  const money = z.coerce.number().nonnegative();
  /** Horas; decimales permitidos; tope razonable para la visita. */
  const hoursField = z.coerce
    .number()
    .nonnegative()
    .max(1_000);

  const schema = z.object({
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
  });

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse({
      ...raw,
      checklistAirGap: raw.checklistAirGap,
      checklistHandSink: raw.checklistHandSink,
      checklistGreaseTrap: raw.checklistGreaseTrap,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
    }
    return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
  }

  const before = await collectFiles(form, "photo_before_", language);
  if (before.error) {
    return NextResponse.json({ error: before.error }, { status: 400 });
  }
  const after = await collectFiles(form, "photo_after_", language);
  if (after.error) {
    return NextResponse.json({ error: after.error }, { status: 400 });
  }

  const depositCredit = CONNECT_DEPOSIT_USD;
  const laborSubtotal = Math.round(
    parsed.laborHours * HOURLY_PLUMBING_RATE_USD * 100,
  ) / 100;
  const invoiceSubtotal = Math.round(
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
    photosBefore: before.files.map((f) => f.buffer),
    photosAfter: after.files.map((f) => f.buffer),
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
    const reportId = (
      globalThis.crypto?.randomUUID?.() ??
      // Fallback determinístico si crypto no está disponible.
      `srv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    ).replace(/-/g, "");

    const [photosBeforeRefs, photosAfterRefs, pdfRef] = await Promise.all([
      uploadPhotoSet(before.files, "before", reportId),
      uploadPhotoSet(after.files, "after", reportId),
      uploadServicioPdf(pdfBuffer, reportId).catch((err) => {
        console.error("[servicio-report] PDF upload failed", err);
        return null;
      }),
    ]);

    await prisma.servicioReport.create({
      data: {
        id: reportId,
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
