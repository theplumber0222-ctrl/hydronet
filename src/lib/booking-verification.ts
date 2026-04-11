/** Límites de metadata Stripe (valor máx. ~500 caracteres por clave). */
const STRIPE_META_MAX = 480;

export type BookingVerificationInput = {
  workDescription: string;
  billingContactName: string;
  invoiceEmail: string;
  siteContactName: string;
  siteContactPhone: string;
  spendLimitCents: number | null;
  approvalOverLimitNote: string | null;
};

export function truncateMeta(s: string, max = STRIPE_META_MAX): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Campos para Stripe Checkout `metadata` (strings). */
export function verificationToStripeMetadata(
  v: BookingVerificationInput,
): Record<string, string> {
  const out: Record<string, string> = {
    job_description: truncateMeta(v.workDescription.trim()),
    billing_contact_name: truncateMeta(v.billingContactName.trim(), 200),
    invoice_email: v.invoiceEmail.trim().slice(0, 320),
    site_contact_name: truncateMeta(v.siteContactName.trim(), 200),
    site_contact_phone: v.siteContactPhone.trim().slice(0, 32),
  };
  if (v.spendLimitCents != null && v.spendLimitCents > 0) {
    out.spend_limit_cents = String(v.spendLimitCents);
  } else {
    out.spend_limit_cents = "";
  }
  if (v.approvalOverLimitNote?.trim()) {
    out.approval_over_limit_note = truncateMeta(
      v.approvalOverLimitNote.trim(),
    );
  } else {
    out.approval_over_limit_note = "";
  }
  return out;
}

export function parseSpendLimitCentsFromMetadata(
  raw: string | undefined,
): number | null {
  if (raw == null || raw === "") return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
