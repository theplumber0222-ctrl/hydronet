"use client";

import { useEffect, useState } from "react";

// Module-level cache so we only ping once per page session.
let cached: boolean | null = null;

/**
 * Returns true when the server-side Places proxy is operational.
 * Pings /api/places/autocomplete once; caches the result for the session.
 * Returns true optimistically on first render to avoid layout shift.
 * Falls back to false (text-mode validation) only if the server explicitly
 * returns 503 (key not configured).
 */
export function useGoogleMapsKeyAvailable(): boolean {
  const [ok, setOk] = useState(cached ?? true);

  useEffect(() => {
    if (cached !== null) {
      setOk(cached);
      return;
    }
    const ac = new AbortController();
    fetch("/api/places/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "1" }),
      signal: ac.signal,
      cache: "no-store",
    })
      .then((r) => {
        // 503 = GOOGLE_MAPS_API_KEY not set on server → fall back to text input
        cached = r.status !== 503;
        setOk(cached);
      })
      .catch(() => {
        // Network error — stay optimistic, do not block the form
        cached = true;
        setOk(true);
      });
    return () => ac.abort();
  }, []);

  return ok;
}
