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
    return;
  }

  if (serviceType === "HOURLY_PLUMBING") {
    if (!isWeekdayTN(scheduledAtIso)) {
      throw new ServiceDateError("WEEKDAY_ONLY");
    }
    return;
  }

  if (serviceType === "EMERGENCY") {
    if (!isWeekendTN(scheduledAtIso)) {
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

  if (
    serviceType === "CONNECT_STANDARD" ||
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
    if (!we) {
      return "EMERGENCY_WEEKEND_ONLY";
    }
  }
  return null;
}
