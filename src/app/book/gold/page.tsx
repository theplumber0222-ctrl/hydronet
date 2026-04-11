import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoldMemberBookingForm } from "@/components/GoldMemberBookingForm";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

export default async function GoldMemberBookPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/book/gold");
  }

  const p = await searchParams;
  const d = getDictionary(await getLocale());

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-10 md:py-14">
      <Link href="/dashboard" className="link-sky text-sm">
        {t(d, "bookGold.backDashboard")}
      </Link>

      <header className="mt-8 border-b border-slate-700/80 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400/90">
          {t(d, "bookGold.kicker")}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          {t(d, "bookGold.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
          {t(d, "bookGold.subtitle")}
        </p>
        <p className="mt-3 text-xs text-slate-500">{t(d, "stripeUi.slaNote")}</p>
      </header>

      {p.cancelled === "1" && (
        <p className="mt-6 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {t(d, "book.cancelledBanner")}
        </p>
      )}

      <div className="mt-10">
        <GoldMemberBookingForm />
      </div>
    </main>
  );
}
