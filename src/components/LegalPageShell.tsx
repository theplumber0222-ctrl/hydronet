import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import {
  BRAND_CONNECT_NAME,
  LEGAL_ENTITY_NAME,
  getPublicContactEmail,
  getPublicSiteUrl,
} from "@/lib/legal-business-info";

type Props = {
  title: string;
  children: ReactNode;
};

export async function LegalPageShell({ title, children }: Props) {
  const email = getPublicContactEmail();
  const site = getPublicSiteUrl();
  const d = getDictionary(await getLocale());

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col px-4 py-12 md:px-6 md:py-16">
      <nav aria-label="Home">
        <Link href="/" className="link-sky text-sm">
          {t(d, "nav.backHome")}
        </Link>
      </nav>
      <header className="mt-8 border-b border-slate-700/90 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {BRAND_CONNECT_NAME} · {LEGAL_ENTITY_NAME}
        </p>
      </header>
      <div className="legal-prose mt-10 space-y-6 text-base leading-relaxed text-slate-300 md:text-[17px] md:leading-relaxed">
        {children}
      </div>
      <aside className="mt-14 rounded-xl border border-slate-600/80 bg-slate-800/35 p-5 text-sm text-slate-400">
        <p className="font-medium text-slate-200">{t(d, "legalShell.contactTitle")}</p>
        <p className="mt-2">
          {t(d, "legalShell.emailLabel")}{" "}
          <a href={`mailto:${email}`} className="link-sky">
            {email}
          </a>
        </p>
        <p className="mt-1 break-all text-xs text-slate-500">
          {t(d, "legalShell.siteLabel")} {site}
        </p>
      </aside>
    </main>
  );
}
