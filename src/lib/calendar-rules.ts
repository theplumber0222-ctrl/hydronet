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

/** Hora del día (0–23) en zona horaria de Tennessee. */
export function getHourTN(isoDate: string): number {
  const d = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TN_TZ,
    hour: "numeric",
    hour12: false,
  });
  const part = formatter
    .formatToParts(d)
    .find((p) => p.type === "hour")?.value;
  const n = part ? parseInt(part, 10) : NaN;
  return Number.isFinite(n) ? n : d.getUTCHours();
}

/** L–V 8am–4pm TN: tarifa estándar visita única ($950 total). Hora local: [8, 16). */
export function isRegularWeekdayConnectSlotTN(isoDate: string): boolean {
  if (!isWeekdayTN(isoDate)) return false;
  const h = getHourTN(isoDate);
  return h >= 8 && h < 16;
}

/**
 * Slot considerado emergencia para no-socio (Jetting Visita Única / Connect):
 *  - Sáb–Dom 8am–4pm
 *  - L–V antes de 8am o después de 4pm
 */
export function isEmergencySlotTN(isoDate: string): boolean {
  if (isWeekendTN(isoDate)) {
    const h = getHourTN(isoDate);
    return h >= 8 && h < 16;
  }
  if (isWeekdayTN(isoDate)) {
    const h = getHourTN(isoDate);
    return h < 8 || h >= 16;
  }
  return false;
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
    if (!isWeekdayTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKDAY_ONLY");
    }
    if (!isRegularWeekdayConnectSlotTN(scheduledAtIso)) {
      throw new ServiceDateError("CONNECT_WEEKDAY_HOURS_ONLY");
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
    if (!isEmergencySlotTN(scheduledAtIso)) {
      throw new ServiceDateError("PUBLIC_SLOT_OUT_OF_HOURS");
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
    if (!wd) return "WEEKDAY_ONLY";
    if (!isRegularWeekdayConnectSlotTN(scheduledAtIso)) {
      return "CONNECT_WEEKDAY_HOURS_ONLY";
    }
    return null;
  }

  if (serviceType === "GOLD_SCHEDULED" || serviceType === "HOURLY_PLUMBING") {
    if (!wd) return "WEEKDAY_ONLY";
    return null;
  }
  if (serviceType === "GOLD_EXTRA") {
    if (!wd) return "WEEKDAY_ONLY";
    return null;
  }
  if (serviceType === "GOLD_WEEKEND_EMERGENCY") {
    if (!we) return "WEEKEND_EMERGENCY_GOLD";
    return null;
  }
  if (serviceType === "EMERGENCY") {
    if (!isEmergencySlotTN(scheduledAtIso)) return "PUBLIC_SLOT_OUT_OF_HOURS";
    return null;
  }
  return null;
}
