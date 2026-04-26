import type { ServicioLanguage } from "@/lib/servicio-report-copy";

export type ChecklistStatus = "pass" | "fail" | "na";

export type ServicioReportPayload = {
  /** Language for PDF and email output (single-language, no mixing). */
  language: ServicioLanguage;
  /** ID de reserva Prisma (opcional) — aparece en el PDF y en el correo si se envía. */
  bookingReference?: string;
  restaurantName: string;
  clientEmail: string;
  technicianName: string;
  serviceDate: string;
  checklistAirGap: ChecklistStatus;
  checklistHandSink: ChecklistStatus;
  checklistGreaseTrap: ChecklistStatus;
  notes: string;
  /** Tarifa por hora (USD) mostrada en PDF. */
  hourlyRateUsd: number;
  /** Horas de mano de obra. */
  laborHours: number;
  /** hours × tarifa. */
  laborSubtotal: number;
  materialsSubtotal: number;
  partsSubtotal: number;
  otherChargesSubtotal: number;
  /**
   * Mismo “subtotal” de facturación: labor + materials + parts + other
   * (alias de `subtotal` en lógica de negocio).
   */
  invoiceSubtotal: number;
  /** Crédito dispatch; misma lógica que en computeServicioBilling. */
  depositCredit: number;
  amountDue: number;
  /**
   * Si hubo pago con tarjeta requerido, el PDF indica "Pagado" con la sesión;
   * si el saldo era 0, "Sin saldo pendiente" / "No charge".
   */
  paymentStatus: "card_paid" | "no_balance_due";
  photosBefore: Buffer[];
  photosAfter: Buffer[];
};
