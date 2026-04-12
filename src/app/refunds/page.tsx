import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_ENTITY_NAME, getPublicContactEmail } from "@/lib/legal-business-info";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { HOURLY_PLUMBING_RATE_USD } from "@/lib/stripe";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: t(d, "legal.refunds.metaTitle"),
    description: t(d, "legal.refunds.metaDescription"),
  };
}

export default async function RefundsPage() {
  const d = getDictionary(await getLocale());
  const email = getPublicContactEmail();

  return (
    <LegalPageShell title={t(d, "legal.refunds.pageTitle")}>
      <p>
        {t(d, "legal.refunds.p1Part1")}
        <strong className="text-slate-200">{LEGAL_ENTITY_NAME}</strong>
        {t(d, "legal.refunds.p1Part2")}
        <Link href="/terms" className="link-sky">
          {t(d, "book.legalLinksTerms")}
        </Link>
        {t(d, "legal.refunds.p1Part3")}
      </p>

      <h2>{t(d, "legal.refunds.s1Title")}</h2>
      <p className="legal-quote">{t(d, "stripeUi.checkoutDepositSummary")}</p>
      <p className="legal-quote mt-4">{t(d, "stripeUi.depositLegal")}</p>
      <p className="mt-4">{t(d, "legal.refunds.s1NonGoldScheduling")}</p>
      <p className="mt-4 text-sm text-amber-100/90">
        {t(d, "legal.refunds.s1NoShow")}
      </p>

      <h2>{t(d, "legal.refunds.s2Title")}</h2>
      <p>
        {t(d, "legal.refunds.s2P1Prefix")}{" "}
        <strong className="text-slate-200">
          ${HOURLY_PLUMBING_RATE_USD} USD
        </strong>{" "}
        {t(d, "legal.refunds.s2P1Suffix")}
      </p>

      <h2>{t(d, "legal.refunds.s3Title")}</h2>
      <p className="legal-quote">{t(d, "stripeUi.commitmentMonthly")}</p>
      <p className="legal-quote mt-4">{t(d, "stripeUi.cancelAlert")}</p>
      <p className="mt-4 text-sm text-slate-400">{t(d, "legal.refunds.s3P2")}</p>

      <h2>{t(d, "legal.refunds.s4Title")}</h2>
      <p>
        {t(d, "legal.refunds.s4P1Prefix")}{" "}
        <strong className="text-slate-200">{t(d, "legal.refunds.s4P1Bold")}</strong>{" "}
        {t(d, "legal.refunds.s4P1Suffix")}
      </p>

      <h2>{t(d, "legal.refunds.s5Title")}</h2>
      <p>
        {t(d, "legal.refunds.s5P1Prefix")}{" "}
        <a href={`mailto:${email}`} className="link-sky">
          {email}
        </a>{" "}
        {t(d, "legal.refunds.s5P1Suffix")}
      </p>

      <h2>{t(d, "legal.refunds.s6Title")}</h2>
      <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100/95">
        {t(d, "operatorContactTodo")}
      </p>
    </LegalPageShell>
  );
}
