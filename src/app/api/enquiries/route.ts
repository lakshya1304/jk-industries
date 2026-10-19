import { clientIp } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { enquirySchema } from "@/lib/validation";
import { createEnquiry } from "@/lib/enquiries";

/**
 * POST /api/enquiries — public enquiry endpoint (contact, product, dealer, wholesale).
 * Rate-limited per IP and validated server-side before it touches the database.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`enquiries:${clientIp(request.headers)}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body && typeof body === "object" && typeof (body as { website?: unknown }).website === "string") {
    if ((body as { website: string }).website.trim() !== "") {
      return Response.json({ error: "Your submission could not be processed." }, { status: 400 });
    }
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message ?? "Please check the form and try again." },
      { status: 422 }
    );
  }

  try {
    await createEnquiry(parsed.data);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[api/enquiries] failed to save enquiry:", err);
    return Response.json(
      { error: "We could not save your enquiry right now. Please try again or WhatsApp us." },
      { status: 500 }
    );
  }
}
