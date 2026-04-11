"use client";

import { useEffect, useState } from "react";
import { getPublicGoogleMapsApiKey } from "@/lib/google-maps-env";

/** True if a browser Maps key exists (inline or from /api/public/google-maps-key). */
export function useGoogleMapsKeyAvailable(): boolean {
  const [ok, setOk] = useState(() => !!getPublicGoogleMapsApiKey().trim());

  useEffect(() => {
    if (ok) return;
    const ac = new AbortController();
    fetch("/api/public/google-maps-key", { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json() as Promise<{ key?: string }>)
      .then((d) => {
        if (ac.signal.aborted) return;
        if (d?.key?.trim()) setOk(true);
      })
      .catch(() => {});
    return () => ac.abort();
  }, [ok]);

  return ok;
}
