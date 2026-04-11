import Stripe from "stripe";

/**
 * Lee STRIPE_SECRET_KEY desde process.env (Next.js carga .env al arrancar el servidor).
 * Normaliza espacios y comillas accidentales que hacen fallar la API con errores como "Expired API Key".
 */
export function normalizeStripeSecretKey(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env and restart `next dev` or the Node process.",
    );
  }
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  if (!k.startsWith("sk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_ (check .env for typos or extra characters).",
    );
  }
  return k;
}

export function getStripe(): InstanceType<typeof Stripe> {
  const key = normalizeStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  return new Stripe(key);
}

/** True when Stripe rejected the secret key (expired, invalid, or missing). */
export function isStripeSecretKeyFailure(e: unknown): boolean {
  if (e instanceof Error) {
    const m = e.message;
    if (
      m.includes("Expired API Key") ||
      m.includes("Invalid API Key") ||
      m.includes("No API key provided")
    ) {
      return true;
    }
  }
  if (typeof e === "object" && e !== null) {
    const o = e as { type?: string; code?: string };
    if (o.type === "StripeAuthenticationError") return true;
    if (o.code === "api_key_expired" || o.code === "invalid_api_key") {
      return true;
    }
  }
  return false;
}

/**
 * $50 reserva — citas estándar (lun–vie), depósitos junto a otros servicios.
 * Orden: NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA → STRIPE_PRICE_ID_RESERVA → STRIPE_PRICE_DEPOSIT
 * En Checkout, `line_items[].price` debe ser un **Price ID** (`price_...`), no un Product ID (`prod_...`).
 */
export function getReservationPriceId(): string | null {
  const id =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA?.trim() ||
    process.env.STRIPE_PRICE_ID_RESERVA?.trim() ||
    process.env.STRIPE_PRICE_DEPOSIT?.trim();
  return id || null;
}

/**
 * Emergencia no socio (sáb–dom, TN): precio Stripe del **servicio** ($1,250).
 * NEXT_PUBLIC_STRIPE_PRICE_ID_EMERGENCY → STRIPE_PRICE_ID_EMERGENCY
 * La reserva de $50 va en línea aparte (NEXT_PUBLIC_STRIPE_PRICE_ID_RESERVA).
 */
export function getPublicEmergencyServicePriceId(): string | null {
  const id =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_EMERGENCY?.trim() ||
    process.env.STRIPE_PRICE_ID_EMERGENCY?.trim();
  return id || null;
}

/** No Socio — Cita estándar ($950): referencia en metadata (Product o Price ID en .env). */
export function getConnectStandardServicePriceId(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CONNECT_STANDARD?.trim() || null
  );
}

/** @deprecated Usar getPublicEmergencyServicePriceId */
export function getEmergencyDepositPriceId(): string | null {
  return getPublicEmergencyServicePriceId();
}

/** Facturación HydroNet Gold Connect (sin membresía): total de servicio y saldo tras depósito de $50. */
export const CONNECT_STANDARD_TOTAL_USD = 950;
export const CONNECT_EMERGENCY_TOTAL_USD = 1250;
export const CONNECT_DEPOSIT_USD = 50;

/** Socio Gold — visita adicional tras agotar las 3 incluidas (lun–vie). */
export const GOLD_ADDITIONAL_SERVICE_USD = 733.33;

/** Socio Gold — servicio fin de semana (sáb–dom, TN). */
export const GOLD_MEMBER_WEEKEND_SERVICE_USD = 950;

/** Servicio por hora — HydroNet LLC (Product prod_UHBxYhulgITKe4; Price en .env). */
export const HOURLY_PLUMBING_RATE_USD = 150;

export function getHourlyPlumbingPriceId(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_HOURLY_PLUMBING?.trim() || null
  );
}

export function connectDepositMetadata(
  tier: "standard" | "emergency",
): Record<string, string> {
  if (tier === "standard") {
    const ref = getConnectStandardServicePriceId();
    return {
      billing_total_usd: String(CONNECT_STANDARD_TOTAL_USD),
      balance_after_deposit_usd: String(
        CONNECT_STANDARD_TOTAL_USD - CONNECT_DEPOSIT_USD,
      ),
      deposit_usd: String(CONNECT_DEPOSIT_USD),
      connect_tier: "standard",
      ...(ref
        ? { stripe_price_id_connect_standard_reference: ref }
        : {}),
    };
  }
  return {
    billing_total_usd: String(CONNECT_EMERGENCY_TOTAL_USD),
    balance_pending_usd: String(
      CONNECT_EMERGENCY_TOTAL_USD - CONNECT_DEPOSIT_USD,
    ),
    deposit_usd: String(CONNECT_DEPOSIT_USD),
    connect_tier: "emergency",
  };
}

/** Metadata socio Gold — emergencia fin de semana (reserva $50; total servicio $950 referenciado). @deprecated Prefer goldWeekendEmergencyFullMetadata */
export function goldWeekendEmergencyDepositMetadata(
  stripePriceIdGoldEmergency: string,
): Record<string, string> {
  return {
    billing_total_usd: String(GOLD_MEMBER_WEEKEND_SERVICE_USD),
    balance_pending_usd: String(
      GOLD_MEMBER_WEEKEND_SERVICE_USD - CONNECT_DEPOSIT_USD,
    ),
    deposit_usd: String(CONNECT_DEPOSIT_USD),
    gold_visit_tier: "weekend_emergency_deposit",
    stripe_price_id_gold_emergency_reference: stripePriceIdGoldEmergency,
  };
}

/** Socio Gold — emergencia fin de semana: pago único $950 (sin reserva $50). */
export function goldWeekendEmergencyFullMetadata(
  stripePriceIdGoldEmergency: string,
): Record<string, string> {
  return {
    billing_total_usd: String(GOLD_MEMBER_WEEKEND_SERVICE_USD),
    balance_pending_usd: "0",
    deposit_usd: "0",
    gold_visit_tier: "weekend_emergency_full",
    stripe_price_id_gold_emergency_reference: stripePriceIdGoldEmergency,
  };
}

/** Texto legacy ES (preferir i18n `stripeUi.checkoutDepositSummary` en UI). */
export const CHECKOUT_DEPOSIT_SUMMARY_ES =
  "Reserva $50 (visita única no socio o por hora; no membresía Gold). Se acredita al total ($950 lun–vie, $1,250 sáb–dom o total por hora). Saldo el día del servicio. No reembolsable salvo cancelación con ≥24 h.";


/** Gold mensual (~$183.33/mes) — suscripción Checkout */
export function getGoldMonthlyPriceId(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_Membership?.trim() || null;
}

/** Gold anual ($2,200/año) — suscripción Checkout */
export function getGoldAnnualPriceId(): string | null {
  const id =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_ANNUAL?.trim() ||
    process.env.STRIPE_PRICE_GOLD_ANNUAL?.trim();
  return id || null;
}

/** Visita adicional Gold (lun–vie) cuando visitsUsed >= 3 incluidas. */
export function getGoldAdditionalPriceId(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_ADDITIONAL?.trim() || null
  );
}

/**
 * Socio Gold — emergencia fin de semana: un solo cargo en Checkout por el total del servicio ($950).
 * `NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_EMERGENCY` — Price ID (`price_...`) cuyo importe sea $950 (no depósito $50).
 */
export function getGoldMemberWeekendPriceId(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GOLD_EMERGENCY?.trim() || null
  );
}

export type GoldBilling = "monthly" | "annual";

/** Detecta plan mensual/anual por Price IDs en la sesión o metadata gold_billing. */
export function resolveMembershipPlanInterval(
  linePriceIds: Set<string>,
  metadataGoldBilling?: string | null,
): GoldBilling | null {
  if (metadataGoldBilling === "monthly") return "monthly";
  if (metadataGoldBilling === "annual") return "annual";

  const monthly = getGoldMonthlyPriceId();
  const annual = getGoldAnnualPriceId();
  if (annual && linePriceIds.has(annual)) return "annual";
  if (monthly && linePriceIds.has(monthly)) return "monthly";
  return null;
}

export function planIntervalToDb(
  billing: GoldBilling | null,
): "month" | "year" | null {
  if (billing === "monthly") return "month";
  if (billing === "annual") return "year";
  return null;
}

export function planIntervalDbToLabel(
  interval: string | null | undefined,
): string {
  if (interval === "month") return "Plan mensual Gold";
  if (interval === "year") return "Plan anual Gold";
  return "Socio Gold";
}

type SubscriptionLike = {
  items?: { data?: Array<{ price?: string | { id?: string } | null }> };
};

/** Identifica mensual vs anual a partir de los Price IDs de la suscripción en Stripe. */
export function planIntervalFromSubscription(
  sub: SubscriptionLike,
): "month" | "year" | null {
  const monthly = getGoldMonthlyPriceId();
  const annual = getGoldAnnualPriceId();
  for (const item of sub.items?.data ?? []) {
    const p = item.price;
    const pid = typeof p === "string" ? p : p?.id ?? null;
    if (!pid) continue;
    if (annual && pid === annual) return "year";
    if (monthly && pid === monthly) return "month";
  }
  return null;
}

/** Stripe Tax: automatic US/TN sales tax on Checkout (enable Tax + registrations in Dashboard). */
export const stripeCheckoutTaxDefaults = {
  automatic_tax: { enabled: true as const },
  billing_address_collection: "required" as const,
};

/**
 * UX en Checkout: idioma y enlace de salida.
 * `cancel_url` (en la ruta de checkout) define a dónde vuelve el cliente al cancelar;
 * Stripe muestra el control para salir de la pasarela hacia esa URL.
 */
export const stripeCheckoutUxDefaults = {
  locale: "es" as const,
};

export const TERMS_VERSION = "tn-2026-04";

export const DEPOSIT_LEGAL_ES =
  "La reserva de $50 aplica a visitas únicas y trabajo por hora (no a la membresía Gold). No es reembolsable salvo cancelación con al menos 24 horas de anticipación; se acredita al total del servicio. Sujeto a leyes comerciales de Tennessee.";

export const SLA_NOTE_ES =
  "Servicios de emergencia fuera de horario estándar están sujetos a disponibilidad y cargos adicionales.";
