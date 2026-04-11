import Link from "next/link";
import { OFFICIAL_LOGO_URL } from "@/lib/official-logo";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { SiteHeaderActions } from "@/components/SiteHeaderActions";

/** Barra superior con logo de marca y acceso rápido a reservar. */
export async function SiteHeader() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/60 bg-[#111827]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex min-h-[160px] min-w-0 shrink items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={OFFICIAL_LOGO_URL}
            alt={t(d, "meta.siteLogoAlt")}
            width={880}
            height={256}
            className="h-40 w-auto max-w-[min(880px,96vw)] object-contain object-left"
          />
        </Link>
        <SiteHeaderActions />
      </div>
    </header>
  );
}
