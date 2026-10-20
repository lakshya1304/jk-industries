import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "sc_admin_session";
const SESSION_HOURS = 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short. Set it in .env (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export type AdminSession = { email: string; name: string };

/** Create a signed, httpOnly session token. */
export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

/** Verify a session token; returns null when invalid or expired. */
export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  // `jwtVerify` checks the token's `exp` claim, which reads the current clock
  // and therefore cannot run during a prerender pass. Marking this as
  // request-time (the token is per-request anyway) keeps the prerenderer from
  // reaching `new Date()` and failing the build.
  await connection();
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

/** Read the admin session from the request cookies (server components/routes). */
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** For server components: redirect to login when unauthenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 60 * 60,
};
