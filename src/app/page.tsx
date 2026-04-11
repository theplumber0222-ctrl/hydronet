import Link from "next/link";
import { Footer } from "@/components/Footer";
import { GoldPricingTable } from "@/components/GoldPricingTable";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyReserveCta } from "@/components/StickyReserveCta";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

export default async function Home() {
  const d = getDictionary(await getLocale());

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        {t(d, "a11y.skipToContent")}
      </a>
      <SiteHeader />
      <div
        id="main-content"
        className="flex flex-1 flex-col outline-none"
        tabIndex={-1}
      >
        <section className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-4 md:px-6 md:pt-8">
          <header className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {t(d, "home.heroTitle")}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-sky-400 md:text-3xl">
              {t(d, "home.heroSubtitle")}
            </p>
            <ul className="mt-8 space-y-4 text-lg leading-relaxed text-slate-300">
              <li>
                <span className="font-semibold text-sky-400">
                  {t(d, "home.bulletWhat")}
                </span>{" "}
                {t(d, "home.bulletWhatText")}
              </li>
              <li>
                <span className="font-semibold text-sky-400">
                  {t(d, "home.bulletWhere")}
                </span>{" "}
                {t(d, "home.bulletWhereText")}
              </li>
              <li>
                <span className="font-semibold text-sky-400">
                  {t(d, "home.bulletHow")}
                </span>{" "}
                {t(d, "home.bulletHowText")}
              </li>
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/book"
                className="btn-primary inline-flex min-h-[48px] items-center justify-center px-6 text-base"
              >
                {t(d, "home.ctaBook")}
              </Link>
              <Link
                href="/login"
                className="btn-secondary inline-flex min-h-[48px] items-center justify-center px-6 text-base"
              >
                {t(d, "home.ctaGoldLogin")}
              </Link>
              <Link
                href="/admin/servicio"
                className="link-sky inline-flex min-h-[48px] items-center justify-center px-2 text-sm sm:justify-start"
              >
                {t(d, "home.ctaTablet")}
              </Link>
            </div>
          </header>
        </section>
        <GoldPricingTable />
      </div>
      <Footer />
      <StickyReserveCta />
    </>
  );
}
