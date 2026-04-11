export const LOCALE_COOKIE = "hydronet_locale";

export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "en" || v === "es";
}
