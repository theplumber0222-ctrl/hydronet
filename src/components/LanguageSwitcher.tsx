"use client";

import { useI18n } from "@/contexts/I18nContext";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex rounded-lg border border-slate-600 bg-slate-800/60 p-0.5 text-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => void setLocale("es")}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          locale === "es"
            ? "bg-sky-600 text-white shadow"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Español
      </button>
      <button
        type="button"
        onClick={() => void setLocale("en")}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          locale === "en"
            ? "bg-sky-600 text-white shadow"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        English
      </button>
    </div>
  );
}
