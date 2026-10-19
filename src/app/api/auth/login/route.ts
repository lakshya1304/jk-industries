import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

/**
 * POST /api/auth/login — admin sign-in.
 * Rate-limited per IP; the response never reveals whether the email exists.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`login:${clientIp(request.headers)}`, {
    limit: 8,
    windowMs: 5 * 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email and password." },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const invalid = Response.json({ error: "Incorrect email or password." }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return invalid;

  const passwordOk = await compare(parsed.data.password, admin.passwordHash);
  if (!passwordOk) return invalid;

  const token = await createSessionToken({ email: admin.email, name: admin.name });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, name: admin.name });
}
