import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const bodySchema = z.object({
  locale: z.enum(["en", "es"]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { locale } = bodySchema.parse(json) as { locale: Locale };
    const res = NextResponse.json({ ok: true });
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
}
