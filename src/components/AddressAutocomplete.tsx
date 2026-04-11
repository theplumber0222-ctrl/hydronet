"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/contexts/I18nContext";
import { getPublicGoogleMapsApiKey } from "@/lib/google-maps-env";
import { loadGooglePlacesScript } from "@/lib/load-google-places-script";

/** Clarksville / Montgomery County, TN — bias suggestions locally. */
function clarksvilleAreaBounds(): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(36.42, -87.52),
    new google.maps.LatLng(36.62, -87.22),
  );
}

type Props = {
  value: string;
  onChange: (line: string, placeId: string) => void;
  disabled?: boolean;
  showSelectionRequired?: boolean;
};

function MapsConfigError({ detail }: { detail: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-red-500/60 bg-red-950/30 px-3 py-2 text-sm text-red-200">
      <p className="font-medium">{t("addressAutocomplete.mapsUnavailable")}</p>
      <p className="mt-1 text-xs text-red-200/90">{detail}</p>
      <p className="mt-2 text-xs text-red-300/80">
        {t("addressAutocomplete.checkConsole")}
      </p>
    </div>
  );
}

async function resolveMapsApiKey(): Promise<string> {
  const inline = getPublicGoogleMapsApiKey().trim();
  if (inline) return inline;
  const res = await fetch("/api/public/google-maps-key", { cache: "no-store" });
  const data = (await res.json()) as { key?: string };
  return (data.key ?? "").trim();
}

type InnerProps = Props & { apiKey: string };

function GoogleAddressLoader({
  apiKey,
  value,
  onChange,
  disabled,
  showSelectionRequired,
}: InnerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [scriptReady, setScriptReady] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGooglePlacesScript(apiKey)
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e : new Error(String(e)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (loadError) {
      console.error("[HydroNet] Google Maps — error al cargar el script.", loadError);
    }
  }, [loadError]);

  const autocompleteOptions = useMemo((): google.maps.places.AutocompleteOptions => {
    const base: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: "us" },
      types: ["address"],
      strictBounds: false,
    };
    if (scriptReady && typeof google !== "undefined") {
      base.bounds = clarksvilleAreaBounds();
    }
    return base;
  }, [scriptReady]);

  useLayoutEffect(() => {
    if (!scriptReady || disabled) return;
    const input = inputRef.current;
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(
      input,
      autocompleteOptions,
    );
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const line = place.formatted_address ?? place.name ?? "";
      const pid = place.place_id ?? "";
      onChangeRef.current(line, pid);
    });

    return () => {
      listener.remove();
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [scriptReady, disabled, autocompleteOptions]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (value === "") el.value = "";
  }, [value]);

  if (loadError) {
    return (
      <MapsConfigError detail={t("addressAutocomplete.mapsScriptError")} />
    );
  }

  if (!scriptReady) {
    return (
      <input
        type="text"
        disabled
        className="input-field"
        placeholder={t("addressAutocomplete.loadingPlaceholder")}
        value={value}
        readOnly
      />
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        required
        disabled={disabled}
        autoComplete="street-address"
        aria-invalid={showSelectionRequired ? true : undefined}
        className={`input-field ${showSelectionRequired ? "border-red-500/80 ring-1 ring-red-500/40" : ""}`}
        placeholder={t("addressAutocomplete.inputPlaceholder")}
        defaultValue={value}
        onChange={(e) => onChangeRef.current(e.target.value, "")}
      />
      <p className="mt-1 text-xs text-slate-500">
        {t("addressAutocomplete.hintBelow")}
      </p>
    </div>
  );
}

export function AddressAutocomplete(props: Props) {
  const { t } = useI18n();
  const [apiKey, setApiKey] = useState<string | null>(() => {
    const k = getPublicGoogleMapsApiKey().trim();
    return k || null;
  });
  const [resolved, setResolved] = useState(!!getPublicGoogleMapsApiKey().trim());
  const [resolveFailed, setResolveFailed] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setResolved(true);
      return;
    }
    let cancelled = false;
    resolveMapsApiKey()
      .then((k) => {
        if (cancelled) return;
        if (k) {
          setApiKey(k);
          setResolved(true);
        } else {
          setResolveFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResolveFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (typeof window !== "undefined" && resolveFailed && !apiKey) {
      console.error(
        "[HydroNet] Sin clave de Maps: defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY o GOOGLE_MAPS_API_KEY en Vercel y redeploy.",
      );
    }
  }, [resolveFailed, apiKey]);

  if (resolveFailed && !apiKey) {
    return <MapsConfigError detail={t("addressAutocomplete.missingApiKey")} />;
  }

  if (!resolved || !apiKey) {
    return (
      <input
        type="text"
        disabled
        className="input-field"
        placeholder={t("addressAutocomplete.loadingPlaceholder")}
        value={props.value}
        readOnly
      />
    );
  }

  return <GoogleAddressLoader apiKey={apiKey} {...props} />;
}
