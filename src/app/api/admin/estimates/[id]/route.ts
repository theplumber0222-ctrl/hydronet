import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeTabletRequest } from "@/lib/tablet-worker-auth";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!authorizeTabletRequest(_req).ok) return unauthorized();

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: { workOrder: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ estimate });
}
