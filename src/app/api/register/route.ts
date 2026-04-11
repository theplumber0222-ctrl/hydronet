import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

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
        { error: t(dict, "api.invalidInput") },
        { status: 400 },
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: t(dict, "api.registerFail") },
      { status: 500 },
    );
  }
}
