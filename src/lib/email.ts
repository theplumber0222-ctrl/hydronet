import { Resend } from "resend";
import { getOfficialLogoAbsoluteUrl } from "@/lib/official-logo";
import { DEPOSIT_LEGAL_ES } from "@/lib/stripe";
import {
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";

const CONTACT = process.env.CONTACT_EMAIL ?? "info@hydronet.live";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendBookingConfirmation(params: {
  to: string;
  restaurantName: string;
  serviceLabel: string;
  scheduledAt: string;
  addressLine: string;
  workDescription?: string;
  billingContactName?: string;
  invoiceEmail?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  spendLimitCents?: number;
  approvalOverLimitNote?: string;
  /** Código corto para abrir la ficha en tablet con ID de trabajador. */
  tabletCode?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping confirmation email");
    return;
  }

  const when = new Date(params.scheduledAt).toLocaleString("es-US", {
    timeZone: "America/Chicago",
    dateStyle: "full",
    timeStyle: "short",
  });

  const extraRows: string[] = [];
  if (params.workDescription?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;vertical-align:top;">Trabajo</td><td>${escapeHtml(params.workDescription.trim())}</td></tr>`,
    );
  }
  if (params.billingContactName?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Pagos / facturación</td><td>${escapeHtml(params.billingContactName.trim())}</td></tr>`,
    );
  }
  if (params.invoiceEmail?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Correo facturas</td><td>${escapeHtml(params.invoiceEmail.trim())}</td></tr>`,
    );
  }
  if (params.siteContactName?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Contacto en obra</td><td>${escapeHtml(params.siteContactName.trim())}</td></tr>`,
    );
  }
  if (params.siteContactPhone?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Tel. obra</td><td>${escapeHtml(params.siteContactPhone.trim())}</td></tr>`,
    );
  }
  if (params.spendLimitCents != null && params.spendLimitCents > 0) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Tope reparación (USD)</td><td>${escapeHtml((params.spendLimitCents / 100).toFixed(2))}</td></tr>`,
    );
  }
  if (params.approvalOverLimitNote?.trim()) {
    extraRows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;vertical-align:top;">Aprobación sobre tope</td><td>${escapeHtml(params.approvalOverLimitNote.trim())}</td></tr>`,
    );
  }

  await resend.emails.send({
    from: `HydroNet Plumbing <${CONTACT}>`,
    to: params.to,
    subject: `Confirmación de reserva — ${params.restaurantName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#1F2937;color:#e5e7eb;padding:24px;">
        ${emailLogoHtml()}
        <p style="margin:0 0 12px;">Hemos recibido su pago de reserva y confirmado los siguientes datos:</p>
        <table style="color:#e5e7eb;border-collapse:collapse;">
          ${
            params.tabletCode
              ? `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;vertical-align:top;">Código tablet</td><td><strong style="font-size:1.1em;letter-spacing:0.06em;">${escapeHtml(params.tabletCode)}</strong><br/><span style="font-size:12px;color:#9ca3af;">En tablet: abrir ficha con su ID de trabajador (asignado por HydroNet) y este código.</span></td></tr>`
              : ""
          }
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Establecimiento</td><td>${escapeHtml(params.restaurantName)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Servicio</td><td>${escapeHtml(params.serviceLabel)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Fecha programada</td><td>${escapeHtml(when)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">Dirección</td><td>${escapeHtml(params.addressLine)}</td></tr>
          ${extraRows.join("")}
        </table>
        <p style="margin:20px 0 0;font-size:14px;color:#9ca3af;">${escapeHtml(DEPOSIT_LEGAL_ES)}</p>
        <p style="margin:16px 0 0;font-size:14px;">HydroNet Plumbing · <a href="mailto:${CONTACT}" style="color:#0EA5E9;">${CONTACT}</a></p>
      </div>
    `,
  });
}

export async function sendMembershipConfirmation(params: {
  to: string;
  restaurantName: string;
  periodEnd: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping membership email");
    return;
  }

  const end = new Date(params.periodEnd).toLocaleString("es-US", {
    timeZone: "America/Chicago",
    dateStyle: "long",
  });

  await resend.emails.send({
    from: `HydroNet Plumbing <${CONTACT}>`,
    to: params.to,
    subject: `Bienvenido a HydroNet Plumbing Gold — ${params.restaurantName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#1F2937;color:#e5e7eb;padding:24px;">
        ${emailLogoHtml()}
        <h1 style="color:#0EA5E9;margin:0 0 16px;font-size:1.25rem;">Membresía activa</h1>
        <p style="margin:0 0 12px;">Su plan <strong>HydroNet Gold</strong> está confirmado. Incluye 3 visitas de mantenimiento preventivo (lunes a viernes) por ciclo anual.</p>
        <p style="margin:0 0 12px;">Próxima renovación estimada: <strong>${escapeHtml(end)}</strong> (zona horaria Tennessee).</p>
        <p style="margin:16px 0 0;font-size:14px;color:#9ca3af;">La membresía se factura solo como su plan de suscripción; no aplica el Dispatch fee de $195 de las citas sueltas (no Gold).</p>
        <p style="margin:16px 0 0;font-size:14px;">HydroNet Plumbing · <a href="mailto:${CONTACT}" style="color:#0EA5E9;">${CONTACT}</a></p>
      </div>
    `,
  });
}

export async function sendServicioReportEmail(params: {
  to: string;
  restaurantName: string;
  pdfBuffer: Buffer;
  amountDue: number;
  invoiceSubtotal: number;
  depositCredit: number;
  language: ServicioLanguage;
  /** Misma referencia que en el PDF, si el técnico la indicó. */
  bookingReference?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const c = servicioReportCopy(params.language);
  const legal = c.depositLegal;
  const subject = c.emailSubject(params.restaurantName);
  const filenamePrefix =
    params.language === "en" ? "HydroNet-OnSite" : "HydroNet-Servicio";
  const filename = `${filenamePrefix}-${params.restaurantName.replace(/[^\w\-]+/g, "_").slice(0, 40)}-${Date.now()}.pdf`;

  const { data, error } = await resend.emails.send({
    from: `HydroNet Plumbing <${CONTACT}>`,
    to: params.to,
    subject,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#1F2937;color:#e5e7eb;padding:24px;">
        ${emailLogoHtml()}
        <p style="margin:0 0 12px;">${escapeHtml(c.emailIntro)}</p>
        <table style="color:#e5e7eb;border-collapse:collapse;margin-top:16px;">
          ${
            params.bookingReference?.trim()
              ? `<tr><td style="padding:6px 12px 6px 0;color:#9ca3af;vertical-align:top;">${escapeHtml(c.pdfBookingRef)}</td><td><code style="font-size:0.95em;word-break:break-all;">${escapeHtml(params.bookingReference.trim())}</code></td></tr>`
              : ""
          }
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">${escapeHtml(c.emailRowSubtotal)}</td><td>$${params.invoiceSubtotal.toFixed(2)} USD</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;">${escapeHtml(c.emailRowDeposit)}</td><td>-$${params.depositCredit.toFixed(2)} USD</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#9ca3af;"><strong>${escapeHtml(c.emailRowTotal)}</strong></td><td><strong>$${params.amountDue.toFixed(2)} USD</strong></td></tr>
        </table>
        <p style="margin:20px 0 0;font-size:14px;color:#9ca3af;">${escapeHtml(legal)}</p>
        <p style="margin:16px 0 0;font-size:14px;">${escapeHtml(c.emailFooter)} · <a href="mailto:${CONTACT}" style="color:#0EA5E9;">${CONTACT}</a></p>
      </div>
    `,
    attachments: [
      {
        filename,
        content: params.pdfBuffer,
      },
    ],
  });

  if (error) {
    const msg =
      typeof (error as { message?: string }).message === "string"
        ? (error as { message: string }).message
        : String(error);
    console.error("[servicio-email] Resend rejected send", {
      to: params.to,
      subject,
      error: msg,
    });
    throw new Error(`Servicio report email was not sent: ${msg}`);
  }

  console.log("[servicio-email] Resend accepted", {
    to: params.to,
    resendId: data?.id ?? null,
    subject,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bloque de imagen del logo para HTML de correo (URL absoluta). */
function emailLogoHtml(): string {
  const src = escapeHtml(getOfficialLogoAbsoluteUrl());
  return `<div style="margin:0 0 22px;"><img src="${src}" alt="HydroNet Plumbing" width="280" style="max-width:100%;height:auto;display:block;border:0;" /></div>`;
}
