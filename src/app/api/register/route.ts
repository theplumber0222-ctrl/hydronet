/**
 * Registro por email/contraseña: Prisma → tabla `User` (bcrypt).
 * NextAuth (Credentials) valida contra la misma tabla.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getDatabaseUrl } from "@/lib/database-url";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().min(1).optional(),
  ),
});

export async function POST(req: Request) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  if (!getDatabaseUrl()) {
    console.error(
      "[register] Sin DATABASE_URL / POSTGRES_PRISMA_URL / POSTGRES_URL (Vercel → Environment Variables)",
    );
    return NextResponse.json(
      { error: t(dict, "api.registerDbUnavailable") },
      { status: 503 },
    );
  }

  try {
    const json = await req.json();
    const data = schema.parse(json);
    const email = data.email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: t(dict, "api.emailExists") },
        { status: 400 },
      );
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.user.create({
      data: {
        email,
        name: data.name,
        passwordHash,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: t(dict, "api.registerInvalid") },
        { status: 400 },
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: t(dict, "api.emailExists") },
          { status: 400 },
        );
      }
      if (e.code === "P1001" || e.code === "P1000") {
        return NextResponse.json(
          { error: t(dict, "api.registerDbUnavailable") },
          { status: 503 },
        );
      }
      if (e.code === "P2021") {
        console.error(
          "[register] Tabla inexistente — ejecute npx prisma migrate deploy en la base de producción",
        );
        return NextResponse.json(
          { error: t(dict, "api.registerDbUnavailable") },
          { status: 503 },
        );
      }
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: t(dict, "api.registerDbUnavailable") },
        { status: 503 },
      );
    }
    console.error("[register]", e);
    return NextResponse.json(
      { error: t(dict, "api.registerFail") },
      { status: 500 },
    );
  }
}
