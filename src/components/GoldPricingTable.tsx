import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

/** Botón de plan: táctil amplio, jerarquía clara frente al texto. */
function planCtaClassName(extra?: string) {
  return [
    "mt-auto inline-flex w-full min-h-[52px] shrink-0 items-center justify-center",
    "rounded-xl px-4 py-4 text-center text-base font-semibold leading-snug",
    "whitespace-normal break-words [overflow-wrap:anywhere]",
    "shadow-lg active:opacity-95",
    extra ?? "",
  ].join(" ");
}

export async function GoldPricingTable() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <section className="mx-auto max-w-5xl rounded-2xl border border-white/[0.06] bg-slate-900/20 px-0 py-8 shadow-[0_0_0_1px_rgba(148,163,184,0.06)] ring-1 ring-white/5 backdrop-blur-sm sm:py-10 lg:px-2">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
        {t(d, "pricing.sectionTitle")}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-400 md:text-lg">
        {t(d, "pricing.sectionSubtitle")}
      </p>

      <p
        className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-center text-sm text-slate-500 lg:hidden"
        aria-hidden="true"
      >
        <span className="inline-block animate-pulse text-sky-400">↔</span>
        <span>{t(d, "pricing.swipeHint")}</span>
      </p>

      <div
        className="mt-8 -mx-4 px-4 lg:mx-0 lg:mt-12 lg:px-0"
        role="region"
        aria-roledescription="carousel"
        aria-label={t(d, "pricing.carouselAria")}
      >
        <div
          className={[
            "flex snap-x snap-mandatory flex-row gap-5 overflow-x-auto scroll-smooth pb-6 pt-1",
            "overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none]",
            "[-webkit-overflow-scrolling:touch]",
            "[scroll-padding-inline:1rem]",
            "[&::-webkit-scrollbar]:hidden",
            "lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0 lg:pt-0",
          ].join(" ")}
        >
          {/* 1 — Visita única de jetting */}
          <article
            className={[
              "flex min-h-0 min-w-[min(90vw,24rem)] shrink-0 snap-center flex-col",
              "rounded-2xl border border-slate-600 bg-slate-800/40 p-6 shadow-lg sm:p-7",
              "lg:min-w-0 lg:w-auto lg:snap-none",
            ].join(" ")}
          >
            <h3 className="text-xl font-semibold text-sky-400">
              {t(d, "pricing.planSingleJettingTitle")}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/85">
              {t(d, "pricing.planSingleJettingKicker")}
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              {t(d, "pricing.planSingleJettingSubtitle")}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t(d, "pricing.singleVisitWeekdayLabel")}
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white">
                  {t(d, "pricing.singleVisitWeekdayPrice")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t(d, "pricing.singleVisitWeekendLabel")}
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white">
                  {t(d, "pricing.singleVisitWeekendPrice")}
                </p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-400">
              {t(d, "pricing.singleVisitPolicyNote")}
            </p>
            <Link
              href="/book?jetting=1"
              className={planCtaClassName(
                "btn-secondary shadow-sky-900/20 ring-1 ring-sky-500/20",
              )}
            >
              {t(d, "pricing.ctaBookSingleJetting")}
            </Link>
          </article>

          {/* 2 — HydroNet Gold (solo este plan usa el nombre Gold) */}
          <article
            className={[
              "relative flex min-h-0 min-w-[min(90vw,24rem)] shrink-0 snap-center flex-col",
              "rounded-2xl border-2 border-orange-500/70 bg-slate-800/60 p-6 shadow-xl ring-2 ring-orange-500/20 sm:p-7",
              "lg:min-w-0 lg:w-auto lg:snap-none",
            ].join(" ")}
          >
            <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#F97316] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
              {t(d, "pricing.bestValue")}
            </span>
            <h3 className="mt-3 text-xl font-semibold text-orange-400">
              {t(d, "pricing.planGoldTitle")}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400/90">
              {t(d, "pricing.planGoldKicker")}
            </p>
            <p className="mt-3 flex-1 text-base leading-relaxed text-slate-400">
              {t(d, "pricing.planGoldSubtitle")}
            </p>

            <div className="mt-6 space-y-4 rounded-xl border border-orange-500/25 bg-slate-900/40 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t(d, "pricing.goldPayInFull")}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-4xl font-bold tabular-nums text-white">
                    {t(d, "pricing.goldAnnualAmount")}
                  </span>
                  <span className="text-base text-slate-400">
                    {t(d, "pricing.goldPerYear")}
                  </span>
                </p>
              </div>
              <div className="border-t border-slate-600/80 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t(d, "pricing.goldOrMonthly")}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-4xl font-bold tabular-nums text-white">
                    {t(d, "pricing.goldMonthlyAmount")}
                  </span>
                  <span className="text-base text-slate-400">
                    {t(d, "pricing.goldMonthlyNote")}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/book?gold=annual"
                className={planCtaClassName(
                  "btn-primary shadow-xl shadow-orange-900/35 ring-2 ring-orange-400/30",
                )}
              >
                {t(d, "pricing.ctaJoinAnnual")}
              </Link>
              <Link
                href="/book?gold=monthly"
                className={planCtaClassName(
                  "btn-secondary border-orange-500/40 text-slate-100 shadow-orange-900/20 ring-1 ring-orange-500/25 hover:bg-slate-800/80",
                )}
              >
                {t(d, "pricing.ctaJoinMonthly")}
              </Link>
            </div>
          </article>

          {/* 3 — Por hora (instalación) */}
          <article
            className={[
              "flex min-h-0 min-w-[min(90vw,24rem)] shrink-0 snap-center flex-col",
              "rounded-2xl border border-sky-600/45 bg-slate-800/50 p-6 shadow-lg ring-1 ring-sky-500/15 sm:p-7",
              "lg:min-w-0 lg:w-auto lg:snap-none",
            ].join(" ")}
          >
            <h3 className="text-xl font-semibold leading-snug text-sky-400">
              {t(d, "pricing.hourlyTitle")}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/85">
              {t(d, "pricing.hourlyKicker")}
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              {t(d, "pricing.hourlyIntro")}
            </p>
            <p className="mt-6">
              <span className="text-5xl font-bold tabular-nums text-white">
                $150
              </span>
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
              <li>{t(d, "pricing.hourlyBullet1")}</li>
              <li>{t(d, "pricing.hourlyBullet2")}</li>
              <li>{t(d, "pricing.hourlyBullet3")}</li>
              <li>{t(d, "pricing.hourlyBullet4")}</li>
              <li>{t(d, "pricing.hourlyBullet5")}</li>
            </ol>
            <Link
              href="/book?hourly=1"
              className={planCtaClassName(
                "btn-secondary border-sky-500/60 text-sky-50 shadow-sky-900/25 ring-1 ring-sky-500/30 hover:border-sky-400 hover:bg-sky-950/50",
              )}
            >
              {t(d, "pricing.ctaBookHourly")}
            </Link>
          </article>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-medium leading-relaxed text-sky-200/95">
        {t(d, "pricing.reservationAppliesAll")}
      </p>

      <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-slate-600/80 bg-slate-900/50 p-5 text-center text-sm leading-relaxed text-slate-400">
        {t(d, "stripeUi.slaNote")}
      </p>
    </section>
  );
}
