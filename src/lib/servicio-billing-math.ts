import { CONNECT_DEPOSIT_USD, HOURLY_PLUMBING_RATE_USD } from "@/lib/stripe";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Única fuente de verdad para importes de informe de servicio en sitio
 * (replica la lógica de negocio acordada).
 */
export type ServicioBillingSnapshot = {
  hourlyRateUsd: number;
  laborHours: number;
  /** hours × hourlyRate */
  laborTotal: number;
  materialsSubtotal: number;
  partsSubtotal: number;
  otherChargesSubtotal: number;
  /** laborTotal + materials + parts + other */
  subtotal: number;
  /** crédito dispatch (p. ej. $195) — se resta una sola vez */
  dispatchCredit: number;
  amountDue: number;
};

export function computeServicioBilling(input: {
  laborHours: number;
  materialsSubtotal: number;
  partsSubtotal: number;
  otherChargesSubtotal: number;
}): ServicioBillingSnapshot {
  const hourlyRateUsd = HOURLY_PLUMBING_RATE_USD;
  const laborTotal = round2(input.laborHours * hourlyRateUsd);
  const subtotal = round2(
    laborTotal +
      input.materialsSubtotal +
      input.partsSubtotal +
      input.otherChargesSubtotal,
  );
  const dispatchCredit = CONNECT_DEPOSIT_USD;
  const amountDue = Math.max(0, round2(subtotal - dispatchCredit));
  return {
    hourlyRateUsd,
    laborHours: input.laborHours,
    laborTotal,
    materialsSubtotal: input.materialsSubtotal,
    partsSubtotal: input.partsSubtotal,
    otherChargesSubtotal: input.otherChargesSubtotal,
    subtotal,
    dispatchCredit,
    amountDue,
  };
}
