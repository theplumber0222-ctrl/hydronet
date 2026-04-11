import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** GET: estado Gold del usuario logueado (visitas usadas) para el formulario de reserva. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ gold: null });
  }

  const m = await prisma.goldMembership.findUnique({
    where: { userId: session.user.id },
  });

  if (!m || m.status !== "active") {
    return NextResponse.json({ gold: null });
  }

  return NextResponse.json({
    gold: {
      active: true as const,
      visitsUsed: m.visitsUsed,
      visitsIncluded: m.visitsIncluded,
    },
  });
}
