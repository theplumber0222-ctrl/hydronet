/**
 * Server-only: returns the Google Maps / Places API key.
 * The key is kept on the server and never sent to the browser.
 * In Vercel: set GOOGLE_MAPS_API_KEY in environment variables (no NEXT_PUBLIC_ prefix needed).
 * Falls back to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for backward compatibility during migration.
 */
export function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    ""
  ).trim();
}

/** @deprecated alias kept for checkout/route.ts — use getGoogleMapsApiKey() */
export const getPublicGoogleMapsApiKey = getGoogleMapsApiKey;
