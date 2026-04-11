"use client";

import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { getPublicGoogleMapsApiKey } from "@/lib/google-maps-env";

const libraries: "places"[] = ["places"];

/** Clarksville / Montgomery County, TN — prioriza sugerencias locales. */
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

type InnerProps = Props & { apiKey: string };

function GoogleAddressLoader({
  apiKey,
  value,
  onChange,
  disabled,
  showSelectionRequired,
}: InnerProps) {
  const { t } = useI18n();
  const [ac, setAc] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "hydronet-google-maps-script",
    googleMapsApiKey: apiKey,
    libraries,
    version: "weekly",
  });

  useEffect(() => {
    if (loadError) {
      console.error(
        "[HydroNet] Google Maps JavaScript API — error al cargar el script.",
        loadError,
      );
      const err = loadError as Error & { message?: string };
      console.error(
        "[HydroNet] Posibles causas: API key inválida o sin permisos; restricciones HTTP referrer en Google Cloud; Maps JavaScript API o Places API no habilitadas; facturación.",
      );
      if (err?.message) {
        console.error("[HydroNet] Mensaje:", err.message);
      }
    }
  }, [loadError]);

  const autocompleteOptions =
    useMemo((): google.maps.places.AutocompleteOptions => {
      const base: google.maps.places.AutocompleteOptions = {
        componentRestrictions: { country: "us" },
        types: ["address"],
        strictBounds: false,
      };
      if (typeof google !== "undefined" && isLoaded) {
        base.bounds = clarksvilleAreaBounds();
      }
      return base;
    }, [isLoaded]);

  const onPlaceChanged = useCallback(() => {
    if (!ac) return;
    const place = ac.getPlace();
    const line = place.formatted_address ?? place.name ?? "";
    const pid = place.place_id ?? "";
    onChange(line, pid);
  }, [ac, onChange]);

  if (loadError) {
    return (
      <MapsConfigError detail={t("addressAutocomplete.mapsScriptError")} />
    );
  }

  if (!isLoaded) {
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
      <Autocomplete
        onLoad={setAc}
        onPlaceChanged={onPlaceChanged}
        options={autocompleteOptions}
      >
        <input
          type="text"
          required
          disabled={disabled}
          autoComplete="street-address"
          aria-invalid={showSelectionRequired ? true : undefined}
          className={`input-field ${showSelectionRequired ? "border-red-500/80 ring-1 ring-red-500/40" : ""}`}
          placeholder={t("addressAutocomplete.inputPlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value, "")}
        />
      </Autocomplete>
      <p className="mt-1 text-xs text-slate-500">
        {t("addressAutocomplete.hintBelow")}
      </p>
    </div>
  );
}

export function AddressAutocomplete(props: Props) {
  const { t } = useI18n();
  const apiKey = getPublicGoogleMapsApiKey();

  if (!apiKey) {
    if (typeof window !== "undefined") {
      console.error(
        "[HydroNet] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY está vacía o no existe.",
        "Añada en .env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave y reinicie el servidor (next dev).",
      );
    }
    return <MapsConfigError detail={t("addressAutocomplete.missingApiKey")} />;
  }

  return <GoogleAddressLoader apiKey={apiKey} {...props} />;
}
