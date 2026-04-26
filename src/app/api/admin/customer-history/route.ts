import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { coercePhotoRefs } from "@/lib/servicio-report-storage";
import { withPhotoViewPath } from "@/lib/servicio-photo-view-token";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!authorizeTabletRequest(req).ok) return unauthorized();

  const url = new URL(req.url);
  const emailRaw = url.searchParams.get("email")?.trim();
  if (!emailRaw || !emailRaw.includes("@")) {
    return NextResponse.json(
      { error: "Query ?email= is required" },
      { status: 400 },
    );
  }

  const email = normalizeEmail(emailRaw);

  const [bookings, estimates, workOrders, servicioReportsRaw] = await Promise.all([
    prisma.booking.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        restaurantName: true,
        email: true,
        phone: true,
        scheduledAt: true,
        status: true,
        serviceType: true,
        createdAt: true,
      },
    }),
    prisma.estimate.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        restaurantName: true,
        email: true,
        totalCents: true,
        status: true,
        expiresAt: true,
        convertedAt: true,
        createdAt: true,
      },
    }),
    prisma.authorizedWorkOrder.findMany({
      where: { email },
      orderBy: { authorizedAt: "desc" },
      take: 100,
      select: {
        id: true,
        estimateId: true,
        restaurantName: true,
        email: true,
        totalCents: true,
        status: true,
        workerId: true,
        authorizedAt: true,
        createdAt: true,
      },
    }),
    prisma.servicioReport.findMany({
      where: { clientEmail: email },
      orderBy: { serviceDate: "desc" },
      take: 100,
      select: {
        id: true,
        clientEmail: true,
        restaurantName: true,
        technicianName: true,
        serviceDate: true,
        serviceLanguage: true,
        bookingReference: true,
        checklistAirGap: true,
        checklistHandSink: true,
        checklistGreaseTrap: true,
        amountDue: true,
        invoiceSubtotal: true,
        depositCredit: true,
        pdfUrl: true,
        photosBefore: true,
        photosAfter: true,
        createdAt: true,
      },
    }),
  ]);

  const servicioReports = servicioReportsRaw.map((r) => ({
    id: r.id,
    clientEmail: r.clientEmail,
    restaurantName: r.restaurantName,
    technicianName: r.technicianName,
    serviceDate: r.serviceDate.toISOString(),
    serviceLanguage: r.serviceLanguage,
    bookingReference: r.bookingReference,
    checklistAirGap: r.checklistAirGap,
    checklistHandSink: r.checklistHandSink,
    checklistGreaseTrap: r.checklistGreaseTrap,
    amountDue: r.amountDue,
    invoiceSubtotal: r.invoiceSubtotal,
    depositCredit: r.depositCredit,
    pdfUrl: r.pdfUrl,
    photosBefore: coercePhotoRefs(r.photosBefore).map(withPhotoViewPath),
    photosAfter: coercePhotoRefs(r.photosAfter).map(withPhotoViewPath),
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    email,
    bookings,
    estimates,
    workOrders,
    servicioReports,
  });
}
