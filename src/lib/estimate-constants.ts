/** Tiempo que un estimado permanece consultable / convertible (90 días). */
export const ESTIMATE_RETENTION_DAYS = 90;

export function estimateExpiresAt(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + ESTIMATE_RETENTION_DAYS);
  return d;
}
