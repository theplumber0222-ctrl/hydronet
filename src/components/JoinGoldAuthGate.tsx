"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

type Billing = "annual" | "monthly";

/**
 * Vista intermedia: usuario no autenticado en /join/gold — registro destacado o login con retorno al checkout.
 */
export function JoinGoldAuthGate({ billing }: { billing: Billing }) {
  const { t } = useI18n();
  const joinUrl = `/join/gold?billing=${billing}`;
  const registerHref = `/register?plan=gold&billing=${billing}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="mt-10 rounded-2xl border border-orange-500/35 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-8 shadow-[0_0_0_1px_rgba(249,115,22,0.12)] ring-1 ring-orange-500/20 md:p-10">
      <p className="text-center text-lg font-medium leading-relaxed text-slate-100 md:text-xl">
        {t("joinGold.authGateBody")}
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:mt-12">
        <Link
          href={registerHref}
          className="btn-primary inline-flex min-h-[56px] w-full items-center justify-center rounded-xl px-6 py-4 text-center text-base font-bold shadow-xl shadow-orange-900/40 ring-2 ring-orange-400/35 transition hover:ring-orange-400/55"
        >
          {t("joinGold.ctaRegisterPartner")}
        </Link>
        <Link
          href={loginHref}
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-slate-500/70 bg-slate-800/50 px-6 py-3.5 text-center text-base font-semibold text-slate-200 shadow-md transition hover:border-slate-400 hover:bg-slate-800/80"
        >
          {t("joinGold.ctaLoginExisting")}
        </Link>
      </div>
    </div>
  );
}
