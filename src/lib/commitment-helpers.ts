import type { GoldMembership } from "@prisma/client";

/** Cliente aún dentro del compromiso de 12 meses (mensual) o primer año (anual). */
export function isUnderServiceCommitment(m: GoldMembership): boolean {
  if (!m.planInterval || !m.commitmentStartedAt) return false;
  if (m.planInterval === "month") {
    return m.commitmentMonthsPaid < 12;
  }
  if (m.planInterval === "year") {
    const start = new Date(m.commitmentStartedAt);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return Date.now() < end.getTime();
  }
  return false;
}
