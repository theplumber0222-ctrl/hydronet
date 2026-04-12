import { prisma } from "@/lib/prisma";
import { postToN8n } from "@/lib/n8n";
import { sendBookingConfirmation } from "@/lib/email";
import { serviceTypeToLabel, serviceTypeToN8n } from "@/lib/service-labels";
import { allocateUniqueTabletCode } from "@/lib/allocate-tablet-code";

/**
 * Visita preventiva incluida en membresía Gold — sin tarifa plana no socio ($195) ni Checkout Stripe.
 */
export async function createGoldIncludedPreventiveBooking(params: {
  userId: string;
  restaurantName: string;
  addressLine: string;
  placeId?: string;
  phone: string;
  email: string;
  scheduledAt: Date;
  termsVersion: string;
  workDescription?: string | null;
  billingContactName?: string | null;
  invoiceEmail?: string | null;
  siteContactName?: string | null;
  siteContactPhone?: string | null;
  spendLimitCents?: number | null;
  approvalOverLimitNote?: string | null;
}): Promise<{ bookingId: string }> {
  const tabletCode = await allocateUniqueTabletCode();

  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        userId: params.userId,
        restaurantName: params.restaurantName,
        addressLine: params.addressLine,
        placeId: params.placeId ?? null,
        phone: params.phone,
        email: params.email,
        serviceType: "GOLD_SCHEDULED",
        scheduledAt: params.scheduledAt,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeCustomerId: null,
        depositAcceptedAt: new Date(),
        termsVersion: params.termsVersion,
        status: "paid",
        workDescription: params.workDescription ?? null,
        billingContactName: params.billingContactName ?? null,
        invoiceEmail: params.invoiceEmail ?? null,
        siteContactName: params.siteContactName ?? null,
        siteContactPhone: params.siteContactPhone ?? null,
        spendLimitCents: params.spendLimitCents ?? null,
        approvalOverLimitNote: params.approvalOverLimitNote ?? null,
        tabletCode,
      },
    });
    await tx.goldMembership.updateMany({
      where: { userId: params.userId, status: "active" },
      data: { visitsUsed: { increment: 1 } },
    });
    return b;
  });

  const refId = `gold-included:${booking.id}`;

  await postToN8n({
    Restaurant_Name: params.restaurantName,
    Address: params.addressLine,
    Phone: params.phone,
    Email: params.email,
    Service_Type: serviceTypeToN8n("GOLD_SCHEDULED"),
    Stripe_ID: refId,
    Scheduled_Date: params.scheduledAt.toISOString(),
    Job_Description: params.workDescription ?? "",
    Billing_Contact: params.billingContactName ?? "",
    Invoice_Email: params.invoiceEmail ?? "",
    Site_Contact: params.siteContactName ?? "",
    Site_Phone: params.siteContactPhone ?? "",
    Spend_Limit_USD:
      params.spendLimitCents != null && params.spendLimitCents > 0
        ? String((params.spendLimitCents / 100).toFixed(2))
        : "",
    Approval_Over_Limit: params.approvalOverLimitNote ?? "",
    Tablet_Code: tabletCode,
  });

  await sendBookingConfirmation({
    to: params.email,
    restaurantName: params.restaurantName,
    serviceLabel: serviceTypeToLabel("GOLD_SCHEDULED"),
    scheduledAt: params.scheduledAt.toISOString(),
    addressLine: params.addressLine,
    workDescription: params.workDescription ?? undefined,
    billingContactName: params.billingContactName ?? undefined,
    invoiceEmail: params.invoiceEmail ?? undefined,
    siteContactName: params.siteContactName ?? undefined,
    siteContactPhone: params.siteContactPhone ?? undefined,
    spendLimitCents: params.spendLimitCents ?? undefined,
    approvalOverLimitNote: params.approvalOverLimitNote ?? undefined,
    tabletCode,
  });

  return { bookingId: booking.id };
}
