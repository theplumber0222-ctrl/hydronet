import { NextResponse } from "next/server";
import { EstimateStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
/** Evita que el handler se trate como estático y asegura respuesta JSON en runtime. */
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Purga estimados vencidos (no convertidos). Solo GET.
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return json(
      { ok: false, error: "CRON_SECRET not configured" },
      503,
    );
  }

  const raw =
    req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const bearer = raw.startsWith("Bearer ")
    ? raw.slice("Bearer ".length).trim()
    : "";

  if (!bearer || bearer !== secret) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const now = new Date();

  const deleted = await prisma.estimate.deleteMany({
    where: {
      expiresAt: { lt: now },
      status: {
        in: [
          EstimateStatus.ACTIVE,
          EstimateStatus.DRAFT,
          EstimateStatus.EXPIRED,
        ],
      },
    },
  });

  return json(
    {
      ok: true,
      deletedCount: deleted.count,
      at: now.toISOString(),
    },
    200,
  );
}
