import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { getPublicContactEmail } from "@/lib/legal-business-info";

export async function Footer() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const contact = getPublicContactEmail();

  return (
    <footer className="border-t border-slate-700/80 bg-[#111827] py-10 text-center text-sm text-slate-400">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
          <BrandLogo variant="footer" alt={t(d, "meta.siteLogoAlt")} />
          <div className="flex-1 text-center sm:text-left">
            <p className="font-medium text-sky-400">{t(d, "footer.brand")}</p>
            <p className="mt-1 text-xs text-slate-500">{t(d, "footer.brandSub")}</p>
            <p className="mt-2">
              <a href={`mailto:${contact}`} className="hover:text-sky-400">
                {contact}
              </a>
            </p>
          </div>
        </div>
        <LanguageSwitcher className="shrink-0" />
      </div>
      <nav
        aria-label="Legal"
        className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
      >
        <Link href="/terms" className="text-slate-400 hover:text-sky-400">
          {t(d, "footer.terms")}
        </Link>
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <Link href="/privacy" className="text-slate-400 hover:text-sky-400">
          {t(d, "footer.privacy")}
        </Link>
        <span className="text-slate-600" aria-hidden>
          ·
        </span>
        <Link href="/refunds" className="text-slate-400 hover:text-sky-400">
          {t(d, "footer.refunds")}
        </Link>
      </nav>
      <p className="mt-4 text-xs text-slate-500">{t(d, "footer.tagline")}</p>
      <p className="mt-3 text-xs text-slate-600">{t(d, "footer.legalEntity")}</p>
    </footer>
  );
}
