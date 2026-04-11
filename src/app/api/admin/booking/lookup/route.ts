import { NextResponse } from "next/server";
import { findBookingForTabletQuery } from "@/lib/booking-for-tablet";
import { servicioReportCopy } from "@/lib/servicio-report-copy";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const lang =
    req.headers.get("x-hydronet-lang") === "en" ? "en" : "es";
  const c = servicioReportCopy(lang);

  const auth = authorizeTabletRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: c.apiUnauthorized }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "missing_q" }, { status: 400 });
  }

  const booking = await findBookingForTabletQuery(q);
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
