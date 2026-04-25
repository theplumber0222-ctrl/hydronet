import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
];

/**
 * Emite client-tokens de Vercel Blob para que el navegador suba las fotos del
 * reporte de servicio directamente, sin pasar por el body de
 * `/api/admin/servicio/report` (que excedía el límite de 4.5MB de Vercel
 * Functions y disparaba FUNCTION_PAYLOAD_TOO_LARGE).
 *
 * Auth: misma política que el endpoint del reporte — header
 *       `x-hydronet-admin-key` debe coincidir con `ADMIN_SERVICIO_KEY`.
 *       Si la key no está configurada en el entorno, no se exige (mismo
 *       comportamiento que `/api/admin/servicio/report`).
 *
 * El token sólo permite escribir bajo el prefijo `servicio-reports/` y limita
 * tamaño y tipo MIME. La nueva tabla `ServicioReport` se crea más tarde con
 * el reportId que el cliente eligió como prefijo.
 */
export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  if (adminKey && req.headers.get("x-hydronet-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("servicio-reports/")) {
          throw new Error("Invalid pathname");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[servicio/photo-upload] handleUpload failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload init failed" },
      { status: 400 },
    );
  }
}
