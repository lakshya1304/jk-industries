import { prisma } from "@/lib/prisma";

/**
 * GET /api/images/[id] — serve an image stored in the database.
 *
 * This is the read side of the database upload path in
 * `/api/admin/upload`. Product photos are public by design (they appear on the
 * storefront, in Open Graph tags and in structured data), so this route is
 * unauthenticated — requiring a session would make the images invisible to
 * search engines and social crawlers.
 *
 * Why a route handler rather than a stored data URI: caps the URL length,
 * keeps the bytes out of the HTML payload, and lets the response carry a real
 * `Content-Type` and cache header.
 *
 * Caching: the id is a `cuid()` generated once at upload and never reused, so
 * the response is immutable — a replaced image is a different URL. That makes
 * `immutable` safe and lets the CDN answer repeat requests without touching
 * the database.
 */

/** Only ids this app generates: Prisma cuids are lowercase alphanumeric. */
const ID_PATTERN = /^[a-z0-9]{16,40}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Reject anything that is not plausibly a cuid before touching the database.
  // This keeps stray scans from turning into queries.
  if (!ID_PATTERN.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  let row: { data: Uint8Array; mimeType: string; size: number } | null = null;
  try {
    row = await prisma.storedImage.findUnique({
      where: { id },
      select: { data: true, mimeType: true, size: true },
    });
  } catch (err) {
    console.error("[api/images] lookup failed:", err);
    return new Response("Image unavailable", { status: 500 });
  }

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  // Wrap in a Blob: it is an accepted `BodyInit` and makes the binary nature of
  // the payload explicit, so the runtime streams bytes rather than text.
  const bytes = new Blob([new Uint8Array(row.data)], { type: row.mimeType });

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": row.mimeType,
      // Public + immutable: the URL changes whenever the image does.
      "Cache-Control": "public, max-age=31536000, immutable",
      // Uploads are validated by MIME type, so never let a browser sniff this
      // response into something executable.
      "X-Content-Type-Options": "nosniff",
      // Images are inline content, not a page someone navigates to.
      "Content-Disposition": "inline",
    },
  });
}
