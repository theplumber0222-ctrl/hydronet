import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma 7: URL en `prisma.config.ts` (migrate/generate); cliente con `@prisma/adapter-pg`.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString && process.env.NODE_ENV === "production") {
    console.error(
      "[prisma] DATABASE_URL ausente. Conecte Prisma Postgres en Vercel → Storage o defina la variable.",
    );
  }
  const adapter = new PrismaPg({
    connectionString:
      connectionString ?? "postgresql://invalid:invalid@127.0.0.1:5432/placeholder",
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
