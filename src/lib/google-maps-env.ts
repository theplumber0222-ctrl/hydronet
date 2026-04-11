/**
 * Clave pública de Google Maps (Places + JS) para el navegador.
 * Debe definirse como NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env y reiniciar `next dev`.
 */
export function getPublicGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}
