import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoldMembershipJoinForm } from "@/components/GoldMembershipJoinForm";
import { JoinGoldSessionFallback } from "@/components/JoinGoldSessionFallback";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

/** Sesión y parámetros deben evaluarse en cada petición (evita RSC cacheada sin cookie). */
export const dynamic = "force-dynamic";

export default async function JoinGoldPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; cancelled?: string }>;
}) {
  const session = await auth();
  const p = await searchParams;
  const billing = p.billing === "monthly" ? "monthly" : "annual";

  const d = getDictionary(await getLocale());

  if (session?.user?.id) {
    const existing = await prisma.goldMembership.findUnique({
      where: { userId: session.user.id },
    });
    if (existing?.status === "active") {
      redirect("/dashboard");
    }
  }

  const mainInner =
    session?.user?.id ? (
      <div className="mt-10">
        <GoldMembershipJoinForm defaultBilling={billing} />
      </div>
    ) : (
      <JoinGoldSessionFallback billing={billing} />
    );

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-10 md:py-14">
      <Link href="/" className="link-sky text-sm">
        {t(d, "joinGold.back")}
      </Link>

      <header className="mt-8 border-b border-orange-800/40 pb-8">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          {t(d, "joinGold.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
          {t(d, "joinGold.subtitle")}
        </p>
      </header>

      {p.cancelled === "1" && (
        <p className="mt-6 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {t(d, "book.cancelledBanner")}
        </p>
      )}

      {mainInner}
    </main>
  );
}
