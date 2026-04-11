import StripeSdk from "stripe";
import { REGULAR_PREVENTIVE_VISIT_USD } from "@/lib/legal-commitment";

type StripeClient = InstanceType<typeof StripeSdk>;

export async function sumPaidSubscriptionInvoicesCents(
  stripe: StripeClient,
  customerId: string,
  subscriptionId: string,
): Promise<number> {
  let total = 0;
  let startingAfter: string | undefined;
  for (;;) {
    const list = await stripe.invoices.list({
      customer: customerId,
      subscription: subscriptionId,
      status: "paid",
      limit: 100,
      starting_after: startingAfter,
    });
    for (const inv of list.data) {
      total += inv.amount_paid ?? 0;
    }
    if (!list.has_more || list.data.length === 0) break;
    startingAfter = list.data[list.data.length - 1]!.id;
  }
  return total;
}

/**
 * Factura final por salida anticipada: max(0, visitas × tarifa regular − total pagado en suscripción).
 * Solo si hubo visitas preventivas registradas (visitsUsed > 0).
 */
export async function createEarlyTerminationAdjustmentInvoice(
  stripe: StripeClient,
  params: {
    customerId: string;
    subscriptionId: string;
    membershipId: string;
    visitsUsed: number;
  },
): Promise<string | null> {
  if (params.visitsUsed <= 0) return null;

  const totalPaidCents = await sumPaidSubscriptionInvoicesCents(
    stripe,
    params.customerId,
    params.subscriptionId,
  );

  const regularCents = params.visitsUsed * REGULAR_PREVENTIVE_VISIT_USD * 100;
  const adjustmentCents = Math.max(0, regularCents - totalPaidCents);

  if (adjustmentCents <= 0) return null;

  await stripe.invoiceItems.create({
    customer: params.customerId,
    currency: "usd",
    amount: adjustmentCents,
    description: `Early termination adjustment (TN): ${params.visitsUsed} preventive visit(s) at published regular rate $${REGULAR_PREVENTIVE_VISIT_USD}/visit, minus membership payments received.`,
  });

  const invoice = await stripe.invoices.create({
    customer: params.customerId,
    auto_advance: true,
    collection_method: "charge_automatically",
    metadata: {
      hydro_net_reason: "early_termination_adjustment",
      membership_id: params.membershipId,
    },
  });

  return invoice.id;
}
