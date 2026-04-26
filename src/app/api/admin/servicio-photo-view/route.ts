import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isBlobConfigured } from "@/lib/servicio-report-storage";
import { verifyServicioPhotoView } from "@/lib/servicio-photo-view-token";

export const runtime = "nodejs";

/**
 * Entrega imágenes de informe en servicio (Blob **private**) con cabeceras
 * adecuadas para <img> y visor, sin forzar descarga.
 *
 * Auth: firmas HMAC (emitidas por GET /api/admin/customer-history) en query,
 * pues el navegador no puede inyectar x-hydronet-admin-key en <img> ni fetch.
 */
export async function GET(req: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Almacenamiento de fotos no disponible" },
      { status: 503 },
    );
  }
  const url = new URL(req.url);
  const pathname = (url.searchParams.get("p") ?? "").trim();
  const eRaw = url.searchParams.get("e") ?? "";
  const sig = (url.searchParams.get("s") ?? "").trim();
  const expSec = parseInt(eRaw, 10);
  if (!pathname || !sig) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!verifyServicioPhotoView(pathname, expSec, sig)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await get(pathname, { access: "private" });
  if (!res || res.statusCode !== 200 || !res.stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ct = res.blob.contentType || "image/jpeg";
  const name =
    pathname.split("/").filter(Boolean).pop() || "foto";
  return new NextResponse(res.stream, {
    status: 200,
    headers: {
      "Content-Type": ct,
      /** Inline: para Safari/iPad, miniatura y visor, no dispositivo de descarga */
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "_")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
