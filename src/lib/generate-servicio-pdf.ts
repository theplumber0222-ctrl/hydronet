import PDFDocument from "pdfkit";
import type { ChecklistStatus, ServicioReportPayload } from "@/lib/servicio-report-types";
import { readOfficialLogoPng } from "@/lib/official-logo-server";
import {
  servicioReportCopy,
  statusWord,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";

function addChecklistRow(
  doc: PDFKit.PDFDocument,
  title: string,
  st: ChecklistStatus,
  lang: ServicioLanguage,
) {
  doc.fontSize(11).fillColor("#0f172a").font("Helvetica-Bold").text(title);
  doc.moveDown(0.2);
  doc
    .fontSize(10)
    .fillColor("#0f172a")
    .font("Helvetica")
    .text(`  ${statusWord(lang, st)}`, { indent: 8 });
  doc.moveDown(0.6);
}

function addImagesSection(
  doc: PDFKit.PDFDocument,
  title: string,
  buffers: Buffer[],
  lang: ServicioLanguage,
) {
  if (buffers.length === 0) return;
  const c = servicioReportCopy(lang);
  doc.addPage();
  doc.fontSize(14).fillColor("#0ea5e9").font("Helvetica-Bold").text(title);
  doc.moveDown(0.8);

  const maxW = 480;
  const maxH = 280;
  for (let i = 0; i < buffers.length; i++) {
    try {
      doc.image(buffers[i], {
        fit: [maxW, maxH],
        align: "center",
      });
      doc.moveDown(0.5);
    } catch {
      doc
        .fontSize(9)
        .fillColor("#b91c1c")
        .text(c.pdfImageEmbedError(i));
    }
  }
}

export function generateServicioPdf(data: ServicioReportPayload): Promise<Buffer> {
  const lang = data.language;
  const c = servicioReportCopy(lang);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const localeTag = lang === "es" ? "es-US" : "en-US";
    const generated = new Date().toLocaleString(localeTag, {
      timeZone: "America/Chicago",
      dateStyle: "full",
      timeStyle: "short",
    });

    const margin = 48;
    const pageInnerW = doc.page.width - margin * 2;
    const logoBuf = readOfficialLogoPng();
    let yAfterHeader = margin;

    if (logoBuf) {
      try {
        const fitW = Math.min(672, pageInnerW);
        const fitH = 176;
        doc.image(logoBuf, margin, margin, { fit: [fitW, fitH] });
        yAfterHeader = margin + fitH + 24;
      } catch {
        yAfterHeader = margin;
      }
    }

    doc.y = yAfterHeader;
    doc.x = margin;

    doc.fontSize(20).fillColor("#0f172a").font("Helvetica-Bold");
    doc.text(c.pdfTitle, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(10).fillColor("#334155").font("Helvetica");
    doc.text(`${generated} (TN)`);
    doc.moveDown(0.8);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
    doc.text(c.pdfEstablishment);
    doc.font("Helvetica").text(data.restaurantName);
    doc.moveDown(0.5);

    if (data.bookingReference?.trim()) {
      doc.font("Helvetica-Bold").text(c.pdfBookingRef);
      doc.font("Helvetica").text(data.bookingReference.trim());
      doc.moveDown(0.5);
    }

    doc.font("Helvetica-Bold").text(c.pdfTechnician);
    doc.font("Helvetica").text(data.technicianName);
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").text(c.pdfServiceDate);
    doc.font("Helvetica").text(data.serviceDate);
    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#0ea5e9")
      .text(c.pdfChecklistTitle);
    doc.moveDown(0.5);

    addChecklistRow(doc, c.checklistAirGap, data.checklistAirGap, lang);
    addChecklistRow(doc, c.checklistHandSink, data.checklistHandSink, lang);
    addChecklistRow(doc, c.checklistGreaseTrap, data.checklistGreaseTrap, lang);

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#0ea5e9");
    doc.text(c.pdfBillingTitle);
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    // 1) Dispatch fee (monto de referencia = depositCredit, mismo crédito aplicado en §7; no se suma al subtotal de trabajo)
    doc.text(
      `${c.pdfDispatchFeeLine}  $${data.depositCredit.toFixed(2)} USD`,
    );
    doc.moveDown(0.4);
    // 2) Mano de obra: horas, tarifa, total (valores: laborHours, hourlyRateUsd, laborSubtotal)
    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor("#0f172a")
      .text(c.pdfManoDeObraHeader);
    doc.font("Helvetica").fontSize(10);
    doc.text(c.pdfLaborHoursLine(String(data.laborHours)));
    doc.text(
      `${c.pdfHourlyRateLine}  $${data.hourlyRateUsd.toFixed(2)} USD`,
    );
    doc.text(
      `${c.pdfLaborTotalLine}  $${data.laborSubtotal.toFixed(2)} USD`,
    );
    doc.moveDown(0.25);
    // 3–5) Materiales, partes, otros (materialsSubtotal, partsSubtotal, otherChargesSubtotal)
    doc.text(
      `${c.pdfMaterialsLine}  $${data.materialsSubtotal.toFixed(2)} USD`,
    );
    doc.text(`${c.pdfPartsLine}  $${data.partsSubtotal.toFixed(2)} USD`);
    doc.text(
      `${c.pdfOtherLine}  $${data.otherChargesSubtotal.toFixed(2)} USD`,
    );
    doc.moveDown(0.25);
    // 6) Subtotal de servicio = invoiceSubtotal (labor+mat+partes+otros; sin crédito aún)
    doc.font("Helvetica-Bold");
    doc.text(
      `${c.pdfServiceSubtotalLine}  $${data.invoiceSubtotal.toFixed(2)} USD`,
    );
    // 7) Crédito dispatch = depositCredit (se resta una sola vez)
    doc.font("Helvetica");
    doc.text(
      `${c.pdfDepositLine}  -$${data.depositCredit.toFixed(2)} USD`,
    );
    // 8) Total a pagar = amountDue (0 si el saldo quedó en cero; si card_paid, monto que correspondía al cobro)
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(
      `${c.pdfTotalLine}  $${data.amountDue.toFixed(2)} USD`,
    );
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(
      data.paymentStatus === "card_paid"
        ? c.pdfPaymentStatusPaid
        : c.pdfPaymentStatusNoDue,
    );
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(8).fillColor("#64748b");
    doc.text(c.depositLegal, { width: 500 });

    if (data.notes.trim()) {
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
      doc.text(c.pdfNotes);
      doc.font("Helvetica").fontSize(10).text(data.notes, { width: 500 });
    }

    addImagesSection(doc, c.pdfPhotosBefore, data.photosBefore, lang);
    addImagesSection(doc, c.pdfPhotosAfter, data.photosAfter, lang);

    doc.end();
  });
}
