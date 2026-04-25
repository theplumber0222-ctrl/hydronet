/**
 * Miniaturas del formulario servicio en sitio: Safari/iPad, HEIC, blobs restaurados.
 * El PDF (pdfkit) no usa este módulo.
 */

export function inferMimeFromFilename(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".heic")) return "image/heic";
  if (n.endsWith(".heif")) return "image/heif";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

/** Intenta generar un JPEG en base64 pequeño para previsualizar (HEIC/HEIF en Safari a veces responde aquí aunque falle <img> con blob). */
export async function tryCanvasJpegDataUrl(
  file: File,
  maxEdgePx = 200,
  quality = 0.82,
): Promise<string | null> {
  if (typeof createImageBitmap === "undefined") return null;
  let bmp: ImageBitmap | undefined;
  try {
    bmp = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
    let w = bmp.width;
    let h = bmp.height;
    if (w <= 0 || h <= 0) {
      bmp.close?.();
      return null;
    }
    if (w > maxEdgePx || h > maxEdgePx) {
      const s = maxEdgePx / Math.max(w, h);
      w = Math.max(1, Math.round(w * s));
      h = Math.max(1, Math.round(h * s));
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) {
      bmp.close?.();
      return null;
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    return c.toDataURL("image/jpeg", quality);
  } catch {
    try {
      bmp?.close?.();
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function fileSlotKey(f: File, index: number): string {
  return `slot-${index}-${f.size}-${f.lastModified}-${f.name}`;
}
