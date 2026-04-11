"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import { t as translate } from "@/i18n/t";
import type { Messages } from "@/i18n/messages/types";

type I18nValue = {
  locale: Locale;
  messages: Messages;
  t: (path: string) => string;
  setLocale: (next: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();

  const tr = useCallback((path: string) => translate(messages, path), [messages]);

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo(
    () => ({
      locale,
      messages,
      t: tr,
      setLocale,
    }),
    [locale, messages, tr, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
