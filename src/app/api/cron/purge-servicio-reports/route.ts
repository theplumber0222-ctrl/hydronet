import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  coercePhotoRefs,
  deleteServicioReportFiles,
} from "@/lib/servicio-report-storage";

export const runtime = "nodejs";
/** Evita que el handler se trate como estático y asegura respuesta JSON en runtime. */
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Purga reportes de servicio cuyo `purgeAfter` ya venció (serviceDate + 2 años).
 * Borra archivos de Vercel Blob (fotos + PDF) y luego el registro Prisma.
 *
 * Authorization: Bearer <CRON_SECRET>
 *
 * Configuración recomendada en Vercel Cron:
 *   path: /api/cron/purge-servicio-reports
 *   schedule: "0 4 * * *"  (diario, 4am UTC)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return json({ ok: false, error: "CRON_SECRET not configured" }, 503);
  }

  const raw =
    req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const bearer = raw.startsWith("Bearer ")
    ? raw.slice("Bearer ".length).trim()
    : "";

  if (!bearer || bearer !== secret) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const now = new Date();

  const expired = await prisma.servicioReport.findMany({
    where: { purgeAfter: { lt: now } },
    select: {
      id: true,
      pdfUrl: true,
      photosBefore: true,
      photosAfter: true,
    },
    take: 500,
  });

  let blobErrors = 0;
  for (const r of expired) {
    try {
      await deleteServicioReportFiles({
        pdfUrl: r.pdfUrl,
        photosBefore: coercePhotoRefs(r.photosBefore),
        photosAfter: coercePhotoRefs(r.photosAfter),
      });
    } catch (err) {
      console.error(`[purge-servicio-reports] blob delete failed (${r.id})`, err);
      blobErrors += 1;
    }
  }

  let deletedCount = 0;
  if (expired.length > 0) {
    const result = await prisma.servicioReport.deleteMany({
      where: { id: { in: expired.map((r) => r.id) } },
    });
    deletedCount = result.count;
  }

  return json(
    {
      ok: true,
      deletedCount,
      blobErrors,
      at: now.toISOString(),
    },
    200,
  );
}
