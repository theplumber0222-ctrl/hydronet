import { createHmac, timingSafeEqual } from "node:crypto";
import type { StoredPhotoRef } from "@/lib/servicio-report-storage";

/**
 * HMAC (pathname|exp) para /api/admin/servicio-photo-view.
 * Necesario porque <img> no puede enviar x-hydronet-admin-key a Blob en privado.
 */
function getSecret(): string {
  return (
    process.env.SERVICIO_PHOTO_VIEW_SECRET?.trim() ||
    process.env.ADMIN_SERVICIO_KEY?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    ""
  );
}

/**
 * Alineado con claves bajo `servicio-reports/{reportId}/before|after/…`
 * (incl. sufijos aleatorios de `put()` en el nombre de archivo).
 */
const SAFE_PATH =
  /^servicio-reports\/[a-zA-Z0-9_-]+\/(before|after)\/[^/]{1,240}$/;

export function isSafeServicioBlobPathname(pathname: string): boolean {
  if (!pathname || pathname.length > 500) return false;
  if (pathname.includes("..") || pathname.includes("\\")) return false;
  if (!SAFE_PATH.test(pathname)) return false;
  return true;
}

export function signServicioPhotoView(pathname: string, expSec: number): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("No signing secret for servicio photo view");
  }
  return createHmac("sha256", secret)
    .update(`${pathname}|${String(expSec)}`)
    .digest("base64url");
}

export function verifyServicioPhotoView(
  pathname: string,
  expSec: number,
  sig: string,
): boolean {
  if (!Number.isFinite(expSec) || !sig) return false;
  if (Date.now() / 1000 > expSec) return false;
  if (!isSafeServicioBlobPathname(pathname)) return false;
  const secret = getSecret();
  if (!secret) return false;
  let expected: string;
  try {
    expected = createHmac("sha256", secret)
      .update(`${pathname}|${String(expSec)}`)
      .digest("base64url");
  } catch {
    return false;
  }
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Ruta de API relativa, lista para <img src> en la app (mismo origen).
 * TTL 7 días (p. ej. historial dejado abierto en tablet).
 */
export function buildServicioPhotoViewPath(pathname: string): string {
  if (!isSafeServicioBlobPathname(pathname)) {
    throw new Error("Invalid pathname for servicio photo view");
  }
  const expSec = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  const s = signServicioPhotoView(pathname, expSec);
  return `/api/admin/servicio-photo-view?p=${encodeURIComponent(pathname)}&e=${String(expSec)}&s=${encodeURIComponent(s)}`;
}

export function withPhotoViewPath<T extends StoredPhotoRef>(ref: T): T & { viewUrl?: string } {
  try {
    return { ...ref, viewUrl: buildServicioPhotoViewPath(ref.pathname) };
  } catch {
    return { ...ref };
  }
}
