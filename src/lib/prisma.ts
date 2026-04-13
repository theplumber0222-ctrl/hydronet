import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";

/**
 * Prisma 6: conexión estándar por `DATABASE_URL` (sin adapter de driver).
 * En Vercel, reutilizar el cliente en `globalThis` evita agotar conexiones.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const url = getDatabaseUrl();
  if (!url && process.env.NODE_ENV === "production") {
    console.error(
      "[prisma] Sin cadena de conexión. Defina DATABASE_URL (o POSTGRES_PRISMA_URL / POSTGRES_URL) en Vercel.",
    );
  }
  return new PrismaClient({
    ...(url
      ? {
          datasources: {
            db: { url },
          },
        }
      : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

globalForPrisma.prisma = prisma;
