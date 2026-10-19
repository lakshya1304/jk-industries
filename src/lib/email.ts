/**
 * Optional transactional email notifications.
 *
 * Works with the Resend HTTP API (resend.com) or any compatible endpoint via
 * EMAIL_API_URL. If EMAIL_API_KEY or EMAIL_TO is not configured, notifications
 * are skipped silently so the MVP works without an email provider.
 *
 * Email failure NEVER fails an order — errors are logged only.
 */

type OrderEmailData = {
  reference: string;
  customerName: string;
  businessName: string | null;
  mobile: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: { name: string; packLabel: string; quantity: number; lineTotal: number }[];
  subtotal: number;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendOrderNotificationEmail(data: OrderEmailData): Promise<boolean> {
  const apiKey = process.env.EMAIL_API_KEY;
  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM || "orders@supercleaner.in";
  const apiUrl = process.env.EMAIL_API_URL || "https://api.resend.com";
  if (!apiKey || !to) return false;

  const rows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${esc(i.name)}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${esc(i.packLabel)}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right">₹${i.lineTotal.toLocaleString("en-IN")}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F3A">
    <h2 style="margin:0 0 4px">New order request — ${esc(data.reference)}</h2>
    <p style="margin:0 0 16px;color:#475569">A new order request has been submitted on the website.</p>
    <table style="border-collapse:collapse;width:100%;max-width:560px">
      <tr><td style="padding:4px 0;color:#64748B">Customer</td><td style="padding:4px 0">${esc(data.customerName)}${data.businessName ? ` (${esc(data.businessName)})` : ""}</td></tr>
      <tr><td style="padding:4px 0;color:#64748B">Mobile</td><td style="padding:4px 0">${esc(data.mobile)}</td></tr>
      ${data.email ? `<tr><td style="padding:4px 0;color:#64748B">Email</td><td style="padding:4px 0">${esc(data.email)}</td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#64748B">Address</td><td style="padding:4px 0">${esc(data.address)}, ${esc(data.city)}, ${esc(data.state)} — ${esc(data.pincode)}</td></tr>
    </table>
    <h3 style="margin:20px 0 8px">Items</h3>
    <table style="border-collapse:collapse;width:100%;max-width:560px">
      <tr><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #0B1F3A">Product</th><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #0B1F3A">Pack</th><th style="padding:6px 10px;text-align:center;border-bottom:2px solid #0B1F3A">Qty</th><th style="padding:6px 10px;text-align:right;border-bottom:2px solid #0B1F3A">Est. total</th></tr>
      ${rows}
      <tr><td colspan="3" style="padding:8px 10px;text-align:right;font-weight:bold">Subtotal (estimate)</td><td style="padding:8px 10px;text-align:right;font-weight:bold">₹${data.subtotal.toLocaleString("en-IN")}</td></tr>
    </table>
    <p style="color:#64748B;margin-top:20px">Open the admin dashboard to confirm pricing, stock and delivery terms.</p>
  </div>`;

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Order request ${data.reference} — ${data.customerName}`,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] provider responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] failed to send order notification:", err);
    return false;
  }
}
