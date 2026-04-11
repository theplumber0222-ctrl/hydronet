import {
  CONNECT_DEPOSIT_USD,
  CONNECT_EMERGENCY_TOTAL_USD,
  CONNECT_STANDARD_TOTAL_USD,
  GOLD_ADDITIONAL_SERVICE_USD,
  GOLD_MEMBER_WEEKEND_SERVICE_USD,
  HOURLY_PLUMBING_RATE_USD,
} from "@/lib/stripe";

/** Resumen de socio Gold para UI (cliente o servidor). */
export type GoldMembershipSummary = {
  active: true;
  visitsUsed: number;
  visitsIncluded: number;
};

/**
 * Socio Gold — cita estándar (solo lun–vie).
 * Sin tarifa de reserva $50: visita incluida = $0; adicional = solo precio de socio.
 */
export function getGoldMemberCheckoutBreakdown(
  gold: GoldMembershipSummary,
): {
  tier: "included" | "additional";
  serviceUsd: number;
  depositUsd: number;
  totalChargeUsd: number;
  lines: { label: string; amountUsd: number }[];
} {
  if (gold.visitsUsed < gold.visitsIncluded) {
    return {
      tier: "included",
      serviceUsd: 0,
      depositUsd: 0,
      totalChargeUsd: 0,
      lines: [
        {
          label: "Visita preventiva incluida (sin reserva $50)",
          amountUsd: 0,
        },
      ],
    };
  }

  const service = GOLD_ADDITIONAL_SERVICE_USD;
  return {
    tier: "additional",
    serviceUsd: service,
    depositUsd: 0,
    totalChargeUsd: service,
    lines: [{ label: "Visita adicional — precio socio Gold", amountUsd: service }],
  };
}

/** Socio Gold — emergencia fin de semana: pago único $950 (sin reserva $50). */
export function getGoldWeekendEmergencyDepositBreakdown(): {
  serviceTotalUsd: number;
  depositUsd: number;
  balancePendingUsd: number;
  totalChargeUsd: number;
  lines: { label: string; amountUsd: number }[];
} {
  const s = GOLD_MEMBER_WEEKEND_SERVICE_USD;
  return {
    serviceTotalUsd: s,
    depositUsd: 0,
    balancePendingUsd: 0,
    totalChargeUsd: s,
    lines: [
      { label: "Emergencia fin de semana (socio Gold)", amountUsd: s },
    ],
  };
}

/**
 * No socio.
 * CONNECT: solo reserva $50 hoy; saldo $900.
 * EMERGENCY: solo reserva $50 hoy; saldo pendiente $1,200 (total servicio $1,250).
 */
export function getPublicCheckoutBreakdown(
  serviceType: "CONNECT_STANDARD" | "EMERGENCY",
): {
  serviceTotalUsd: number;
  depositUsd: number;
  balancePendingUsd: number;
  totalChargeUsd: number;
} {
  if (serviceType === "CONNECT_STANDARD") {
    return {
      serviceTotalUsd: CONNECT_STANDARD_TOTAL_USD,
      depositUsd: CONNECT_DEPOSIT_USD,
      balancePendingUsd:
        CONNECT_STANDARD_TOTAL_USD - CONNECT_DEPOSIT_USD,
      totalChargeUsd: CONNECT_DEPOSIT_USD,
    };
  }
  return {
    serviceTotalUsd: CONNECT_EMERGENCY_TOTAL_USD,
    depositUsd: CONNECT_DEPOSIT_USD,
    balancePendingUsd: CONNECT_EMERGENCY_TOTAL_USD - CONNECT_DEPOSIT_USD,
    totalChargeUsd: CONNECT_DEPOSIT_USD,
  };
}

/** Instalación por hora: cobro de 1 unidad mínima en Stripe ($150). */
export function getHourlyPlumbingCheckoutBreakdown(): {
  serviceTotalUsd: number;
  depositUsd: number;
  balancePendingUsd: number;
  totalChargeUsd: number;
} {
  const r = HOURLY_PLUMBING_RATE_USD;
  return {
    serviceTotalUsd: r,
    depositUsd: r,
    balancePendingUsd: 0,
    totalChargeUsd: r,
  };
}
