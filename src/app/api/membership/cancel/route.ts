import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: t(dict, "api.unauthorized") },
      { status: 401 },
    );
  }

  const m = await prisma.goldMembership.findUnique({
    where: { userId: session.user.id },
  });

  if (!m?.stripeSubscriptionId || m.status !== "active") {
    return NextResponse.json(
      { error: t(dict, "api.membershipCancelNone") },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  await stripe.subscriptions.cancel(m.stripeSubscriptionId);

  return NextResponse.json({ ok: true });
}
