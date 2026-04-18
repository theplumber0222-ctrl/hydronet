"use client";

/**
 * Address autocomplete backed by a server-side proxy (/api/places/autocomplete).
 * The Google Maps API key lives only in GOOGLE_MAPS_API_KEY (server env) —
 * it is never bundled into or sent to the browser.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { PlaceSuggestion } from "@/app/api/places/autocomplete/route";

export type AddressFieldPlacesProps = {
  value: string;
  onChange: (line: string, placeId: string) => void;
  disabled?: boolean;
  showSelectionRequired?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function AddressFieldPlaces({
  value,
  onChange,
  disabled,
  showSelectionRequired,
  onFocus,
  onBlur,
}: AddressFieldPlacesProps) {
  const { t } = useI18n();

  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  // true when the current value came from a real dropdown selection (has a Google placeId)
  const [selectedFromDropdown, setSelectedFromDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external value resets (e.g. form clear)
  useEffect(() => {
    if (value === "") {
      setInputText("");
      setSuggestions([]);
      setOpen(false);
      setSelectedFromDropdown(false);
    }
  }, [value]);

  const debouncedInput = useDebounce(inputText, 320);

  useEffect(() => {
    const query = debouncedInput.trim();
    if (!query || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    fetch("/api/places/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: query }),
    })
      .then((r) => r.json() as Promise<{ suggestions?: PlaceSuggestion[] }>)
      .then((data) => {
        if (cancelled) return;
        const list = data.suggestions ?? [];
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIdx(-1);
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectSuggestion = useCallback((s: PlaceSuggestion) => {
    setInputText(s.description);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    setSelectedFromDropdown(true);
    onChangeRef.current(s.description, s.placeId);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]!);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  const invalid = Boolean(showSelectionRequired);

  return (
    <div className="hydronet-address-field-root" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="hac-listbox"
        aria-activedescendant={activeIdx >= 0 ? `hac-opt-${activeIdx}` : undefined}
        className="hydronet-address-input"
        data-hydronet-invalid={invalid ? "1" : undefined}
        value={inputText}
        disabled={disabled}
        placeholder={t("addressAutocomplete.inputPlaceholder")}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          setInputText(v);
          setSelectedFromDropdown(false);
          if (!v.trim()) onChange("", "");
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocus?.()}
        onBlur={() => {
          // If the user typed a reasonable address but never picked from the dropdown
          // (e.g. autocomplete unavailable), accept the typed text as a fallback so
          // the form button is not blocked. The server validates length >= 8 chars.
          const typed = inputText.trim();
          if (!selectedFromDropdown && typed.length >= 10) {
            onChange(typed, typed);
          }
          onBlur?.();
        }}
      />

      {open && suggestions.length > 0 && (
        <ul
          id="hac-listbox"
          role="listbox"
          className="hydronet-ac-dropdown"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`hac-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`hydronet-ac-option${i === activeIdx ? " hydronet-ac-option--active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus on input
                selectSuggestion(s);
              }}
            >
              <span className="hydronet-ac-main">{s.mainText}</span>
              {s.secondaryText && (
                <span className="hydronet-ac-secondary">{s.secondaryText}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-slate-500">
        {loading
          ? t("addressAutocomplete.loadingMaps")
          : fetchError
            ? t("addressAutocomplete.mapsScriptError")
            : t("addressAutocomplete.hintBelow")}
      </p>
    </div>
  );
}
