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
  /** Gross amount before $195 Dispatch fee credit */
  invoiceSubtotal: number;
  depositCredit: number;
  /** invoiceSubtotal - depositCredit, floored at 0 */
  amountDue: number;
  photosBefore: Buffer[];
  photosAfter: Buffer[];
};
