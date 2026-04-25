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
  subtotalLabel: string;
  subtotalHelp: string;
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
};

const EN: Block = {
  langLabel: "Language",
  navHome: "← Home",
  navAgenda: "Day schedule",
  navJobCard: "Job card",
  navEstimates: "Estimates",
  navHistory: "Client history",
  navMode: "Tablet",
  pageTitle: "On-site service",
  pageSubtitle: "Inspection and billing report",
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
  billingTitle: "Billing",
  subtotalLabel: "Work subtotal (USD)",
  subtotalHelp: "Before $195 Dispatch fee credit",
  depositRow: "Dispatch fee credit ($195)",
  totalRow: "Amount due",
  totalRowHelp: "After deposit credit",
  invoicePreviewTitle: "PDF header preview",
  invoicePreviewHint:
    "Same logo and header layout as the PDF you send (print or save from the browser).",
  submitLoading: "Generating…",
  submitIdle: "Generate report & send",
  networkError: "Network or server error.",
  removePhotoAria: "Remove photo",
  depositLegal:
    "The $195 Dispatch fee for non-Gold visits is credited toward your service total. Hourly jobs use a minimum 1-hour charge at checkout. Subject to Tennessee commercial laws and our cancellation policy.",
  pdfTitle: "On-Site Service Report",
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
};

const ES: Block = {
  langLabel: "Idioma",
  navHome: "← Inicio",
  navAgenda: "Agenda del día",
  navJobCard: "Ficha de cita",
  navEstimates: "Estimados",
  navHistory: "Historial cliente",
  navMode: "Tablet",
  pageTitle: "Servicio en sitio",
  pageSubtitle: "Informe de inspección y cobro",
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
  billingTitle: "Cobro",
  subtotalLabel: "Subtotal del trabajo (USD)",
  subtotalHelp: "Antes del crédito de Dispatch fee ($195)",
  depositRow: "Crédito Dispatch fee ($195)",
  totalRow: "Total a cobrar",
  totalRowHelp: "Tras crédito de reserva",
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
    return `Done. PDF sent to ${clientEmail}. Amount due: $${amountDue} USD (including the $195 Dispatch fee credit).`;
  }
  return `Listo. PDF enviado a ${clientEmail}. Total a cobrar: $${amountDue} USD (crédito Dispatch fee $195 aplicado).`;
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
