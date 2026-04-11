import { cookies } from "next/headers";
import type { Locale } from "./config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";
import type { Messages } from "./messages/types";
import en from "./messages/en";
import es from "./messages/es";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Messages {
  return locale === "en" ? en : es;
}

export { en, es };
