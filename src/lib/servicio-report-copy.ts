/**
 * Single source of truth for on-site service report language (admin/tablet flow).
 * All UI, PDF, email, and API user-facing strings for this flow.
 */
export type ServicioLanguage = "en" | "es";

export function isServicioLanguage(v: string | undefined): v is ServicioLanguage {
  return v === "en" || v === "es";
}

type Block = {
  /** Short label for language toggle */
  langLabel: string;
  navHome: string;
  /** Enlace a agenda del día (tablet). */
  navAgenda: string;
  /** Enlace a ficha de cita (tablet). */
  navJobCard: string;
  navEstimates: string;
  navHistory: string;
  navMode: string;
  pageTitle: string;
  pageSubtitle: string;
  adminKeyLabel: string;
  adminKeyHelp: string;
  establishmentLabel: string;
  establishmentHelp: string;
  clientEmailLabel: string;
  clientEmailHelp: string;
  technicianLabel: string;
  technicianHelp: string;
  serviceDateLabel: string;
  serviceDateHelp: string;
  checklistTitle: string;
  checklistHelp: string;
  checklistAirGap: string;
  checklistHandSink: string;
  checklistGreaseTrap: string;
  pass: string;
  fail: string;
  na: string;
  photosBefore: string;
  photosBeforeSub: string;
  photosAfter: string;
  photosAfterSub: string;
  notesLabel: string;
  notesHelp: string;
  billingTitle: string;
  billingSectionHelp: string;
  laborHoursLabel: string;
  hourlyRateReadonlyLabel: string;
  laborSubtotalReadonlyLabel: string;
  materialsSubtotalLabel: string;
  partsSubtotalLabel: string;
  otherChargesSubtotalLabel: string;
  aggregatedSubtotalLabel: string;
  depositRow: string;
  totalRow: string;
  totalRowHelp: string;
  invoicePreviewTitle: string;
  invoicePreviewHint: string;
  submitLoading: string;
  submitIdle: string;
  networkError: string;
  removePhotoAria: string;
  /** Deposit legal paragraph (same substance as public checkout copy) */
  depositLegal: string;
  /** PDF */
  pdfTitle: string;
  pdfEstablishment: string;
  /** Opcional: ID de reserva vinculada al informe */
  pdfBookingRef: string;
  pdfTechnician: string;
  pdfServiceDate: string;
  pdfChecklistTitle: string;
  pdfBillingTitle: string;
  pdfSubtotalLine: string;
  pdfDepositLine: string;
  pdfTotalLine: string;
  pdfNotes: string;
  pdfPhotosBefore: string;
  pdfPhotosAfter: string;
  pdfImageEmbedError: (i: number) => string;
  /** Email */
  emailSubject: (establishment: string) => string;
  emailIntro: string;
  emailRowSubtotal: string;
  emailRowDeposit: string;
  emailRowTotal: string;
  emailFooter: string;
  /** API errors */
  apiUnauthorized: string;
  apiInvalidForm: string;
  apiValidationFailed: string;
  apiImagesOnly: string;
  apiImageTooLarge: string;
  apiGenerateFailed: string;
  /** Balance card charge (separate from PDF/report) */
  chargeButton: string;
  chargeHelp: string;
  noBalanceToCharge: string;
  chargeMinStripe: string;
  chargeLoading: string;
  chargeError: string;
  paymentSuccessReturn: string;
  paymentCancelledReturn: string;
  apiChargeNoBalance: string;
  apiChargeMinAmount: string;
  apiChargeFailed: string;
  /** Borrador en el dispositivo (local) */
  clearDraftButton: string;
  clearDraftHelp: string;
  /** Cantidad bajo previsualizaciones (Antes/Después) */
  photoCountInline: (n: number) => string;
  /** Miniatura: HEIC/ Safari / blob */
  photoPreviewUnavailable: string;
  photoTypeLabel: string;
  photoIndexLabel: (i: number, total: number) => string;
  openPhotoPreviewAria: string;
  closePhotoPreview: string;
};

const EN: Block = {
  langLabel: "Language",
  navHome: "← Home",
  navAgenda: "Day schedule",
  navJobCard: "Job card",
  navEstimates: "Estimates",
  navHistory: "Client history",
  navMode: "Tablet",
  pageTitle: "On-site service report",
  pageSubtitle:
    "Record the visit, calculate the balance due, generate the PDF, and email it. Card payment is a separate step — not on this screen.",
  adminKeyLabel: "Technician key (if your account uses one)",
  adminKeyHelp: "Optional — must match ADMIN_SERVICIO_KEY on the server",
  establishmentLabel: "Home or business name",
  establishmentHelp: "As it should appear on the report",
  clientEmailLabel: "Client email",
  clientEmailHelp: "PDF will be sent here",
  technicianLabel: "Technician",
  technicianHelp: "Name on the report",
  serviceDateLabel: "Service date",
  serviceDateHelp: "Date of visit",
  checklistTitle: "Internal inspection checklist",
  checklistHelp: "Select one option per item",
  checklistAirGap: "Air gap verification (indirect drains)",
  checklistHandSink: "Hand sink functionality",
  checklistGreaseTrap: "Grease trap presence",
  pass: "Pass",
  fail: "Fail",
  na: "N/A",
  photosBefore: "Before",
  photosBeforeSub: "Photos before work",
  photosAfter: "After",
  photosAfterSub: "Photos after work",
  notesLabel: "Additional notes",
  notesHelp: "Optional details for the report",
  billingTitle: "Balance and breakdown",
  billingSectionHelp:
    "Labor total is hours × the current hourly rate (see below). Enter materials, parts, and other charges as separate line items. Card payment is not collected on this screen.",
  laborHoursLabel: "Labor hours",
  hourlyRateReadonlyLabel: "Hourly rate (USD)",
  laborSubtotalReadonlyLabel: "Labor total (USD)",
  materialsSubtotalLabel: "Materials (USD)",
  partsSubtotalLabel: "Parts (USD)",
  otherChargesSubtotalLabel: "Other charges (USD)",
  aggregatedSubtotalLabel: "Service subtotal (before credit)",
  depositRow: "Dispatch fee credit ($195)",
  totalRow: "Amount due",
  totalRowHelp:
    "After dispatch credit. Card payment is not collected on this screen.",
  invoicePreviewTitle: "PDF header preview",
  invoicePreviewHint:
    "Same logo and header layout as the PDF you send (print or save from the browser).",
  submitLoading: "Generating…",
  submitIdle: "Generate report & send",
  networkError: "Network or server error.",
  removePhotoAria: "Remove photo",
  depositLegal:
    "The $195 Dispatch fee for non-Gold visits is credited toward your service total. Hourly jobs use a minimum 1-hour charge at checkout. Subject to Tennessee commercial laws and our cancellation policy.",
  pdfTitle: "On-site service report",
  pdfEstablishment: "Establishment",
  pdfBookingRef: "Booking reference",
  pdfTechnician: "Technician",
  pdfServiceDate: "Service date",
  pdfChecklistTitle: "Internal inspection checklist",
  pdfBillingTitle: "Billing summary",
  pdfSubtotalLine: "Work subtotal:",
  pdfDepositLine: "Dispatch fee credit ($195):",
  pdfTotalLine: "Amount due:",
  pdfNotes: "Notes",
  pdfPhotosBefore: "Photos — Before",
  pdfPhotosAfter: "Photos — After",
  pdfImageEmbedError: (i) => `(Image ${i + 1} could not be embedded)`,
  emailSubject: (name) => `On-site service report — ${name}`,
  emailIntro:
    "Please find attached the professional PDF report for your on-site service, including the inspection checklist and photos.",
  emailRowSubtotal: "Subtotal",
  emailRowDeposit: "Dispatch fee credit ($195)",
  emailRowTotal: "Amount due",
  emailFooter: "HydroNet Plumbing",
  apiUnauthorized: "Unauthorized",
  apiInvalidForm: "Invalid form submission",
  apiValidationFailed: "Validation failed",
  apiImagesOnly: "Only image files are allowed.",
  apiImageTooLarge: "Each image must be under 8 MB.",
  apiGenerateFailed: "Could not generate or send the report",
  chargeButton: "Charge balance by card",
  chargeHelp: "Only the remaining balance after the booking credit will be charged.",
  noBalanceToCharge: "There is no remaining balance to charge.",
  chargeMinStripe: "The balance is below the $0.50 minimum for card payment. Enter a higher total or collect another way.",
  chargeLoading: "Starting checkout…",
  chargeError: "Could not start card checkout.",
  paymentSuccessReturn: "Return from card checkout — if payment was completed, Stripe will send a receipt to the client email when applicable.",
  paymentCancelledReturn: "Card checkout was cancelled. You can try again when ready.",
  apiChargeNoBalance: "No balance to charge",
  apiChargeMinAmount: "Amount is below the minimum for card payment ($0.50)",
  apiChargeFailed: "Could not create checkout session",
  clearDraftButton: "Clear saved draft",
  clearDraftHelp: "Removes this device’s saved form and photos. Does not affect sent PDFs or Stripe.",
  photoCountInline: (n) => (n === 1 ? "1 photo" : `${n} photos`),
  photoPreviewUnavailable: "No thumbnail — file is still included for the report and send.",
  photoTypeLabel: "Type",
  photoIndexLabel: (i, total) => `Photo ${i + 1} of ${total}`,
  openPhotoPreviewAria: "Open full-size photo preview",
  closePhotoPreview: "Close",
};

const ES: Block = {
  langLabel: "Idioma",
  navHome: "← Inicio",
  navAgenda: "Agenda del día",
  navJobCard: "Ficha de cita",
  navEstimates: "Estimados",
  navHistory: "Historial cliente",
  navMode: "Tablet",
  pageTitle: "Reporte de servicio en sitio",
  pageSubtitle:
    "Registre la visita, calcule el saldo pendiente, genere el PDF y envíelo por correo. El pago con tarjeta es aparte; no se cobra en esta pantalla.",
  adminKeyLabel: "Clave de técnico (si su cuenta la usa)",
  adminKeyHelp:
    "Opcional — debe coincidir con ADMIN_SERVICIO_KEY en el servidor",
  establishmentLabel: "Nombre de casa o negocio",
  establishmentHelp: "Como debe figurar en el informe",
  clientEmailLabel: "Correo del cliente",
  clientEmailHelp: "Aquí se enviará el PDF",
  technicianLabel: "Técnico",
  technicianHelp: "Nombre en el informe",
  serviceDateLabel: "Fecha de servicio",
  serviceDateHelp: "Fecha de la visita",
  checklistTitle: "Lista de verificación interna",
  checklistHelp: "Seleccione una opción por ítem",
  checklistAirGap: "Verificación de espacio de aire (drenajes indirectos)",
  checklistHandSink: "Funcionalidad de lavamanos",
  checklistGreaseTrap: "Presencia de trampa de grasa",
  pass: "Cumple",
  fail: "No cumple",
  na: "N/A",
  photosBefore: "Antes",
  photosBeforeSub: "Fotos previas al trabajo",
  photosAfter: "Después",
  photosAfterSub: "Fotos posteriores al trabajo",
  notesLabel: "Notas adicionales",
  notesHelp: "Detalle opcional para el informe",
  billingTitle: "Saldo y desglose",
  billingSectionHelp:
    "El total de mano de obra es horas × la tarifa por hora vigente (vea abajo). Los materiales, partes y otros cargos se ingresan por separado. El cobro con tarjeta no se hace en esta pantalla.",
  laborHoursLabel: "Horas de mano de obra",
  hourlyRateReadonlyLabel: "Tarifa por hora (USD)",
  laborSubtotalReadonlyLabel: "Total mano de obra (USD)",
  materialsSubtotalLabel: "Materiales (USD)",
  partsSubtotalLabel: "Partes / repuestos (USD)",
  otherChargesSubtotalLabel: "Otros cargos (USD)",
  aggregatedSubtotalLabel: "Subtotal de servicio (antes del crédito)",
  depositRow: "Crédito Dispatch fee ($195)",
  totalRow: "Total a pagar",
  totalRowHelp:
    "Tras el crédito dispatch. El cobro con tarjeta no se realiza en esta pantalla.",
  invoicePreviewTitle: "Vista previa del encabezado del PDF",
  invoicePreviewHint:
    "Mismo logo y encabezado que el PDF que envía (imprimir o guardar desde el navegador).",
  submitLoading: "Generando…",
  submitIdle: "Generar informe y enviar",
  networkError: "Error de red o del servidor.",
  removePhotoAria: "Quitar foto",
  depositLegal:
    "El Dispatch fee de $195 en visitas no Gold se acredita al total del servicio. Trabajo por hora: mínimo 1 hora en checkout. Sujeto a leyes comerciales de Tennessee y la política de cancelación.",
  pdfTitle: "Reporte de servicio en sitio",
  pdfEstablishment: "Establecimiento",
  pdfBookingRef: "Referencia de reserva",
  pdfTechnician: "Técnico",
  pdfServiceDate: "Fecha de servicio",
  pdfChecklistTitle: "Lista de verificación interna",
  pdfBillingTitle: "Resumen de cobro",
  pdfSubtotalLine: "Subtotal del trabajo:",
  pdfDepositLine: "Crédito Dispatch fee ($195):",
  pdfTotalLine: "Total a cobrar:",
  pdfNotes: "Notas",
  pdfPhotosBefore: "Fotografías — Antes",
  pdfPhotosAfter: "Fotografías — Después",
  pdfImageEmbedError: (i) => `(La imagen ${i + 1} no pudo incrustarse)`,
  emailSubject: (name) => `Reporte de servicio en sitio — ${name}`,
  emailIntro:
    "Adjunto encontrará el informe profesional en PDF del servicio en sitio, con la lista de verificación y las fotografías.",
  emailRowSubtotal: "Subtotal",
  emailRowDeposit: "Crédito Dispatch fee ($195)",
  emailRowTotal: "Total a cobrar",
  emailFooter: "HydroNet Plumbing",
  apiUnauthorized: "No autorizado",
  apiInvalidForm: "Formulario inválido",
  apiValidationFailed: "Validación fallida",
  apiImagesOnly: "Solo se permiten imágenes.",
  apiImageTooLarge: "Cada imagen debe ser menor a 8 MB.",
  apiGenerateFailed: "Error al generar o enviar",
  chargeButton: "Cobrar saldo con tarjeta",
  chargeHelp: "Se cobrará solo el saldo pendiente después del crédito de reserva.",
  noBalanceToCharge: "No hay saldo pendiente por cobrar.",
  chargeMinStripe: "El saldo es inferior al mínimo para pago con tarjeta (US$0,50). Aumente el total o use otro método.",
  chargeLoading: "Abriendo pago con tarjeta…",
  chargeError: "No se pudo abrir el pago con tarjeta.",
  paymentSuccessReturn: "Vuelta desde el pago con tarjeta — si se completó, Stripe puede enviar el recibo al correo del cliente si aplica.",
  paymentCancelledReturn: "Se canceló el pago con tarjeta. Puede intentar de nuevo cuando quiera.",
  apiChargeNoBalance: "No hay saldo que cobrar",
  apiChargeMinAmount: "El importe no alcanza el mínimo para pago con tarjeta (US$0,50)",
  apiChargeFailed: "No se pudo crear la sesión de pago",
  clearDraftButton: "Borrar borrador guardado",
  clearDraftHelp:
    "Quita de este dispositivo el formulario y las fotos guardadas. No afecta PDFs ya enviados ni pagos en Stripe.",
  photoCountInline: (n) => (n === 1 ? "1 foto" : `${n} fotos`),
  photoPreviewUnavailable:
    "Sin miniatura — el archivo sigue incluido para el informe y el envío.",
  photoTypeLabel: "Tipo",
  photoIndexLabel: (i, total) => `Foto ${i + 1} de ${total}`,
  openPhotoPreviewAria: "Abrir previsualización a tamaño completo",
  closePhotoPreview: "Cerrar",
};

export function servicioReportCopy(lang: ServicioLanguage): Block {
  return lang === "en" ? EN : ES;
}

export function buildServicioSuccessMessage(
  lang: ServicioLanguage,
  clientEmail: string,
  amountDue: string,
): string {
  if (lang === "en") {
    return `Done. PDF sent to ${clientEmail}. Balance due: $${amountDue} USD (after $195 dispatch credit). Card payment is a separate step.`;
  }
  return `Listo. PDF enviado a ${clientEmail}. Saldo pendiente: $${amountDue} USD (tras crédito dispatch $195). El cobro con tarjeta es un paso aparte.`;
}

function statusWord(
  lang: ServicioLanguage,
  st: "pass" | "fail" | "na",
): string {
  const c = servicioReportCopy(lang);
  if (st === "pass") return c.pass;
  if (st === "fail") return c.fail;
  return c.na;
}

export { statusWord };
