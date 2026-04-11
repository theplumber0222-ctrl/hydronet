/**
 * Clave pública de Google Maps (Places + JS) para el navegador (inlining en build).
 * En Vercel: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Production).
 * Si falta en el cliente, /api/public/google-maps-key usa también GOOGLE_MAPS_API_KEY en servidor.
 */
export function getPublicGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}
