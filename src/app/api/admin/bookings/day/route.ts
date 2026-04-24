import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { servicioReportCopy } from "@/lib/servicio-report-copy";
import {
  getTennesseeDayBoundsUtc,
  getTodayYmdTennessee,
} from "@/lib/tennessee-day-bounds";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";

export const runtime = "nodejs";

const listSelect = {
  id: true,
  restaurantName: true,
  addressLine: true,
  scheduledAt: true,
  tabletCode: true,
  serviceType: true,
  status: true,
} as const;

export async function GET(req: Request) {
  const lang = req.headers.get("x-hydronet-lang") === "en" ? "en" : "es";
  const c = servicioReportCopy(lang);

  const auth = authorizeTabletRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: c.apiUnauthorized }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date")?.trim() ?? "";
  const ymd = dateParam || getTodayYmdTennessee();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getTennesseeDayBoundsUtc(ymd));
  } catch {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
    },
    select: listSelect,
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({
    date: ymd,
    timezone: "America/Chicago",
    bookings: bookings.map((b) => ({
      ...b,
      scheduledAt: b.scheduledAt.toISOString(),
    })),
  });
}
