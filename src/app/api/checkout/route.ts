import { NextResponse } from "next/server";
import { z } from "zod";
import type { GoldMembership } from "@prisma/client";
import { ServiceType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertDateAllowedForService,
  isEmergencySlotTN,
} from "@/lib/calendar-rules";
import {
  connectDepositMetadata,
  hourlyDispatchMetadata,
  getPublicEmergencyServicePriceId,
  getGoldAdditionalPriceId,
  getGoldAnnualPriceId,
  getGoldMemberWeekendPriceId,
  getGoldMonthlyPriceId,
  getReservationPriceId,
  getStripe,
  isStripeSecretKeyFailure,
  goldWeekendEmergencyFullMetadata,
  GOLD_ADDITIONAL_SERVICE_USD,
  stripeCheckoutTaxDefaults,
  stripeCheckoutUxDefaults,
  TERMS_VERSION,
} from "@/lib/stripe";
import { createGoldIncludedPreventiveBooking } from "@/lib/create-gold-included-booking";
import { COMMITMENT_TERMS_VERSION } from "@/lib/legal-commitment";
import {
  isValidEmailFormat,
  isValidFallbackAddressLine,
  isValidGooglePlaceId,
  isValidUsPhone,
} from "@/lib/contact-validation";
import { getAppUrl } from "@/lib/app-url";
import { getPublicGoogleMapsApiKey } from "@/lib/google-maps-env";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import type { Messages } from "@/i18n/messages/types";
import { ServiceDateError } from "@/lib/service-date-error";
import {
  verificationToStripeMetadata,
  type BookingVerificationInput,
} from "@/lib/booking-verification";

const serviceEnum = z.enum([
  "GOLD_MEMBERSHIP",
  "GOLD_SCHEDULED",
  "GOLD_EXTRA",
  "GOLD_WEEKEND_EMERGENCY",
  "CONNECT_STANDARD",
  "EMERGENCY",
  "HOURLY_PLUMBING",
]);

const goldBillingEnum = z.enum(["monthly", "annual"]);

function createCheckoutBodySchema(dict: Messages) {
  return z
    .object({
      serviceType: serviceEnum,
      goldBilling: goldBillingEnum.optional(),
      /** Línea de catálogo / servicio (etiqueta del formulario). */
      serviceCatalogLine: z.string().min(1).max(500).optional(),
      restaurantName: z.string().min(2),
      addressLine: z.string().min(1),
      placeId: z.string().optional(),
      phone: z.string().min(1),
      email: z.string().min(1),
      scheduledAt: z.string().datetime().optional(),
      termsAccepted: z.literal(true),
      /** Obligatorio para plan mensual Gold (compromiso 12 meses). */
      commitmentTermsAccepted: z.literal(true).optional(),
      locale: z.enum(["en", "es"]).optional(),
      /** Tras cancelar en Stripe: volver a /book o al flujo de socio Gold. */
      cancelReturn: z.enum(["book", "bookGold", "joinGold"]).optional(),
      /** Verificación cliente (citas web; no aplica a GOLD_MEMBERSHIP). */
      workDescription: z.string().max(8000).optional(),
      billingContactName: z.string().max(200).optional(),
      invoiceEmail: z.string().max(320).optional(),
      siteContactName: z.string().max(200).optional(),
      siteContactPhone: z.string().max(32).optional(),
      spendLimitCents: z.number().int().min(0).nullable().optional(),
      approvalOverLimitNote: z.string().max(800).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.serviceType !== "GOLD_MEMBERSHIP" && !val.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "api.checkout.dateRequired"),
          path: ["scheduledAt"],
        });
      }
      if (val.serviceType === "GOLD_MEMBERSHIP" && !val.goldBilling) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "api.checkout.goldBillingRequired"),
          path: ["goldBilling"],
        });
      }
      if (
        val.serviceType === "GOLD_MEMBERSHIP" &&
        val.goldBilling === "monthly" &&
        val.commitmentTermsAccepted !== true
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "api.checkout.commitmentRequired"),
          path: ["commitmentTermsAccepted"],
        });
      }
    })
    .superRefine((val, ctx) => {
      if (!isValidEmailFormat(val.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errEmail"),
          path: ["email"],
        });
      }
      if (!isValidUsPhone(val.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errPhone"),
          path: ["phone"],
        });
      }
      const googleKey = getPublicGoogleMapsApiKey();
      if (googleKey) {
        if (!isValidGooglePlaceId(val.placeId ?? "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t(dict, "booking.errPlaces"),
            path: ["placeId"],
          });
        }
      } else if (!isValidFallbackAddressLine(val.addressLine)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errAddressLen"),
          path: ["addressLine"],
        });
      }
    })
    .superRefine((val, ctx) => {
      if (val.serviceType === "GOLD_MEMBERSHIP") return;
      const wd = (val.workDescription ?? "").trim();
      if (wd.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errWorkDescription"),
          path: ["workDescription"],
        });
      }
      if ((val.billingContactName ?? "").trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errBillingContact"),
          path: ["billingContactName"],
        });
      }
      const inv = (val.invoiceEmail ?? "").trim();
      if (!isValidEmailFormat(inv)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errInvoiceEmail"),
          path: ["invoiceEmail"],
        });
      }
      if ((val.siteContactName ?? "").trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errSiteContactName"),
          path: ["siteContactName"],
        });
      }
      if (!isValidUsPhone((val.siteContactPhone ?? "").trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errSiteContactPhone"),
          path: ["siteContactPhone"],
        });
      }
      const spend = val.spendLimitCents;
      const note = (val.approvalOverLimitNote ?? "").trim();
      if (spend != null && spend > 0 && note.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t(dict, "booking.errApprovalNote"),
          path: ["approvalOverLimitNote"],
        });
      }
    });
}

function verificationFromParsedCheckout(data: {
  workDescription?: string;
  billingContactName?: string;
  invoiceEmail?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  spendLimitCents?: number | null;
  approvalOverLimitNote?: string;
}): BookingVerificationInput {
  const spend = data.spendLimitCents;
  return {
    workDescription: (data.workDescription ?? "").trim(),
    billingContactName: (data.billingContactName ?? "").trim(),
    invoiceEmail: (data.invoiceEmail ?? "").trim(),
    siteContactName: (data.siteContactName ?? "").trim(),
    siteContactPhone: (data.siteContactPhone ?? "").trim(),
    spendLimitCents:
      spend != null && spend > 0 ? spend : null,
    approvalOverLimitNote:
      (data.approvalOverLimitNote ?? "").trim() || null,
  };
}

export async function POST(req: Request) {
  let locale: Locale = "es";
  let dict = getDictionary("es");
  try {
    const session = await auth();
    const json = await req.json();
    const bodyLocale =
      json &&
      typeof json === "object" &&
      "locale" in json &&
      ((json as { locale?: string }).locale === "en" ||
        (json as { locale?: string }).locale === "es")
        ? (json as { locale: Locale }).locale
        : await getLocale();
    const dictForParse = getDictionary(bodyLocale);
    const data = createCheckoutBodySchema(dictForParse).parse(json);
    let serviceType = data.serviceType as ServiceType;

    /**
     * No-socio: si eligió CONNECT_STANDARD pero el slot no es L–V 8am–4pm TN y sí es
     * emergencia válida (L–V fuera de 8–16 o sáb–dom 8am–4pm), se promueve a EMERGENCY ($1,250).
     */
    if (
      serviceType === "CONNECT_STANDARD" &&
      data.scheduledAt &&
      isEmergencySlotTN(data.scheduledAt)
    ) {
      serviceType = "EMERGENCY" as ServiceType;
    }

    locale =
      data.locale === "en" || data.locale === "es"
        ? data.locale
        : bodyLocale;
    dict = getDictionary(locale);

    if (data.scheduledAt) {
      assertDateAllowedForService(serviceType, data.scheduledAt);
    }

    if (serviceType === "GOLD_MEMBERSHIP") {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.goldCreateAccount") },
          { status: 401 },
        );
      }
    }

    let goldMembershipForCheckout: GoldMembership | null = null;

    if (
      serviceType === "GOLD_SCHEDULED" ||
      serviceType === "GOLD_EXTRA" ||
      serviceType === "GOLD_WEEKEND_EMERGENCY"
    ) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.goldLoginBook") },
          { status: 401 },
        );
      }
      goldMembershipForCheckout = await prisma.goldMembership.findUnique({
        where: { userId: session.user.id },
      });
      if (
        !goldMembershipForCheckout ||
        goldMembershipForCheckout.status !== "active"
      ) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.goldActiveRequired") },
          { status: 403 },
        );
      }
    }

    /** Socio Gold activo: no usar el flujo público con Dispatch fee — /book/gold */
    if (
      (serviceType === "CONNECT_STANDARD" ||
        serviceType === "EMERGENCY" ||
        serviceType === "HOURLY_PLUMBING") &&
      session?.user?.id
    ) {
      const pubGold = await prisma.goldMembership.findUnique({
        where: { userId: session.user.id },
      });
      if (pubGold?.status === "active") {
        return NextResponse.json(
          { error: t(dict, "api.checkout.goldUseMemberBooking") },
          { status: 403 },
        );
      }
    }

    const reservationPriceId = getReservationPriceId();
    const monthlyId = getGoldMonthlyPriceId();
    const annualId = getGoldAnnualPriceId();
    const siteUrl = getAppUrl();
    /** Tras pagar: confirmación con `session_id` para referencia / webhook. */
    const checkoutSuccessUrl = `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    /** Si el cliente cancela en Stripe: vuelve al formulario de reserva (misma sesión NextAuth en cookie). */
    const checkoutCancelUrl =
      data.cancelReturn === "bookGold"
        ? `${siteUrl}/book/gold?cancelled=1`
        : data.cancelReturn === "joinGold"
          ? `${siteUrl}/join/gold?cancelled=1`
          : `${siteUrl}/book`;

    const stripe = getStripe();
    // app_source identifies this checkout as HydroNet so other webhook listeners
    // on the same Stripe account can filter events.
    const metadata: Record<string, string> = {
      app_source: "hydronet",
      brand: "HydroNet Plumbing",
      service_type: serviceType,
      restaurant_name: data.restaurantName,
      address_line: data.addressLine,
      place_id: data.placeId ?? "",
      phone: data.phone,
      email: data.email,
      scheduled_at: data.scheduledAt ?? "",
      terms_version: TERMS_VERSION,
      terms_accepted_at: new Date().toISOString(),
      user_id: session?.user?.id ?? "",
    };
    if (data.serviceCatalogLine) {
      metadata.service_catalog_line = data.serviceCatalogLine;
    }
    if (serviceType !== "GOLD_MEMBERSHIP") {
      Object.assign(
        metadata,
        verificationToStripeMetadata(verificationFromParsedCheckout(data)),
      );
    }

    if (serviceType === "GOLD_MEMBERSHIP") {
      const billing = data.goldBilling!;
      const recurringPriceId =
        billing === "monthly" ? monthlyId : annualId;
      if (!recurringPriceId) {
        return NextResponse.json(
          {
            error:
              billing === "monthly"
                ? "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_Membership."
                : "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_ANNUAL (o STRIPE_PRICE_GOLD_ANNUAL).",
          },
          { status: 500 },
        );
      }

      metadata.gold_billing = billing;
      if (billing === "monthly") {
        metadata.commitment_terms_version = COMMITMENT_TERMS_VERSION;
        metadata.commitment_terms_accepted_at = new Date().toISOString();
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: recurringPriceId, quantity: 1 }],
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
        metadata,
        subscription_data: {
          metadata: {
            user_id: metadata.user_id,
            service_type: "GOLD_MEMBERSHIP",
            gold_billing: billing,
          },
        },
      });
      return NextResponse.json({ url: checkout.url });
    }

    /** Socio Gold — lun–vie: visita incluida (sin reserva $50) o adicional solo $733.33 (sin $50). */
    if (serviceType === "GOLD_SCHEDULED" || serviceType === "GOLD_EXTRA") {
      if (!data.scheduledAt) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.dateRequired") },
          { status: 400 },
        );
      }

      const membership = goldMembershipForCheckout;
      if (!membership) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.membershipNotFound") },
          { status: 403 },
        );
      }

      const useAdditionalTier =
        serviceType === "GOLD_EXTRA" ||
        membership.visitsUsed >= membership.visitsIncluded;

      /** Visita incluida: sin cargo Stripe (cubierta por la membresía; no aplica reserva $50). */
      if (!useAdditionalTier) {
        const uid = session?.user?.id;
        if (!uid) {
          return NextResponse.json(
            { error: t(dict, "api.checkout.goldLoginBook") },
            { status: 401 },
          );
        }
        await createGoldIncludedPreventiveBooking({
          userId: uid,
          restaurantName: data.restaurantName,
          addressLine: data.addressLine,
          placeId: data.placeId,
          phone: data.phone,
          email: data.email,
          scheduledAt: new Date(data.scheduledAt),
          termsVersion: TERMS_VERSION,
        });
        return NextResponse.json({
          url: `${siteUrl}/success?gold_included=1`,
        });
      }

      const addId = getGoldAdditionalPriceId();
      if (!addId) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_ADDITIONAL (visita adicional, lun–vie).",
          },
          { status: 500 },
        );
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: addId, quantity: 1 }],
        metadata: {
          ...metadata,
          gold_visit_tier: "additional",
          billing_service_usd: String(GOLD_ADDITIONAL_SERVICE_USD),
          billing_deposit_usd: "0",
        },
        custom_text: {
          submit: {
            message: t(dict, "checkoutStripe.goldAdditionalSubmit"),
          },
        },
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    /**
     * Socio Gold — emergencia fin de semana: pago único $950 (sin reserva $50).
     * Price: NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_EMERGENCY (importe total del servicio).
     */
    if (serviceType === "GOLD_WEEKEND_EMERGENCY") {
      if (!data.scheduledAt) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.dateRequired") },
          { status: 400 },
        );
      }
      const wkId = getGoldMemberWeekendPriceId();
      if (!wkId) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_EMERGENCY (servicio $950 socio fin de semana).",
          },
          { status: 500 },
        );
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: wkId, quantity: 1 }],
        metadata: {
          ...metadata,
          ...goldWeekendEmergencyFullMetadata(wkId),
        },
        custom_text: {
          submit: {
            message: t(dict, "checkoutStripe.goldWeekendSubmit"),
          },
        },
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    /**
     * Instalación por hora (no Gold): Dispatch fee $195 (mismo Price que reserva estándar);
     * cubre despacho + primera hora; horas adicionales $150 en sitio.
     */
    if (serviceType === "HOURLY_PLUMBING") {
      if (!data.scheduledAt) {
        return NextResponse.json(
          { error: t(dict, "api.checkout.dateRequired") },
          { status: 400 },
        );
      }
      if (!reservationPriceId) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA (Dispatch fee $195, servicio por hora).",
          },
          { status: 500 },
        );
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: reservationPriceId, quantity: 1 }],
        metadata: {
          ...metadata,
          ...hourlyDispatchMetadata(),
        },
        custom_text: {
          submit: {
            message: t(dict, "checkoutStripe.hourlyFlatFeeSubmit"),
          },
        },
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    /** HydroNet Gold Connect — cita estándar (lun–vie): tarifa plana $195; total servicio $950, saldo $755. */
    if (serviceType === "CONNECT_STANDARD") {
      if (!reservationPriceId) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA (tarifa plana $195, citas estándar).",
          },
          { status: 500 },
        );
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: reservationPriceId, quantity: 1 }],
        metadata: {
          ...metadata,
          ...connectDepositMetadata("standard"),
        },
        custom_text: {
          submit: { message: t(dict, "checkoutStripe.flatFeeSubmit") },
        },
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    /**
     * No socio — visita única fin de semana (sáb–dom TN): total $1,250; hoy tarifa plana $195; saldo el día del servicio.
     * Referencia precio $1,250: NEXT_PUBLIC_STRIPE_PRICE_ID_EMERGENCY (metadata).
     */
    if (serviceType === "EMERGENCY") {
      const emergencyRef = getPublicEmergencyServicePriceId();
      if (!emergencyRef) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_EMERGENCY (referencia servicio $1,250, no socio).",
          },
          { status: 500 },
        );
      }
      if (!reservationPriceId) {
        return NextResponse.json(
          {
            error:
              "Falta NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA (tarifa plana $195).",
          },
          { status: 500 },
        );
      }
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: data.email,
        ...stripeCheckoutTaxDefaults,
        ...stripeCheckoutUxDefaults,
        line_items: [{ price: reservationPriceId, quantity: 1 }],
        metadata: {
          ...metadata,
          ...connectDepositMetadata("emergency"),
          stripe_price_id_emergency_reference: emergencyRef,
        },
        custom_text: {
          submit: {
            message: t(dict, "checkoutStripe.flatFeeSubmit"),
          },
        },
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
      });
      return NextResponse.json({ url: checkout.url });
    }

    return NextResponse.json(
      { error: t(dict, "api.checkout.unsupportedService") },
      { status: 400 },
    );
  } catch (e) {
    if (e instanceof ServiceDateError) {
      let msg: string;
      switch (e.code) {
        case "WEEKDAY_ONLY":
          msg = t(dict, "booking.dateMismatchWeekday");
          break;
        case "CONNECT_WEEKDAY_HOURS_ONLY":
          msg = t(dict, "booking.dateMismatchWeekdayHours");
          break;
        case "PUBLIC_SLOT_OUT_OF_HOURS":
          msg = t(dict, "booking.dateMismatchOutsideHours");
          break;
        case "WEEKEND_EMERGENCY_GOLD":
          msg = t(dict, "booking.dateMismatchWeekendGold");
          break;
        default:
          msg = t(dict, "booking.dateMismatchWeekday");
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Error";
    if (isStripeSecretKeyFailure(e)) {
      console.error(e);
      return NextResponse.json(
        {
          error:
            "La clave secreta de Stripe (STRIPE_SECRET_KEY) está expirada o no es válida. En Stripe Dashboard → Developers → API keys, cree una nueva clave secreta (sk_live_… o sk_test_…), actualice STRIPE_SECRET_KEY en .env (sin comillas ni espacios extra) y reinicie el servidor.",
        },
        { status: 500 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
