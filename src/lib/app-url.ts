/**
 * Base URL pública (Stripe success/cancel, redirecciones de API).
 * Prioridad alineada con producción actual (`NEXT_PUBLIC_SITE_URL` en Vercel).
 * Acepta alias usados en otros despliegues: `NEXT_PUBLIC_APP_URL` (mismo propósito).
 */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : "");
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}
