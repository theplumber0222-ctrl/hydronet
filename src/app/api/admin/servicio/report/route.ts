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

export const runtime = "nodejs";

const checklist = z.enum(["pass", "fail", "na"]);

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_SIDE = 6;

async function collectFiles(
  form: FormData,
  prefix: string,
  lang: ServicioLanguage,
): Promise<{ buffers: Buffer[]; error?: string }> {
  const c = servicioReportCopy(lang);
  const buffers: Buffer[] = [];
  const keys = [...new Set([...form.keys()])]
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => {
      const na = parseInt(a.slice(prefix.length), 10) || 0;
      const nb = parseInt(b.slice(prefix.length), 10) || 0;
      return na - nb;
    });
  for (const key of keys) {
    if (buffers.length >= MAX_FILES_PER_SIDE) break;
    const v = form.get(key);
    if (!(v instanceof File) || v.size === 0) continue;
    if (!v.type.startsWith("image/")) {
      return { buffers: [], error: c.apiImagesOnly };
    }
    if (v.size > MAX_BYTES) {
      return { buffers: [], error: c.apiImageTooLarge };
    }
    const ab = await v.arrayBuffer();
    buffers.push(Buffer.from(new Uint8Array(ab)));
  }
  return { buffers };
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
    restaurantName: String(form.get("restaurantName") ?? "").trim(),
    clientEmail: String(form.get("clientEmail") ?? "").trim(),
    technicianName: String(form.get("technicianName") ?? "").trim(),
    serviceDate: String(form.get("serviceDate") ?? "").trim(),
    checklistAirGap: form.get("checklistAirGap"),
    checklistHandSink: form.get("checklistHandSink"),
    checklistGreaseTrap: form.get("checklistGreaseTrap"),
    notes: String(form.get("notes") ?? ""),
    invoiceSubtotal: form.get("invoiceSubtotal"),
  };

  const schema = z.object({
    restaurantName: z.string().min(1),
    clientEmail: z.string().email(),
    technicianName: z.string().min(1),
    serviceDate: z.string().min(1),
    checklistAirGap: checklist,
    checklistHandSink: checklist,
    checklistGreaseTrap: checklist,
    notes: z.string().max(4000).optional().default(""),
    invoiceSubtotal: z.coerce.number().nonnegative(),
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

  const depositCredit = 50;
  const amountDue = Math.max(
    0,
    Math.round((parsed.invoiceSubtotal - depositCredit) * 100) / 100,
  );

  const payload = {
    language,
    restaurantName: parsed.restaurantName,
    clientEmail: parsed.clientEmail,
    technicianName: parsed.technicianName,
    serviceDate: parsed.serviceDate,
    checklistAirGap: parsed.checklistAirGap as ChecklistStatus,
    checklistHandSink: parsed.checklistHandSink as ChecklistStatus,
    checklistGreaseTrap: parsed.checklistGreaseTrap as ChecklistStatus,
    notes: parsed.notes ?? "",
    invoiceSubtotal: parsed.invoiceSubtotal,
    depositCredit,
    amountDue,
    photosBefore: before.buffers,
    photosAfter: after.buffers,
  };

  try {
    const pdfBuffer = await generateServicioPdf(payload);
    await sendServicioReportEmail({
      to: parsed.clientEmail,
      restaurantName: parsed.restaurantName,
      pdfBuffer,
      amountDue,
      invoiceSubtotal: parsed.invoiceSubtotal,
      depositCredit,
      language,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: c.apiGenerateFailed }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    amountDue,
    invoiceSubtotal: parsed.invoiceSubtotal,
    depositCredit,
  });
}
