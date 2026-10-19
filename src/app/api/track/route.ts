import { clientIp } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { trackOrdersByMobile } from "@/lib/orders";

/**
 * POST /api/track — public order tracking by mobile number.
 *
 * Only the phone number provided by the customer is used to locate orders, and
 * the response omits address/email/GSTIN (see trackOrdersByMobile). Rate
 * limited to slow down number enumeration.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`track:${clientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const mobile =
    body && typeof body === "object" && typeof (body as { mobile?: unknown }).mobile === "string"
      ? (body as { mobile: string }).mobile
      : "";

  if (!/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, "").slice(-10))) {
    return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 422 });
  }

  try {
    const orders = await trackOrdersByMobile(mobile);
    return Response.json({ ok: true, orders });
  } catch (err) {
    console.error("[api/track] lookup failed:", err);
    return Response.json({ error: "Could not look up orders right now." }, { status: 500 });
  }
}
