/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance MVP deployment. On serverless platforms the
 * store resets per instance; swap for a shared store (e.g. Redis/Upstash) if
 * abuse becomes a concern. See README → Security.
 */

type Bucket = number[];

const store = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  if (store.size > MAX_BUCKETS) {
    // Simple opportunistic cleanup to bound memory.
    for (const [k, hits] of store) {
      if (hits.every((t) => now - t > windowMs)) store.delete(k);
    }
  }
  const bucket = (store.get(key) ?? []).filter((t) => now - t <= windowMs);
  if (bucket.length >= limit) {
    const oldest = bucket[0];
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  bucket.push(now);
  store.set(key, bucket);
  return { ok: true, retryAfterSeconds: 0 };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
