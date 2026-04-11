import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_ENTITY_NAME, getPublicContactEmail, getPublicSiteUrl } from "@/lib/legal-business-info";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    title: t(d, "legal.privacy.metaTitle"),
    description: t(d, "legal.privacy.metaDescription"),
  };
}

export default async function PrivacyPage() {
  const d = getDictionary(await getLocale());
  const email = getPublicContactEmail();
  const site = getPublicSiteUrl();

  return (
    <LegalPageShell title={t(d, "legal.privacy.pageTitle")}>
      <p>
        {t(d, "legal.privacy.p1Part1")}
        <span className="text-slate-200"> {site} </span>
        {t(d, "legal.privacy.p1Part2")}{" "}
        <Link href="/terms" className="link-sky">
          {t(d, "legal.privacy.termsLink")}
        </Link>
        {t(d, "legal.privacy.p1Part3")}
      </p>

      <h2>{t(d, "legal.privacy.s1Title")}</h2>
      <p>
        {t(d, "legal.privacy.s1P1Prefix")}{" "}
        <strong className="text-slate-200">{LEGAL_ENTITY_NAME}</strong>
        {t(d, "legal.privacy.s1P1Suffix")}{" "}
        <a href={`mailto:${email}`} className="link-sky">
          {email}
        </a>
        .
      </p>
      <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100/95">
        {t(d, "operatorContactTodo")}
      </p>

      <h2>{t(d, "legal.privacy.s2Title")}</h2>
      <ul>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L1Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L1")}
        </li>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L2Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L2")}
        </li>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L3Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L3")}
        </li>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L4Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L4")}
        </li>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L5Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L5")}
        </li>
        <li>
          <strong className="text-slate-200">{t(d, "legal.privacy.s2L6Label")}</strong>{" "}
          {t(d, "legal.privacy.s2L6")}
        </li>
      </ul>

      <h2>{t(d, "legal.privacy.s3Title")}</h2>
      <ul>
        <li>{t(d, "legal.privacy.s3L1")}</li>
        <li>{t(d, "legal.privacy.s3L2")}</li>
        <li>{t(d, "legal.privacy.s3L3")}</li>
        <li>{t(d, "legal.privacy.s3L4")}</li>
        <li>{t(d, "legal.privacy.s3L5")}</li>
      </ul>

      <h2>{t(d, "legal.privacy.s4Title")}</h2>
      <p>{t(d, "legal.privacy.s4P1")}</p>

      <h2>{t(d, "legal.privacy.s5Title")}</h2>
      <p>{t(d, "legal.privacy.s5P1")}</p>

      <h2>{t(d, "legal.privacy.s6Title")}</h2>
      <p>{t(d, "legal.privacy.s6P1")}</p>

      <h2>{t(d, "legal.privacy.s7Title")}</h2>
      <p>{t(d, "legal.privacy.s7P1")}</p>

      <h2>{t(d, "legal.privacy.s8Title")}</h2>
      <p>{t(d, "legal.privacy.s8P1")}</p>

      <h2>{t(d, "legal.privacy.s9Title")}</h2>
      <p>{t(d, "legal.privacy.s9P1")}</p>

      <h2>{t(d, "legal.privacy.s10Title")}</h2>
      <p>{t(d, "legal.privacy.s10P1")}</p>

      <h2>{t(d, "legal.privacy.s11Title")}</h2>
      <p>
        {t(d, "legal.privacy.s11P1Prefix")}{" "}
        <a href={`mailto:${email}`} className="link-sky">
          {email}
        </a>
        {t(d, "legal.privacy.s11P1Suffix")}
      </p>

      <h2>{t(d, "legal.privacy.s12Title")}</h2>
      <p>{t(d, "legal.privacy.s12P1")}</p>

      <h2>{t(d, "legal.privacy.s13Title")}</h2>
      <p>{t(d, "legal.privacy.s13P1")}</p>
    </LegalPageShell>
  );
}
