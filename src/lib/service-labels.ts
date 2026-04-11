import { ServiceType } from "@prisma/client";

export function serviceTypeToLabel(st: ServiceType): string {
  switch (st) {
    case "GOLD_MEMBERSHIP":
      return "Membresía HydroNet Gold (anual)";
    case "GOLD_SCHEDULED":
      return "Mantenimiento preventivo Gold";
    case "GOLD_EXTRA":
      return "Visita extra (miembro)";
    case "CONNECT_STANDARD":
      return "HydroNet Plumbing — cita estándar (lun–vie)";
    case "GOLD_WEEKEND_EMERGENCY":
      return "Socio Gold — Emergencia fin de semana";
    case "EMERGENCY":
      return "Servicio de emergencia";
    case "HOURLY_PLUMBING":
      return "Plomería por hora (HydroNet Plumbing)";
    default:
      return st;
  }
}

export function serviceTypeToN8n(st: ServiceType): string {
  return serviceTypeToLabel(st);
}

/** Etiqueta para UI bilingüe (p. ej. tablet). */
export function serviceTypeToLabelLocalized(
  st: ServiceType,
  locale: "en" | "es",
): string {
  if (locale === "es") return serviceTypeToLabel(st);
  switch (st) {
    case "GOLD_MEMBERSHIP":
      return "HydroNet Gold membership (subscription)";
    case "GOLD_SCHEDULED":
      return "Gold preventive maintenance visit";
    case "GOLD_EXTRA":
      return "Gold additional member visit";
    case "CONNECT_STANDARD":
      return "HydroNet Plumbing — standard appointment (Mon–Fri)";
    case "GOLD_WEEKEND_EMERGENCY":
      return "Gold member — weekend emergency";
    case "EMERGENCY":
      return "Non-member weekend emergency";
    case "HOURLY_PLUMBING":
      return "Hourly plumbing (HydroNet Plumbing)";
    default:
      return st;
  }
}
