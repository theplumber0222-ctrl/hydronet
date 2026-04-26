import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import {
  isServicioLanguage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";
import { computeServicioBilling } from "@/lib/servicio-billing-math";
import {
  getStripe,
  HOURLY_PLUMBING_RATE_USD,
  isStripeSecretKeyFailure,
  stripeCheckoutTaxDefaults,
} from "@/lib/stripe";

export const runtime = "nodejs";

const MIN_CHECKOUT_USD = 0.5;

const money = z.coerce.number().nonnegative();
const hoursField = z.coerce
  .number()
  .nonnegative()
  .max(1_000);

const bodySchema = z.object({
  serviceLanguage: z.enum(["en", "es"]).optional().default("es"),
  bookingReference: z.string().max(200).optional().default(""),
  clientEmail: z.string().email(),
  houseOrBusinessName: z.string().min(1).max(200),
  technician: z.string().min(1).max(200),
  serviceDate: z.string().min(1).max(32),
  laborHours: hoursField,
  materialsSubtotal: money,
  partsSubtotal: money,
  otherChargesSubtotal: money,
});

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  if (adminKey && req.headers.get("x-hydronet-admin-key") !== adminKey) {
    return NextResponse.json(
      { error: servicioReportCopy("es").apiUnauthorized },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: servicioReportCopy("es").apiInvalidForm },
      { status: 400 },
    );
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(json);
  } catch (e) {
    const c = servicioReportCopy("es");
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
    }
    return NextResponse.json({ error: c.apiValidationFailed }, { status: 400 });
  }

  const language: ServicioLanguage = isServicioLanguage(data.serviceLanguage)
    ? data.serviceLanguage
    : "es";
  const c = servicioReportCopy(language);

  const snap = computeServicioBilling({
    laborHours: data.laborHours,
    materialsSubtotal: data.materialsSubtotal,
    partsSubtotal: data.partsSubtotal,
    otherChargesSubtotal: data.otherChargesSubtotal,
  });
  const { laborTotal: laborSubtotal, subtotal: invoiceSubtotal, amountDue } =
    snap;

  if (amountDue <= 0) {
    return NextResponse.json({ error: c.apiChargeNoBalance }, { status: 400 });
  }
  if (amountDue < MIN_CHECKOUT_USD) {
    return NextResponse.json({ error: c.apiChargeMinAmount }, { status: 400 });
  }

  const amountCents = Math.round(amountDue * 100);
  if (amountCents < 50) {
    return NextResponse.json({ error: c.apiChargeMinAmount }, { status: 400 });
  }

  const site = getAppUrl();
  const successUrl = `${site}/admin/servicio?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${site}/admin/servicio?payment=cancelled`;

  const productName =
    language === "es"
      ? "Saldo de servicio en sitio (HydroNet)"
      : "On-site service balance (HydroNet)";

  const metadata: Record<string, string> = {
    source: "admin-servicio-balance",
    booking_reference: (data.bookingReference ?? "").trim().slice(0, 200),
    customer_email: data.clientEmail.trim().slice(0, 200),
    house_or_business_name: data.houseOrBusinessName.trim().slice(0, 200),
    technician: data.technician.trim().slice(0, 200),
    service_date: data.serviceDate.trim().slice(0, 32),
    service_language: language,
    labor_hours: String(data.laborHours),
    hourly_plumbing_rate_usd: String(HOURLY_PLUMBING_RATE_USD),
    labor_subtotal: String(laborSubtotal),
    materials_subtotal: String(data.materialsSubtotal),
    parts_subtotal: String(data.partsSubtotal),
    other_charges_subtotal: String(data.otherChargesSubtotal),
    invoice_subtotal: String(invoiceSubtotal),
    amount_due: String(amountDue),
    amount_due_cents: String(amountCents),
  };

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: c.apiChargeFailed }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: data.clientEmail.trim(),
      ...stripeCheckoutTaxDefaults,
      locale: language === "en" ? "en" : "es",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
            },
            unit_amount: amountCents,
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    if (!session.url) {
      return NextResponse.json({ error: c.apiChargeFailed }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    if (isStripeSecretKeyFailure(err)) {
      return NextResponse.json({ error: c.apiChargeFailed }, { status: 500 });
    }
    return NextResponse.json({ error: c.apiChargeFailed }, { status: 500 });
  }
}
