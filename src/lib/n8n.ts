import { createHmac } from "crypto";

export type N8nPayload = {
  Restaurant_Name: string;
  Address: string;
  Phone: string;
  Email: string;
  Service_Type: string;
  Stripe_ID: string;
  Scheduled_Date: string;
  Job_Description?: string;
  Billing_Contact?: string;
  Invoice_Email?: string;
  Site_Contact?: string;
  Site_Phone?: string;
  /** Monto en USD con decimales si aplica. */
  Spend_Limit_USD?: string;
  Approval_Over_Limit?: string;
  Tablet_Code?: string;
};

export async function postToN8n(payload: N8nPayload): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn("N8N_WEBHOOK_URL not set; skipping n8n webhook");
    return;
  }

  const secret = process.env.N8N_WEBHOOK_SECRET;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-HydroNet-Signature"] = sig;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n webhook failed: ${res.status} ${text}`);
  }
}
