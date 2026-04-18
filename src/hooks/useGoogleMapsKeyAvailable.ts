"use client";

/**
 * Always returns true.
 * Address autocomplete now uses a server-side proxy (/api/places/autocomplete),
 * so there is no browser-side API key to check — the route is always available
 * as long as GOOGLE_MAPS_API_KEY is configured on the server.
 * Errors are handled inside AddressFieldPlaces itself.
 */
export function useGoogleMapsKeyAvailable(): boolean {
  return true;
}
