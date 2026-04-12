import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CancelMembershipSection } from "@/components/CancelMembershipSection";
import { RescheduleForm } from "@/components/RescheduleForm";
import { isUnderServiceCommitment } from "@/lib/commitment-helpers";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import type { Messages } from "@/i18n/messages/types";

function planIntervalLabel(
  d: Messages,
  interval: string | null | undefined,
): string {
  if (interval === "month") return t(d, "planInterval.month");
  if (interval === "year") return t(d, "planInterval.year");
  return t(d, "planInterval.default");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const locale = await getLocale();
  const d = getDictionary(locale);
  const dateLocale = locale === "es" ? "es-US" : "en-US";

  const membership = await prisma.goldMembership.findUnique({
    where: { userId: session.user.id },
  });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id, status: "paid" },
    orderBy: { scheduledAt: "asc" },
    take: 10,
    select: {
      id: true,
      restaurantName: true,
      serviceType: true,
      scheduledAt: true,
      tabletCode: true,
    },
  });

  const used = membership?.visitsUsed ?? 0;
  const included = membership?.visitsIncluded ?? 3;
  const underCommitment =
    membership && membership.status === "active"
      ? isUnderServiceCommitment(membership)
      : false;
  const hasActiveSubscription =
    membership?.status === "active" && !!membership?.stripeSubscriptionId;

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-4 py-12">
      <Link href="/" className="link-sky text-sm">
        {t(d, "dashboard.back")}
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-white">{t(d, "dashboard.title")}</h1>
      <p className="mt-2 text-slate-400">
        {t(d, "dashboard.hello")} {session.user.name ?? session.user.email}
      </p>

      <section className="mt-10 rounded-xl border border-slate-600 bg-slate-800/40 p-6">
        <h2 className="text-lg font-semibold text-sky-400">
          {t(d, "dashboard.sectionVisits")}
        </h2>
        {membership && membership.status === "active" ? (
          <>
            <p className="mt-2 text-sm font-medium text-orange-400/90">
              {t(d, "dashboard.goldMember")}{" "}
              {planIntervalLabel(d, membership.planInterval)}
            </p>
            <p className="mt-4 text-3xl font-bold text-white">
              {used} {t(d, "dashboard.usedOf")} {included}{" "}
              {t(d, "dashboard.usedSuffix")}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {t(d, "dashboard.visitsExplainer")}
            </p>
            {membership.periodEnd && (
              <p className="mt-2 text-xs text-slate-500">
                {t(d, "dashboard.cycleUntil")}{" "}
                {membership.periodEnd.toLocaleDateString(dateLocale, {
                  timeZone: "America/Chicago",
                })}{" "}
                {t(d, "dashboard.cycleTn")}
              </p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {t(d, "dashboard.memberLead")}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/book/gold"
                className="btn-primary inline-flex min-h-[48px] items-center justify-center px-4 text-center"
              >
                {t(d, "dashboard.ctaScheduleGold")}
              </Link>
              <Link
                href="/book/gold?kind=extra"
                className="btn-secondary inline-flex min-h-[48px] items-center justify-center px-4 text-center"
              >
                {t(d, "dashboard.ctaScheduleGoldExtra")}
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-4 text-slate-400">
            {t(d, "dashboard.noMembership")}{" "}
            <Link href="/join/gold?billing=annual" className="link-sky">
              {t(d, "dashboard.bookPlan")}
            </Link>
          </p>
        )}
      </section>

      <CancelMembershipSection
        hasActiveSubscription={hasActiveSubscription}
        underCommitment={underCommitment}
      />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">
          {t(d, "dashboard.upcoming")}
        </h2>
        {bookings.length === 0 ? (
          <p className="mt-4 text-slate-500">{t(d, "dashboard.none")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
              >
                <p className="font-medium text-slate-200">{b.restaurantName}</p>
                <p className="text-sm text-slate-400">{b.serviceType}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {b.scheduledAt.toLocaleString(dateLocale, {
                    timeZone: "America/Chicago",
                  })}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {b.tabletCode ? (
                    <>
                      {t(d, "dashboard.tabletCodeLabel")}{" "}
                      <span className="font-mono text-sky-300">{b.tabletCode}</span>
                      {" · "}
                      <Link
                        href={`/admin/cita?q=${encodeURIComponent(b.tabletCode)}`}
                        className="text-sky-400 underline-offset-2 hover:underline"
                      >
                        {t(d, "dashboard.openTablet")}
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/admin/cita?q=${encodeURIComponent(b.id)}`}
                      className="text-sky-400 underline-offset-2 hover:underline"
                    >
                      {t(d, "dashboard.openTablet")}
                    </Link>
                  )}
                </p>
                {(b.serviceType === "GOLD_SCHEDULED" ||
                  b.serviceType === "GOLD_EXTRA" ||
                  b.serviceType === "GOLD_WEEKEND_EMERGENCY") && (
                  <RescheduleForm
                    bookingId={b.id}
                    scheduledAtIso={b.scheduledAt.toISOString()}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        {membership && membership.status === "active" ? (
          <p className="text-sm text-slate-500">
            {t(d, "dashboard.otherServicesHint")}{" "}
            <Link href="/book" className="link-sky font-medium">
              {t(d, "dashboard.otherServicesLink")}
            </Link>
            .
          </p>
        ) : (
          <Link href="/book" className="btn-primary inline-block">
            {t(d, "dashboard.newBooking")}
          </Link>
        )}
      </div>
    </main>
  );
}
