import "server-only";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

/**
 * Customer notifications for order status changes.
 *
 * Channels (checked in order):
 *   1. WhatsApp Business Cloud API  — WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID
 *   2. Generic SMS webhook          — SMS_API_URL + SMS_API_KEY  (POST { to, message })
 *   3. Manual                       — nothing configured; the caller is given the
 *      prefilled wa.me link so the admin can send the same text in one click.
 *
 * A WhatsApp message can NEVER be sent to an arbitrary number without a
 * provider account: wa.me links open a chat that a human must send. Automatic
 * sending therefore requires the (free) Meta WhatsApp Business Cloud API
 * credentials or an SMS provider.
 *
 * Sending is best-effort: failures are returned to the caller and logged, and
 * must never fail the status update itself.
 */

export type NotificationChannel = "whatsapp" | "sms" | "none";

export type StatusNotification = {
  /** Which channel attempted (or would attempt) delivery. */
  channel: NotificationChannel;
  /** True only when a configured provider accepted the message. */
  ok: boolean;
  /** The exact message text — sent automatically, or to send manually. */
  message: string;
  /** Normalised international number the message belongs to (91XXXXXXXXXX). */
  to: string;
  /** Present only when a configured provider actually failed. */
  error?: string;
};

/** One neutral, factual sentence per status. No delivery guarantees are implied. */
const STATUS_SENTENCE: Record<string, (reference: string, brand: string) => string> = {
  pending: (ref, brand) => `We have received your order request ${ref} for ${brand}. It is pending confirmation.`,
  confirmed: (ref, brand) => `Your order request ${ref} for ${brand} has been accepted and confirmed.`,
  processing: (ref, brand) => `Your order request ${ref} for ${brand} is now being processed.`,
  shipped: (ref, brand) => `Your order request ${ref} for ${brand} has been dispatched.`,
  delivered: (ref, brand) => `Your order request ${ref} for ${brand} has been marked as delivered.`,
  cancelled: (ref, brand) => `Your order request ${ref} for ${brand} has been cancelled.`,
};

const NEXT_STEPS: Record<string, string[]> = {
  confirmed: ["Our team will confirm pricing, stock and delivery details with you shortly."],
  processing: ["We are preparing your order for dispatch."],
  shipped: ["Please keep the consignment ready to be received."],
  delivered: ["Thank you for ordering with us."],
  cancelled: ["Reply to this message or call us if you have any questions."],
};

/** Build the customer-facing status message (also used for the manual wa.me link). */
export function buildStatusMessage(opts: {
  brandName: string;
  customerName: string;
  reference: string;
  status: string;
}): string {
  const sentence =
    STATUS_SENTENCE[opts.status]?.(opts.reference, opts.brandName) ??
    `Your order request ${opts.reference} for ${opts.brandName} is now ${ORDER_STATUS_LABELS[opts.status] ?? opts.status}.`;

  const lines = [`Hi ${opts.customerName},`, "", sentence];
  const next = NEXT_STEPS[opts.status];
  if (next?.length) lines.push("", ...next);
  lines.push("", "Reply here or contact us on WhatsApp for any changes.");
  return lines.join("\n");
}

type ProviderResult = { skipped: true } | { ok: boolean; error?: string };

/** WhatsApp Business Cloud API (Meta Graph). Requires a business phone number ID. */
async function sendViaWhatsApp(to: string, body: string): Promise<ProviderResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { skipped: true };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return { ok: false, error: `WhatsApp API responded ${res.status}: ${detail}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `WhatsApp request failed: ${(err as Error)?.message ?? String(err)}` };
  }
}

/**
 * Generic SMS webhook. POSTs `{ to, message }` with
 * `Authorization: Bearer <SMS_API_KEY>` to SMS_API_URL — adjust this function
 * for your provider's payload (MSG91, Twilio, Textlocal…).
 */
async function sendViaSms(to: string, message: string): Promise<ProviderResult> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (!url || !key) return { skipped: true };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return { ok: false, error: `SMS API responded ${res.status}: ${detail}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `SMS request failed: ${(err as Error)?.message ?? String(err)}` };
  }
}

/**
 * Notify a customer that their order status changed.
 * Never throws — always resolves so the status update itself cannot fail.
 */
export async function sendStatusNotification(opts: {
  brandName: string;
  customerName: string;
  reference: string;
  mobile: string;
  status: string;
}): Promise<StatusNotification> {
  const to = normalizeWhatsAppNumber(opts.mobile);
  const message = buildStatusMessage({
    brandName: opts.brandName,
    customerName: opts.customerName,
    reference: opts.reference,
    status: opts.status,
  });

  try {
    const wa = await sendViaWhatsApp(to, message);
    if (!("skipped" in wa)) {
      if (!wa.ok) console.error("[notify] whatsapp failed:", wa.error);
      return { channel: "whatsapp", ok: wa.ok, message, to, error: wa.error };
    }

    const sms = await sendViaSms(to, message);
    if (!("skipped" in sms)) {
      if (!sms.ok) console.error("[notify] sms failed:", sms.error);
      return { channel: "sms", ok: sms.ok, message, to, error: sms.error };
    }

    // Nothing configured — hand the message back for one-click manual sending.
    return { channel: "none", ok: false, message, to };
  } catch (err) {
    return {
      channel: "none",
      ok: false,
      message,
      to,
      error: `Notification failed: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}

/** Prefilled wa.me link for sending the same text manually from the dashboard. */
export function manualWhatsAppLink(to: string, message: string): string {
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

/* -------------------------------------------------------------------------- */
/*  Admin (new-order) notifications                                            */
/* -------------------------------------------------------------------------- */

/** One order line, mirroring the email payload. */
export type AdminOrderItem = {
  name: string;
  packLabel: string;
  quantity: number;
  lineTotal: number;
};

export type AdminOrderData = {
  reference: string;
  customerName: string;
  businessName: string | null;
  mobile: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
  notes: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  itemCount: number;
};

/**
 * Build the new-order alert the admin receives on WhatsApp.
 *
 * Plain text with `*bold*` markers (WhatsApp renders those) and no markdown
 * tables, because WhatsApp does not support them. Every value the customer
 * supplied is included so the admin can act without opening the dashboard.
 */
export function buildAdminOrderMessage(order: AdminOrderData, brandName: string): string {
  const money = (n: number) =>
    `Rs.${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const lines: string[] = [
    `*NEW ORDER REQUEST*`,
    `*${order.reference}*`,
    "",
    "*Customer*",
    `Name: ${order.customerName}`,
  ];

  if (order.businessName) lines.push(`Business: ${order.businessName}`);
  lines.push(`Mobile: ${order.mobile}`);
  if (order.email) lines.push(`Email: ${order.email}`);
  if (order.gstin) lines.push(`GSTIN: ${order.gstin}`);

  lines.push(
    "",
    "*Delivery address*",
    order.address,
    `${order.city}, ${order.state} - ${order.pincode}`,
    "",
    `*Items (${order.itemCount} total)*`
  );

  for (const item of order.items) {
    lines.push(`${item.quantity} x ${item.name} (${item.packLabel}) - ${money(item.lineTotal)}`);
  }

  lines.push("", `*Estimated subtotal: ${money(order.subtotal)}*`);

  if (order.notes) lines.push("", "*Customer notes*", order.notes);

  lines.push("", `Requested from the ${brandName} website.`);

  return lines.join("\n");
}

export type AdminNotificationResult = {
  /** True only when a provider accepted the message. */
  ok: boolean;
  /** "whatsapp" when the Cloud API accepted it; "none" when nothing is configured. */
  channel: "whatsapp" | "none";
  /** The exact text, so the caller can offer a one-click manual send. */
  message: string;
  /** Normalised admin number the alert belongs to. */
  to: string;
  error?: string;
};

/**
 * Alert the admin that a new order request arrived.
 *
 * Sent to the shop's own WhatsApp number (`settings.whatsappNumber`), not the
 * customer's — so one order produces exactly one alert and the customer sees
 * nothing. Never throws: a provider outage must not fail the customer's order.
 *
 * Caveat worth knowing: the WhatsApp Cloud API only allows free-form business-
 * initiated messages inside a 24-hour service window. Outside it, Meta rejects
 * the send and the error is returned. `manualWhatsAppLink` still gives the admin
 * a one-click way to deliver the identical text, and an approved template can be
 * wired in later without changing callers.
 */
export async function sendAdminOrderNotification(opts: {
  brandName: string;
  adminWhatsappNumber: string;
  order: AdminOrderData;
}): Promise<AdminNotificationResult> {
  const to = normalizeWhatsAppNumber(opts.adminWhatsappNumber);
  const message = buildAdminOrderMessage(opts.order, opts.brandName);

  try {
    const wa = await sendViaWhatsApp(to, message);
    if ("skipped" in wa) {
      // Provider not configured — the caller can still send it manually.
      return { ok: false, channel: "none", message, to };
    }
    if (!wa.ok) console.error("[notify] admin whatsapp alert failed:", wa.error);
    return { ok: wa.ok, channel: "whatsapp", message, to, error: wa.error };
  } catch (err) {
    return {
      ok: false,
      channel: "none",
      message,
      to,
      error: `Admin notification failed: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}
