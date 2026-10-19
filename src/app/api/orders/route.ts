import { clientIp } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { orderRequestSchema } from "@/lib/validation";
import { createOrderRequest, OrderError } from "@/lib/orders";

/**
 * POST /api/orders — public order-request endpoint.
 *
 * Security: rate-limited per IP, honeypot field, strict server-side validation.
 * All prices, availability and minimum quantities are re-checked against the
 * database inside createOrderRequest; nothing from the client is trusted.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`orders:${clientIp(request.headers)}`, {
    limit: 8,
    windowMs: 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (body && typeof body === "object" && typeof (body as { website?: unknown }).website === "string") {
    if ((body as { website: string }).website.trim() !== "") {
      return Response.json({ error: "Your submission could not be processed." }, { status: 400 });
    }
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      {
        error: first?.message ?? "Please check the form and try again.",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 }
    );
  }

  try {
    const order = await createOrderRequest(parsed.data);
    return Response.json(
      { ok: true, reference: order.reference, duplicate: order.duplicate ?? false },
      { status: order.duplicate ? 200 : 201 }
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/orders] failed to create order request:", err);
    return Response.json(
      {
        error:
          "We could not save your order request right now. Please try again, or contact us on WhatsApp.",
      },
      { status: 500 }
    );
  }
}
