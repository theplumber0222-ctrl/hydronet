import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingForTabletSelect } from "@/lib/booking-for-tablet";
import { servicioReportCopy } from "@/lib/servicio-report-copy";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const lang =
    req.headers.get("x-hydronet-lang") === "en" ? "en" : "es";
  const c = servicioReportCopy(lang);

  const auth = authorizeTabletRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: c.apiUnauthorized }, { status: 401 });
  }

  const trimmed = id?.trim() ?? "";
  if (trimmed.length < 10) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: trimmed },
    select: bookingForTabletSelect,
  });

  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
