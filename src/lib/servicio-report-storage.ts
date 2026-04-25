/**
 * Helpers para subir y borrar archivos de reportes de servicio en Vercel Blob.
 *
 * - Cada reporte vive bajo `servicio-reports/{reportId}/`.
 * - PDF: `report.pdf` (path estable, sin sufijo aleatorio).
 * - Fotos: `before/{i}.{ext}` y `after/{i}.{ext}` con sufijo aleatorio que
 *   añade `put()` por defecto (evita colisiones si se reintenta).
 *
 * Si `BLOB_READ_WRITE_TOKEN` no está configurado, las funciones devuelven
 * `null` o no hacen nada para que la persistencia degrade limpiamente
 * (el correo + PDF al cliente siguen funcionando sin Blob).
 */
import { put, del } from "@vercel/blob";

export type StoredPhotoRef = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

export type StoredPdfRef = {
  url: string;
  pathname: string;
};

function extFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/gif": "gif",
  };
  return map[contentType.toLowerCase()] ?? "bin";
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function uploadServicioPhoto(
  buf: Buffer,
  contentType: string,
  side: "before" | "after",
  reportId: string,
  index: number,
): Promise<StoredPhotoRef | null> {
  if (!isBlobConfigured()) return null;
  const safeExt = extFromContentType(contentType);
  const pathname = `servicio-reports/${reportId}/${side}/${String(index).padStart(2, "0")}.${safeExt}`;
  const result = await put(pathname, buf, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });
  return {
    url: result.url,
    pathname: result.pathname,
    contentType,
    size: buf.length,
  };
}

export async function uploadServicioPdf(
  buf: Buffer,
  reportId: string,
): Promise<StoredPdfRef | null> {
  if (!isBlobConfigured()) return null;
  const pathname = `servicio-reports/${reportId}/report.pdf`;
  const result = await put(pathname, buf, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function deleteServicioReportFiles(refs: {
  pdfUrl?: string | null;
  photosBefore: StoredPhotoRef[];
  photosAfter: StoredPhotoRef[];
}): Promise<void> {
  if (!isBlobConfigured()) return;
  const urls: string[] = [];
  if (refs.pdfUrl) urls.push(refs.pdfUrl);
  for (const p of refs.photosBefore) {
    if (p.url) urls.push(p.url);
  }
  for (const p of refs.photosAfter) {
    if (p.url) urls.push(p.url);
  }
  if (urls.length === 0) return;
  try {
    await del(urls);
  } catch (err) {
    console.error("[servicio-report-storage] del() failed", err);
  }
}

/** Garantiza que un valor leído de la columna JSONB sea un array de StoredPhotoRef. */
export function coercePhotoRefs(value: unknown): StoredPhotoRef[] {
  if (!Array.isArray(value)) return [];
  const out: StoredPhotoRef[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.url !== "string" || typeof r.pathname !== "string") continue;
    out.push({
      url: r.url,
      pathname: r.pathname,
      contentType: typeof r.contentType === "string" ? r.contentType : "image/jpeg",
      size: typeof r.size === "number" ? r.size : 0,
    });
  }
  return out;
}
