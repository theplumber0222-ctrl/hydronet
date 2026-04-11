import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/LegalPageShell";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { TERMS_VERSION } from "@/lib/stripe";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: t(d, "legal.terms.metaTitle"),
    description: t(d, "legal.terms.metaDescription"),
  };
}

export default async function TermsPage() {
  const d = getDictionary(await getLocale());

  return (
    <LegalPageShell title={t(d, "legal.terms.pageTitle")}>
      <p>
        {t(d, "legal.terms.introPart1")}{" "}
        <strong className="text-slate-200">{TERMS_VERSION}</strong>.{" "}
        {t(d, "legal.terms.introPart2")}{" "}
        <Link href="/privacy" className="link-sky">
          {t(d, "legal.terms.privacyLink")}
        </Link>
        {t(d, "legal.terms.introPart3")}
      </p>

      <h2>{t(d, "legal.terms.s1Title")}</h2>
      <p>{t(d, "legal.terms.s1P1")}</p>

      <h2>{t(d, "legal.terms.s2Title")}</h2>
      <p>{t(d, "legal.terms.s2P1")}</p>

      <h2>{t(d, "legal.terms.s3Title")}</h2>
      <p>
        {t(d, "legal.terms.s3P1")}{" "}
        <strong className="text-slate-200">{t(d, "stripeUi.slaNote")}</strong>
      </p>

      <h2>{t(d, "legal.terms.s4Title")}</h2>
      <p>{t(d, "legal.terms.s4P1")}</p>
      <p>{t(d, "legal.terms.s4P2")}</p>

      <h2>{t(d, "legal.terms.s5Title")}</h2>
      <p className="legal-quote">{t(d, "stripeUi.checkoutDepositSummary")}</p>
      <p className="legal-quote mt-4">{t(d, "stripeUi.depositLegal")}</p>

      <h2>{t(d, "legal.terms.s6Title")}</h2>
      <p>{t(d, "legal.terms.s6P1")}</p>
      <p className="legal-quote">{t(d, "stripeUi.commitmentMonthly")}</p>
      <p className="legal-quote mt-4">{t(d, "stripeUi.cancelAlert")}</p>
      <p className="mt-4 text-sm text-slate-400">
        {t(d, "legal.terms.s6P2Prefix")}{" "}
        <Link href="/refunds" className="link-sky">
          {t(d, "legal.terms.refundsLink")}
        </Link>
        {t(d, "legal.terms.s6P2Suffix")}
      </p>

      <h2>{t(d, "legal.terms.s7Title")}</h2>
      <ul>
        <li>{t(d, "legal.terms.s7L1")}</li>
        <li>{t(d, "legal.terms.s7L2")}</li>
        <li>{t(d, "legal.terms.s7L3")}</li>
      </ul>

      <h2>{t(d, "legal.terms.s8Title")}</h2>
      <p>{t(d, "legal.terms.s8P1")}</p>

      <h2>{t(d, "legal.terms.s9Title")}</h2>
      <p>
        {t(d, "legal.terms.s9P1")}{" "}
        <strong className="text-slate-200">{TERMS_VERSION}</strong>.
      </p>

      <h2>{t(d, "legal.terms.s10Title")}</h2>
      <p>{t(d, "legal.terms.s10P1")}</p>
      <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100/95">
        {t(d, "operatorContactTodo")}
      </p>
    </LegalPageShell>
  );
}
