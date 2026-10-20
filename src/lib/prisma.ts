import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client, shared across module evaluations.
 *
 * Two constraints pull in opposite directions and this file satisfies both:
 *
 * 1. Connection reuse. Creating a `PrismaClient` per module evaluation exhausts
 *    the database pool, so the instance is parked on `globalThis` and reused.
 *
 * 2. Cache boundary safety. `getSettings()` and the product readers run inside
 *    `"use cache"`. Next.js requires that a cached function only awaits work
 *    created within its own scope; awaiting a promise chained to a value pulled
 *    from module-scoped shared storage (which is exactly what `globalThis` is
 *    after a hot reload) fails with `next-request-in-use-cache`:
 *
 *      "A `use cache` function is awaiting a promise created outside it …
 *       a module-scoped value (often a top-level Map used to dedupe fetches)
 *       is most likely blocking it."
 *
 * The resolution is to export an accessor rather than a bound reference. A
 * cached module keeps whatever it imported, so a stale `import { prisma }`
 * survives a hot reload and points at the previous evaluation's client. Calling
 * `getPrisma()` at the moment of use re-reads the global, so every access
 * resolves against the live instance while the connection is still reused.
 *
 * `prisma` remains exported for the write paths, which run outside any cache
 * boundary and read it once at request time.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient();
}

/** The live client. Always resolves the current instance, never a stale one. */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/**
 * Direct client reference.
 *
 * Safe in production, where modules are evaluated once. In development the
 * binding can survive a hot reload and reference a superseded client, so any
 * code inside `"use cache"` must call `getPrisma()` instead — doing so reads the
 * global at call time and cannot go stale.
 */
export const prisma = getPrisma();
