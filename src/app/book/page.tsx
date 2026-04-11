import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const p = await searchParams;
  const d = getDictionary(await getLocale());

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-10 md:py-14">
      <Link href="/" className="link-sky text-sm">
        {t(d, "book.back")}
      </Link>

      <header className="mt-8 border-b border-slate-700/80 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">
          {t(d, "book.kicker")}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          {t(d, "book.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
          {t(d, "book.subtitle")}
        </p>
        <nav
          aria-label={t(d, "bookFlow.trackLabel")}
          className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li className="flex items-center gap-2">
              <span
                className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-sky-500/25 text-xs font-semibold text-sky-200 ring-1 ring-sky-500/40"
                aria-current="step"
              >
                1
              </span>
              <span className="font-medium text-slate-200">
                {t(d, "bookFlow.step1")}
              </span>
            </li>
            <li className="text-slate-600" aria-hidden>
              →
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-slate-700/80 text-xs font-semibold text-slate-400">
                2
              </span>
              <span className="text-slate-400">{t(d, "bookFlow.step2")}</span>
            </li>
          </ol>
        </nav>
        <p className="mt-3 text-xs text-slate-500">{t(d, "stripeUi.slaNote")}</p>
        <p className="mt-4 text-sm text-slate-500">
          <Link href="/terms" className="link-sky">
            {t(d, "book.legalLinksTerms")}
          </Link>
          {" · "}
          <Link href="/refunds" className="link-sky">
            {t(d, "book.legalLinksRefunds")}
          </Link>
          {" · "}
          <Link href="/privacy" className="link-sky">
            {t(d, "book.legalLinksPrivacy")}
          </Link>
        </p>
      </header>

      {p.cancelled === "1" && (
        <p className="mt-6 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {t(d, "book.cancelledBanner")}
        </p>
      )}

      <div className="mt-10">
        <BookingForm />
      </div>
    </main>
  );
}
