import { prisma } from "@/lib/prisma";
import { normalizeTabletQuery } from "@/lib/tablet-code";

export const bookingForTabletSelect = {
  id: true,
  restaurantName: true,
  addressLine: true,
  placeId: true,
  phone: true,
  email: true,
  serviceType: true,
  scheduledAt: true,
  status: true,
  workDescription: true,
  billingContactName: true,
  invoiceEmail: true,
  siteContactName: true,
  siteContactPhone: true,
  spendLimitCents: true,
  approvalOverLimitNote: true,
  tabletCode: true,
  createdAt: true,
} as const;

/**
 * Resuelve por id (cuid) o por código tablet de 8 caracteres.
 */
export async function findBookingForTabletQuery(qRaw: string) {
  const trimmed = qRaw.trim();
  if (!trimmed) return null;

  const byId = await prisma.booking.findUnique({
    where: { id: trimmed },
    select: bookingForTabletSelect,
  });
  if (byId) return byId;

  const code = normalizeTabletQuery(trimmed);
  if (code.length < 8) return null;

  return prisma.booking.findUnique({
    where: { tabletCode: code },
    select: bookingForTabletSelect,
  });
}
