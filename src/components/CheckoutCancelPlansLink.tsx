"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

/** Secondary action below the primary Stripe checkout button — home pricing (#planes). */
export function CheckoutCancelPlansLink() {
  const { t } = useI18n();
  return (
    <Link
      href="/#planes"
      className="mt-3 block w-full text-center text-sm text-slate-400 underline decoration-slate-600 underline-offset-[5px] transition hover:text-slate-300 hover:decoration-slate-400"
    >
      {t("booking.cancelChoosePlan")}
    </Link>
  );
}
