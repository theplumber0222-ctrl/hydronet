/**
 * Vercel + Prisma Postgres puede exponer la cadena como DATABASE_URL, POSTGRES_PRISMA_URL o POSTGRES_URL.
 */
export function getDatabaseUrl(): string | undefined {
  const u =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();
  return u || undefined;
}
