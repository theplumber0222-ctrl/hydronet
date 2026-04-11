import { NextResponse } from "next/server";
import { z } from "zod";
import { EstimateStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";
import { estimateExpiresAt } from "@/lib/estimate-constants";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  lineItemsSchema,
  sumLineItemsCents,
} from "@/lib/estimate-line-items";

export const runtime = "nodejs";

const createBody = z.object({
  restaurantName: z.string().min(1).max(500),
  email: z.string().email(),
  phone: z.string().max(100).optional().nullable(),
  addressLine: z.string().max(1000).optional().nullable(),
  lineItems: lineItemsSchema,
  notes: z.string().max(10000).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!authorizeTabletRequest(req).ok) return unauthorized();

  const url = new URL(req.url);
  const emailRaw = url.searchParams.get("email")?.trim();
  const status = url.searchParams.get("status")?.trim() as
    | EstimateStatus
    | undefined;

  const where: Prisma.EstimateWhereInput = {};
  if (emailRaw) {
    where.email = normalizeEmail(emailRaw);
  }
  if (
    status &&
    Object.values(EstimateStatus).includes(status as EstimateStatus)
  ) {
    where.status = status as EstimateStatus;
  }

  const rows = await prisma.estimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      restaurantName: true,
      email: true,
      phone: true,
      addressLine: true,
      lineItems: true,
      totalCents: true,
      notes: true,
      status: true,
      expiresAt: true,
      convertedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ estimates: rows });
}

export async function POST(req: Request) {
  if (!authorizeTabletRequest(req).ok) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lineItems, email, status, ...rest } = parsed.data;
  const totalCents = sumLineItemsCents(lineItems);
  if (totalCents <= 0) {
    return NextResponse.json(
      { error: "totalCents must be greater than zero" },
      { status: 400 },
    );
  }

  const expiresAt = estimateExpiresAt();
  const estStatus =
    status === "DRAFT" ? EstimateStatus.DRAFT : EstimateStatus.ACTIVE;

  const row = await prisma.estimate.create({
    data: {
      restaurantName: rest.restaurantName,
      email: normalizeEmail(email),
      phone: rest.phone?.trim() || null,
      addressLine: rest.addressLine?.trim() || null,
      lineItems,
      totalCents,
      notes: rest.notes?.trim() || null,
      status: estStatus,
      expiresAt,
    },
  });

  return NextResponse.json({ estimate: row });
}
