import { NextResponse } from "next/server";
import {
  isBlobConfigured,
  uploadServicioPhoto,
} from "@/lib/servicio-report-storage";

export const runtime = "nodejs";

/** Bajo 4,5MB (límite cuerpo Vercel Functions) dejando margen a multipart. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const REPORT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_REPORT_ID_LEN = 64;

/**
 * Sube UNA foto ya optimizada (JPEG) al servidor, que reenvía a Vercel Blob
 * con `put()` (Node). Sustituye el flujo anterior cliente->Blob (upload +
 * handleUpload) que en Safari/iPad a menudo no completaba.
 *
 * Body: `multipart/form-data` con
 *  - `file`       — JPEG (mismo que usa el flujo de reporte)
 *  - `reportId`  — cuid/UUID del reporte
 *  - `side`      — "before" | "after"
 *  - `index`     — "0".."5" (máx. 6 por lado, alineado con el form)
 *
 * Auth: `x-hydronet-admin-key` = `ADMIN_SERVICIO_KEY` (si la variable existe).
 */
export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  if (adminKey && req.headers.get("x-hydronet-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Almacenamiento de fotos no disponible" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const reportId = String(form.get("reportId") ?? "").trim();
  const sideRaw = String(form.get("side") ?? "").trim();
  const indexRaw = String(form.get("index") ?? "").trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (!reportId || reportId.length > MAX_REPORT_ID_LEN || !REPORT_ID_RE.test(reportId)) {
    return NextResponse.json({ error: "reportId inválido" }, { status: 400 });
  }
  if (sideRaw !== "before" && sideRaw !== "after") {
    return NextResponse.json({ error: "side inválido" }, { status: 400 });
  }
  const index = parseInt(indexRaw, 10);
  if (!Number.isInteger(index) || index < 0 || index > 5) {
    return NextResponse.json({ error: "index inválido" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "La foto supera el tamaño máximo permitido" },
      { status: 400 },
    );
  }

  const type = (file.type || "image/jpeg").toLowerCase();
  if (type !== "image/jpeg" && type !== "image/jpg") {
    return NextResponse.json(
      { error: "Solo se acepta JPEG" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  const ref = await uploadServicioPhoto(
    buf,
    "image/jpeg",
    sideRaw,
    reportId,
    index,
  );
  if (!ref) {
    return NextResponse.json(
      { error: "No se pudo almacenar la foto" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    url: ref.url,
    pathname: ref.pathname,
    contentType: ref.contentType,
    size: ref.size,
  });
}
