/**
 * Comprime y redimensiona fotos del informe de servicio en el cliente (canvas
 * + JPEG) antes de subir a Vercel Blob. Sin dependencias extra.
 *
 * - Lado mayor máx. 1600px; imágenes más pequeñas no se agrandan
 * - Salida: JPEG calidad ~0.7
 * - Orientación: `createImageBitmap(..., { imageOrientation: "from-image" })`
 *   si el navegador lo soporta; si no, `<img>` + canvas (mejor esfuerzo)
 */

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.7;

function baseNameForJpeg(name: string): string {
  const t = name.trim() || "photo";
  return t.replace(/\.[^.]+$/, "") + ".jpg";
}

function getScale(w: number, h: number): { dw: number; dh: number } {
  if (w <= 0 || h <= 0) {
    return { dw: 1, dh: 1 };
  }
  const long = Math.max(w, h);
  if (long <= MAX_EDGE_PX) {
    return { dw: w, dh: h };
  }
  const s = MAX_EDGE_PX / long;
  return {
    dw: Math.max(1, Math.floor(w * s)),
    dh: Math.max(1, Math.floor(h * s)),
  };
}

/**
 * Aplica redimensión (si hace falta) y re-codifica a JPEG en canvas.
 */
function canvasToJpeg(
  source: CanvasImageSource,
  sw: number,
  sh: number,
): Promise<Blob> {
  const { dw, dh } = getScale(sw, sh);
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(
      new Error("No se pudo preparar el lienzo (canvas). Reintenta o prueba con otra imagen."),
    );
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, sw, sh, 0, 0, dw, dh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b || b.size === 0) {
          reject(
            new Error("No se pudo generar JPEG. Prueba con otra foto o formato (JPEG/PNG)."),
          );
          return;
        }
        resolve(b);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Carga píxeles y orientación; devuelve un Blob JPEG (luego se envuelve en File con nombre correcto en la API pública).
 */
async function decodeAndEncodeWithBitmap(
  file: File,
  nameOut: string,
): Promise<File> {
  const opts: ImageBitmapOptions = { imageOrientation: "from-image" };
  const bitmap = await createImageBitmap(file, opts);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const b = await canvasToJpeg(bitmap, w, h);
    return new File([b], nameOut, { type: "image/jpeg" });
  } finally {
    try {
      bitmap.close();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Respaldo sin `imageOrientation` (navegadores viejos o fallos puntuales).
 */
async function decodeAndEncodeWithImage(
  file: File,
  nameOut: string,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(
          new Error(
            "No se pudo leer la imagen. Si es HEIC, exporta a JPEG en Fotos o elige otra toma.",
          ),
        );
      img.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w <= 0 || h <= 0) {
      throw new Error("La imagen no tiene un tamaño válido.");
    }
    const b = await canvasToJpeg(img, w, h);
    return new File([b], nameOut, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Comprime/redimensiona un archivo de imagen a JPEG para el flujo de servicio.
 * Mantiene el nombre base con extensión `.jpg`.
 */
export async function compressServicioPhotoToJpeg(file: File): Promise<File> {
  const nameOut = baseNameForJpeg(file.name);

  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("El archivo no parece ser una imagen.");
  }

  if (typeof createImageBitmap === "function") {
    try {
      return await decodeAndEncodeWithBitmap(file, nameOut);
    } catch (err) {
      try {
        return await decodeAndEncodeWithImage(file, nameOut);
      } catch (fallbackErr) {
        if (
          err instanceof Error &&
          (err.message.includes("lienzo") || err.message.includes("canvas") || err.message.includes("generar"))
        ) {
          throw err;
        }
        throw fallbackErr;
      }
    }
  }
  return decodeAndEncodeWithImage(file, nameOut);
}
