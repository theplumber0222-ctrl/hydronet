/**
 * Stripe Webhooks — URL to register in Dashboard (replace with your domain):
 *
 *   https://YOUR_DOMAIN/api/webhooks/stripe
 *
 * Examples:
 *   https://hydronet.live/api/webhooks/stripe
 *   https://www.hydronet.live/api/webhooks/stripe
 *
 * Stripe Dashboard → Developers → Webhooks → Add endpoint
 *
 * Events to send:
 *   • checkout.session.completed  (required — Gold activation + reservation bookings)
 *   • customer.subscription.updated  (recommended — renewal / period & visits sync)
 *   • invoice.payment_succeeded  (compromiso — conteo de pagos mensuales)
 *   • customer.subscription.deleted  (factura de ajuste si cancelación anticipada)
 *
 * Copy the endpoint signing secret into STRIPE_WEBHOOK_SECRET in .env
 *
 * Price IDs reconocidos para Socio Gold (suscripción):
 *   • NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_Membership (mensual)
 *   • NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_ANNUAL (+ STRIPE_PRICE_GOLD_ANNUAL)
 * Reservas: NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA (estándar), NEXT_PUBLIC_STRIPE_PRICE_ID_EMERGENCY (sáb–dom), GOLD_SCHEDULED, etc.
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getStripe,
  planIntervalFromSubscription,
  planIntervalToDb,
  resolveMembershipPlanInterval,
} from "@/lib/stripe";
import { isUnderServiceCommitment } from "@/lib/commitment-helpers";
import { createEarlyTerminationAdjustmentInvoice } from "@/lib/stripe-early-termination";
import { postToN8n } from "@/lib/n8n";
import {
  sendBookingConfirmation,
  sendMembershipConfirmation,
} from "@/lib/email";
import { serviceTypeToLabel, serviceTypeToN8n } from "@/lib/service-labels";
import { getSubscriptionPeriod } from "@/lib/stripe-subscription";
import { parseSpendLimitCentsFromMetadata } from "@/lib/booking-verification";
import { allocateUniqueTabletCode } from "@/lib/allocate-tablet-code";

export const runtime = "nodejs";

async function checkoutSessionLinePriceIds(
  stripe: Stripe,
  sessionId: string,
): Promise<Set<string>> {
  const full = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });
  const ids = new Set<string>();
  for (const li of full.line_items?.data ?? []) {
    const p = li.price as string | Stripe.Price | undefined;
    if (typeof p === "string") ids.add(p);
    else if (p?.id) ids.add(p.id);
  }
  return ids;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    return NextResponse.json({ error: "No webhook secret" }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(stripe, session);
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      await syncGoldMembershipFromSubscription(sub);
    } else if (event.type === "invoice.payment_succeeded") {
      const inv = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(stripe, inv);
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(stripe, sub);
    }
    await prisma.stripeEvent.create({ data: { id: event.id } });
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * checkout.session.completed:
 * - Subscription (Gold): upsert GoldMembership → user is Gold in the app (dashboard + bookings).
 * - One-time payment: create Booking (reserva / emergencia / extra / visita incluida).
 */
async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const m = session.metadata ?? {};
  const serviceType = m.service_type as ServiceType | undefined;
  if (!serviceType) {
    console.warn("checkout.session.completed: sin service_type en metadata");
    return;
  }

  if (serviceType === "GOLD_MEMBERSHIP") {
    await markUserAsGoldFromSubscriptionCheckout(stripe, session, m);
    return;
  }

  await recordReservationBookingFromPaymentCheckout(session, m, serviceType);
}

/** Successful Gold subscription Checkout: persist membership = cliente Gold en la base de datos. */
async function markUserAsGoldFromSubscriptionCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  m: Stripe.Metadata,
) {
  if (session.mode !== "subscription") {
    console.warn("GOLD_MEMBERSHIP: sesión no es subscription", session.id);
    return;
  }

  const userId = m.user_id;
  if (!userId) {
    console.warn("GOLD_MEMBERSHIP checkout sin user_id; no se marca Gold");
    return;
  }

  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const custId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  if (!subId || !custId) {
    console.warn("GOLD_MEMBERSHIP: falta subscription o customer", session.id);
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subId);
  const period = getSubscriptionPeriod(sub);
  if (!period) return;
  const { start, end } = period;

  const lineIds = await checkoutSessionLinePriceIds(stripe, session.id);
  const billing = resolveMembershipPlanInterval(
    lineIds,
    m.gold_billing ?? (sub.metadata?.gold_billing as string | undefined),
  );
  const planFromSub = planIntervalFromSubscription(sub);
  const planDb =
    planIntervalToDb(billing) ?? planFromSub ?? undefined;

  await prisma.goldMembership.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: custId,
      stripeSubscriptionId: subId,
      periodStart: start,
      periodEnd: end,
      visitsIncluded: 3,
      visitsUsed: 0,
      status: "active",
      planInterval: planDb ?? null,
      commitmentStartedAt: new Date(),
      commitmentMonthsPaid: 0,
      subscriptionTotalPaidCents: 0,
    },
    update: {
      stripeCustomerId: custId,
      stripeSubscriptionId: subId,
      periodStart: start,
      periodEnd: end,
      visitsIncluded: 3,
      status: "active",
      commitmentStartedAt: new Date(),
      commitmentMonthsPaid: 0,
      subscriptionTotalPaidCents: 0,
      earlyTerminationInvoiceId: null,
      ...(planDb ? { planInterval: planDb } : {}),
    },
  });

  await postToN8n({
    Restaurant_Name: m.restaurant_name ?? "",
    Address: m.address_line ?? "",
    Phone: m.phone ?? "",
    Email: m.email ?? session.customer_email ?? "",
    Service_Type: serviceTypeToN8n("GOLD_MEMBERSHIP"),
    Stripe_ID: String(session.payment_intent ?? session.id),
    Scheduled_Date: start.toISOString(),
  });

  await sendMembershipConfirmation({
    to: m.email ?? session.customer_email ?? "",
    restaurantName: m.restaurant_name ?? "Cliente",
    periodEnd: end.toISOString(),
  });
}

/** Pago de reserva (u otro servicio one-time): registrar cita en Booking. */
async function recordReservationBookingFromPaymentCheckout(
  session: Stripe.Checkout.Session,
  m: Stripe.Metadata,
  serviceType: ServiceType,
) {
  if (session.mode !== "payment") {
    console.warn(
      "Reserva esperada en mode=payment, recibido:",
      session.mode,
      session.id,
    );
  }

  const scheduledRaw = m.scheduled_at;
  if (!scheduledRaw) {
    console.warn("Booking: sin scheduled_at en metadata", session.id);
    return;
  }
  const scheduledAt = new Date(scheduledRaw);

  const stripeId = String(session.payment_intent ?? session.id);
  const custId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const existingBooking = await prisma.booking.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existingBooking?.status === "paid") {
    return;
  }

  const spendLimitCents = parseSpendLimitCentsFromMetadata(
    m.spend_limit_cents,
  );

  const tabletCode = await allocateUniqueTabletCode();

  await prisma.booking.create({
    data: {
      userId: m.user_id || null,
      restaurantName: m.restaurant_name ?? "",
      addressLine: m.address_line ?? "",
      placeId: m.place_id || null,
      phone: m.phone ?? "",
      email: m.email ?? session.customer_email ?? "",
      serviceType,
      scheduledAt,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripeCustomerId: custId,
      depositAcceptedAt: m.terms_accepted_at
        ? new Date(m.terms_accepted_at)
        : new Date(),
      termsVersion: m.terms_version ?? undefined,
      status: "paid",
      workDescription: m.job_description?.trim() || null,
      billingContactName: m.billing_contact_name?.trim() || null,
      invoiceEmail: m.invoice_email?.trim() || null,
      siteContactName: m.site_contact_name?.trim() || null,
      siteContactPhone: m.site_contact_phone?.trim() || null,
      spendLimitCents,
      approvalOverLimitNote: m.approval_over_limit_note?.trim() || null,
      tabletCode,
    },
  });

  /** Visitas preventivas del ciclo: no aplica a GOLD_WEEKEND_EMERGENCY. */
  if (
    (serviceType === "GOLD_SCHEDULED" || serviceType === "GOLD_EXTRA") &&
    m.user_id
  ) {
    await prisma.goldMembership.updateMany({
      where: { userId: m.user_id, status: "active" },
      data: { visitsUsed: { increment: 1 } },
    });
  }

  await postToN8n({
    Restaurant_Name: m.restaurant_name ?? "",
    Address: m.address_line ?? "",
    Phone: m.phone ?? "",
    Email: m.email ?? session.customer_email ?? "",
    Service_Type: serviceTypeToN8n(serviceType),
    Stripe_ID: stripeId,
    Scheduled_Date: scheduledAt.toISOString(),
    Job_Description: m.job_description ?? "",
    Billing_Contact: m.billing_contact_name ?? "",
    Invoice_Email: m.invoice_email ?? "",
    Site_Contact: m.site_contact_name ?? "",
    Site_Phone: m.site_contact_phone ?? "",
    Spend_Limit_USD:
      spendLimitCents != null && spendLimitCents > 0
        ? String((spendLimitCents / 100).toFixed(2))
        : "",
    Approval_Over_Limit: m.approval_over_limit_note ?? "",
    Tablet_Code: tabletCode,
  });

  await sendBookingConfirmation({
    to: m.email ?? session.customer_email ?? "",
    restaurantName: m.restaurant_name ?? "",
    serviceLabel: serviceTypeToLabel(serviceType),
    scheduledAt: scheduledAt.toISOString(),
    addressLine: m.address_line ?? "",
    tabletCode,
    workDescription: m.job_description ?? undefined,
    billingContactName: m.billing_contact_name ?? undefined,
    invoiceEmail: m.invoice_email ?? undefined,
    siteContactName: m.site_contact_name ?? undefined,
    siteContactPhone: m.site_contact_phone ?? undefined,
    spendLimitCents: spendLimitCents ?? undefined,
    approvalOverLimitNote: m.approval_over_limit_note ?? undefined,
  });
}

async function syncGoldMembershipFromSubscription(sub: Stripe.Subscription) {
  const gm = await prisma.goldMembership.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!gm) return;

  const period = getSubscriptionPeriod(sub);
  if (!period) return;

  const newStart = period.start;
  const oldStart = gm.periodStart;
  const cycleRenewed =
    !oldStart || oldStart.getTime() !== newStart.getTime();

  const planFromSub = planIntervalFromSubscription(sub);

  await prisma.goldMembership.update({
    where: { id: gm.id },
    data: {
      periodStart: newStart,
      periodEnd: period.end,
      status: sub.status === "active" ? "active" : sub.status,
      ...(cycleRenewed ? { visitsUsed: 0, visitsIncluded: 3 } : {}),
      ...(planFromSub ? { planInterval: planFromSub } : {}),
    },
  });
}

/** Stripe Invoice (API reciente): suscripción en `parent.subscription_details`. */
function getInvoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const sub = inv.parent?.subscription_details?.subscription;
  if (sub) {
    return typeof sub === "string" ? sub : sub.id;
  }
  const legacy = inv as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const leg = legacy.subscription;
  if (leg) {
    return typeof leg === "string" ? leg : leg.id;
  }
  return null;
}

/** Cada factura de suscripción pagada: acumula pagos mensuales (compromiso 12 meses). */
async function handleInvoicePaymentSucceeded(
  stripe: Stripe,
  inv: Stripe.Invoice,
) {
  const subId = getInvoiceSubscriptionId(inv);
  if (!subId || (inv.amount_paid ?? 0) <= 0) return;

  const br = inv.billing_reason;
  if (
    br !== "subscription_create" &&
    br !== "subscription_cycle" &&
    br !== "subscription_update"
  ) {
    return;
  }

  const gm = await prisma.goldMembership.findFirst({
    where: { stripeSubscriptionId: subId },
  });
  if (!gm) return;

  const sub = await stripe.subscriptions.retrieve(subId);
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;

  if (interval === "month") {
    await prisma.goldMembership.update({
      where: { id: gm.id },
      data: {
        commitmentMonthsPaid: { increment: 1 },
        subscriptionTotalPaidCents: { increment: inv.amount_paid ?? 0 },
      },
    });
  } else if (interval === "year") {
    await prisma.goldMembership.update({
      where: { id: gm.id },
      data: {
        subscriptionTotalPaidCents: { increment: inv.amount_paid ?? 0 },
      },
    });
  }
}

/** Cancelación de suscripción: factura de ajuste si aplica (salida antes del compromiso + visitas). */
async function handleSubscriptionDeleted(
  stripe: Stripe,
  sub: Stripe.Subscription,
) {
  const gm = await prisma.goldMembership.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!gm) return;

  const custId =
    typeof sub.customer === "string"
      ? sub.customer
      : sub.customer?.id;
  if (!custId) return;

  const shouldAdjust =
    gm.visitsUsed > 0 &&
    isUnderServiceCommitment(gm) &&
    !gm.earlyTerminationInvoiceId;

  let invoiceId: string | null = null;
  if (shouldAdjust) {
    invoiceId = await createEarlyTerminationAdjustmentInvoice(stripe, {
      customerId: custId,
      subscriptionId: sub.id,
      membershipId: gm.id,
      visitsUsed: gm.visitsUsed,
    });
  }

  await prisma.goldMembership.update({
    where: { id: gm.id },
    data: {
      status: "canceled",
      stripeSubscriptionId: null,
      ...(invoiceId ? { earlyTerminationInvoiceId: invoiceId } : {}),
    },
  });
}
