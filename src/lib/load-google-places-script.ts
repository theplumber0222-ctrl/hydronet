const SCRIPT_ID = "hydronet-google-maps-js";

/**
 * Loads Maps JS + places library once. Uses callback= per Google docs (reliable in prod).
 */
export function loadGooglePlacesScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGooglePlacesScript: no window"));
  }

  const w = window as Window & { google?: typeof google };
  if (w.google?.maps?.places) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 25_000;
      const id = window.setInterval(() => {
        if (w.google?.maps?.places) {
          window.clearInterval(id);
          resolve();
        } else if (Date.now() > deadline) {
          window.clearInterval(id);
          reject(new Error("Google Maps script present but places never became ready"));
        }
      }, 40);
    });
  }

  return new Promise((resolve, reject) => {
    const cbName = `__hydronetMapsCb_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, () => void>)[cbName] = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      resolve();
    };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=en&region=US&v=weekly&callback=${cbName}`;
    s.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(s);
  });
}
