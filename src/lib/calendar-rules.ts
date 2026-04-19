import { ServiceType } from "@prisma/client";
import {
  ServiceDateError,
  type ServiceDateErrorCode,
} from "@/lib/service-date-error";

const TN_TZ = "America/Chicago";

export function getDayOfWeekInTN(isoDate: string): number {
  const d = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TN_TZ,
    weekday: "short",
  });
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const part = formatter.formatToParts(d).find((p) => p.type === "weekday")
    ?.value;
  if (!part) return d.getUTCDay();
  return map[part] ?? d.getUTCDay();
}

export function isWeekdayTN(isoDate: string): boolean {
  const dow = getDayOfWeekInTN(isoDate);
  return dow >= 1 && dow <= 5;
}

export function isWeekendTN(isoDate: string): boolean {
  const dow = getDayOfWeekInTN(isoDate);
  return dow === 0 || dow === 6;
}

/** Hora del día en Tennessee (0-23) para la fecha indicada. */
export function getHourTN(isoDate: string): number {
  const d = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TN_TZ,
    hour: "numeric",
    hour12: false,
  });
  const part = formatter.formatToParts(d).find((p) => p.type === "hour")?.value;
  const n = part ? parseInt(part, 10) : NaN;
  return Number.isFinite(n) ? n : d.getUTCHours();
}

/**
 * Horario "regular" en HydroNet: Lun-Vie de 8:00am a 4:00pm Tennessee.
 * Cualquier otra hora L-V (antes de 8am o desde las 4:00pm en adelante) es emergencia.
 */
export function isAfterHoursWeekdayTN(isoDate: string): boolean {
  if (!isWeekdayTN(isoDate)) return false;
  const h = getHourTN(isoDate);
  return h < 8 || h >= 16;
}

/**
 * Cobertura "emergencia" no socio: L-V fuera de 8am-4pm + Sáb-Dom (8am-4pm la oferta principal).
 * Esta función solo decide si el slot debe cotizarse como EMERGENCY ($1,250).
 */
export function isEmergencySlotTN(isoDate: string): boolean {
  return isWeekendTN(isoDate) || isAfterHoursWeekdayTN(isoDate);
}

export function assertDateAllowedForService(
  serviceType: ServiceType,
  scheduledAtIso: string,
): void {
  if (serviceType === "GOLD_MEMBERSHIP") return;

  if (serviceType === "GOLD_SCHEDULED" || serviceType === "GOLD_EXTRA") {
    if (!isWeekdayTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKDAY_ONLY");
    }
    return;
  }

  if (serviceType === "GOLD_WEEKEND_EMERGENCY") {
    if (!isWeekendTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKEND_EMERGENCY_GOLD");
    }
    return;
  }

  if (serviceType === "CONNECT_STANDARD") {
    // Visita única en horario regular: solo Lun-Vie 8am-4pm Tennessee.
    if (!isWeekdayTN(scheduledAtIso) || isAfterHoursWeekdayTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKDAY_ONLY");
    }
    return;
  }

  if (serviceType === "HOURLY_PLUMBING") {
    if (!isWeekdayTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKDAY_ONLY");
    }
    return;
  }

  if (serviceType === "EMERGENCY") {
    // Emergencia no socio: Sáb-Dom o Lun-Vie después de 4pm.
    if (!isEmergencySlotTN(scheduledAtIso)) {
      throw new ServiceDateError("EMERGENCY_WEEKEND_ONLY");
    }
    return;
  }
}

/** UI: mismatch between selected date and service type (Tennessee). */
export function getDateMismatchCode(
  serviceType: ServiceType,
  scheduledAtIso: string,
): ServiceDateErrorCode | null {
  const wd = isWeekdayTN(scheduledAtIso);
  const we = isWeekendTN(scheduledAtIso);

  if (serviceType === "CONNECT_STANDARD") {
    if (!wd || isAfterHoursWeekdayTN(scheduledAtIso)) {
      return "WEEKDAY_ONLY";
    }
  }
  if (
    serviceType === "GOLD_SCHEDULED" ||
    serviceType === "HOURLY_PLUMBING"
  ) {
    if (!wd) {
      return "WEEKDAY_ONLY";
    }
  }
  if (serviceType === "GOLD_EXTRA") {
    if (!wd) {
      return "WEEKDAY_ONLY";
    }
  }
  if (serviceType === "GOLD_WEEKEND_EMERGENCY") {
    if (!we) {
      return "WEEKEND_EMERGENCY_GOLD";
    }
  }
  if (serviceType === "EMERGENCY") {
    if (!isEmergencySlotTN(scheduledAtIso)) {
      return "EMERGENCY_WEEKEND_ONLY";
    }
  }
  return null;
}
