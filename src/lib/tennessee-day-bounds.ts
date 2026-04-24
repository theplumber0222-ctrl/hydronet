/** Calendario “día de trabajo” alineado a Tennessee (America/Chicago). */

export const TENNESSEE_TIMEZONE = "America/Chicago";

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TENNESSEE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatYmdInTn(d: Date): string {
  return dateFmt.format(d);
}

/** Siguiente día civil YYYY-MM-DD (Gregorio), alineado a cómo el usuario elige la fecha en la agenda. */
export function getNextGregorianYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Primer instante UTC del día calendario YYYY-MM-DD en Tennessee (inicio del día laboral TN). */
export function getTennesseeDayStartUtc(ymd: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("invalid_ymd");
  }

  const [y, mo, day] = ymd.split("-").map(Number);
  const approx = Date.UTC(y, mo - 1, day, 12, 0, 0);

  let startMs: number | null = null;
  for (let offset = -40 * 3600_000; offset <= 40 * 3600_000; offset += 3600_000) {
    const t = approx + offset;
    const dt = new Date(t);
    if (formatYmdInTn(dt) === ymd) {
      let lo = t - 3600_000;
      let hi = t + 3600_000;
      while (hi - lo > 60_000) {
        const mid = Math.floor((lo + hi) / 2);
        if (formatYmdInTn(new Date(mid)) < ymd) lo = mid;
        else hi = mid;
      }
      let cur = hi;
      while (formatYmdInTn(new Date(cur - 60_000)) === ymd) {
        cur -= 60_000;
      }
      startMs = cur;
      break;
    }
  }

  if (startMs == null) {
    throw new Error("tn_bounds_failed");
  }

  return new Date(startMs);
}

/**
 * Inicio (inclusivo) y fin (exclusivo) en UTC para un día calendario YYYY-MM-DD en TN.
 */
export function getTennesseeDayBoundsUtc(ymd: string): { start: Date; end: Date } {
  const start = getTennesseeDayStartUtc(ymd);
  const end = getTennesseeDayStartUtc(getNextGregorianYmd(ymd));
  return { start, end };
}

/** Hoy en TN como YYYY-MM-DD (para default de agenda). */
export function getTodayYmdTennessee(now = new Date()): string {
  return dateFmt.format(now);
}
