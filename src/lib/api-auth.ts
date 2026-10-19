import "server-only";
import { getSession, type AdminSession } from "@/lib/auth";

/** Returns the admin session for API routes, or null when unauthenticated. */
export async function getAdminApiSession(): Promise<AdminSession | null> {
  return getSession();
}

export function unauthorizedResponse() {
  return Response.json({ error: "You must be signed in as an admin." }, { status: 401 });
}

/** Parse a JSON request body, returning null when it is not valid JSON. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
