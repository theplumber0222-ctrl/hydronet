import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertDateAllowedForService } from "@/lib/calendar-rules";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";
import { ServiceDateError } from "@/lib/service-date-error";

const bodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: t(dict, "api.unauthorized") },
      { status: 401 },
    );
  }

  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, userId: session.user.id, status: "paid" },
  });

  if (!booking) {
    return NextResponse.json(
      { error: t(dict, "api.reschedule.notFound") },
      { status: 404 },
    );
  }

  if (
    booking.serviceType !== "GOLD_SCHEDULED" &&
    booking.serviceType !== "GOLD_EXTRA" &&
    booking.serviceType !== "GOLD_WEEKEND_EMERGENCY"
  ) {
    return NextResponse.json(
      { error: t(dict, "api.reschedule.goldOnly") },
      { status: 400 },
    );
  }

  try {
    const json = await req.json();
    const { scheduledAt } = bodySchema.parse(json);
    assertDateAllowedForService(booking.serviceType, scheduledAt);

    await prisma.booking.update({
      where: { id },
      data: {
        scheduledAt: new Date(scheduledAt),
        isReschedule: true,
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
    if (e instanceof ServiceDateError) {
      const key =
        e.code === "WEEKDAY_ONLY"
          ? "booking.dateMismatchWeekday"
          : e.code === "WEEKEND_EMERGENCY_GOLD"
            ? "booking.dateMismatchWeekendGold"
            : "booking.dateMismatchOutsideHours";
      return NextResponse.json({ error: t(dict, key) }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : t(dict, "api.invalidInput");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
