"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

/** CTA siempre a mano en móvil/tablet (venta en campo). Oculto en pantallas grandes. */
export function StickyReserveCta() {
  const { t } = useI18n();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/90 bg-slate-900/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <Link
        href="/book"
        className="btn-primary flex min-h-[52px] w-full items-center justify-center px-6 text-base font-semibold shadow-lg shadow-orange-900/30"
      >
        {t("sticky.ctaBook")}
      </Link>
    </div>
  );
}
