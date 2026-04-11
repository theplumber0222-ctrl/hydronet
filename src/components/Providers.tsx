"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/contexts/I18nContext";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/types";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SessionProvider>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </SessionProvider>
  );
}
