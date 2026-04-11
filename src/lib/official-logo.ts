/**
 * Única ruta pública del logo.
 * Archivo en disco: public/branding/hydronet-logo-final.png
 */
export const OFFICIAL_LOGO_URL = "/branding/hydronet-logo-final.png";

/** URL absoluta para correos y enlaces externos (usa NEXT_PUBLIC_SITE_URL). */
export function getOfficialLogoAbsoluteUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hydronet.live").replace(
    /\/$/,
    "",
  );
  return `${base}${OFFICIAL_LOGO_URL}`;
}
