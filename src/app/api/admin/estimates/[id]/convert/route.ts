import { NextResponse } from "next/server";
import { z } from "zod";
import { EstimateStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  workerId: z.string().max(100).optional().nullable(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!authorizeTabletRequest(req).ok) return unauthorized();

  const { id } = await ctx.params;

  let json: unknown = {};
  try {
    const t = await req.text();
    if (t.trim()) json = JSON.parse(t);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const headerWorker = req.headers.get("x-hydronet-worker-id")?.trim() ?? "";
  const workerId =
    parsed.data.workerId?.trim() ||
    (headerWorker.length > 0 ? headerWorker : null);

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const est = await tx.estimate.findUnique({ where: { id } });
      if (!est) {
        return { type: "not_found" as const };
      }
      if (est.status === EstimateStatus.CONVERTED) {
        return { type: "already" as const };
      }
      if (now > est.expiresAt) {
        return { type: "expired" as const };
      }
      if (
        est.status !== EstimateStatus.ACTIVE &&
        est.status !== EstimateStatus.DRAFT
      ) {
        return { type: "bad_status" as const, status: est.status };
      }

      const wo = await tx.authorizedWorkOrder.create({
        data: {
          estimateId: est.id,
          restaurantName: est.restaurantName,
          email: est.email,
          phone: est.phone,
          addressLine: est.addressLine,
          lineItems: est.lineItems as Prisma.InputJsonValue,
          totalCents: est.totalCents,
          notes: est.notes,
          workerId,
          status: "authorized",
        },
      });

      await tx.estimate.update({
        where: { id: est.id },
        data: {
          status: EstimateStatus.CONVERTED,
          convertedAt: now,
        },
      });

      return { type: "ok" as const, workOrder: wo, estimateId: est.id };
    });

    if (result.type === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.type === "already") {
      return NextResponse.json(
        { error: "Estimate already converted" },
        { status: 409 },
      );
    }
    if (result.type === "expired") {
      return NextResponse.json(
        { error: "Estimate expired (past retention window)" },
        { status: 410 },
      );
    }
    if (result.type === "bad_status") {
      return NextResponse.json(
        { error: "Cannot convert this estimate", status: result.status },
        { status: 400 },
      );
    }

    return NextResponse.json({
      workOrder: result.workOrder,
      estimateId: result.estimateId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
