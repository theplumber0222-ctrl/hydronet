import { prisma } from "@/lib/prisma";
import { generateTabletCode } from "@/lib/tablet-code";

/** Garantiza unicidad en BD (reintentos). */
export async function allocateUniqueTabletCode(): Promise<string> {
  for (let i = 0; i < 24; i++) {
    const code = generateTabletCode();
    const hit = await prisma.booking.findUnique({
      where: { tabletCode: code },
      select: { id: true },
    });
    if (!hit) return code;
  }
  throw new Error("Could not allocate unique tablet code");
}
