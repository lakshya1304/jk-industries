import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format an amount in Indian Rupees. */
export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Parse the product images column (a JSON array stored as text). */
export function parseImages(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i === "string") : [];
  } catch {
    return [];
  }
}

/** Generate a human-friendly, unique-enough order reference: SC-261014-7K2F */
export function generateOrderReference(date = new Date()) {
  const y = String(date.getFullYear()).slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SC-${y}${m}${d}-${rand}`;
}

export function formatDate(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/** Best-effort client IP for rate limiting. */
export function clientIp(headersList: Headers): string {
  const fwd = headersList.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

/**
 * Build the "open in maps" link shown behind the footer address.
 *
 * When an explicit `mapUrl` is configured it is used as-is, so staff can pin an
 * exact point with a share link that a plain address search would not find.
 * Otherwise a Google Maps search is assembled from the structured address
 * fields.
 *
 * Returns `null` when there is nothing meaningful to search for, so the footer
 * can render plain text instead of a link that opens an empty search. The
 * seeded placeholder values ("Your City", "000000") are treated as missing
 * rather than searched for, since they would send visitors to a wrong place.
 */
export function mapsHref({
  mapUrl,
  addressLine,
  city,
  state,
  pincode,
}: {
  mapUrl?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): string | null {
  const explicit = mapUrl?.trim();
  if (explicit) return /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;

  const isPlaceholder = (v: string | undefined) =>
    !v || /your\s+city|your\s+state|^0+$|^industrial area$/i.test(v.trim());

  const parts = [addressLine, city, state, pincode]
    .map((p) => p?.trim() ?? "")
    .filter((p) => p.length > 0 && !isPlaceholder(p));

  // A bare pincode or city alone is not a useful pin.
  if (parts.length < 2) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}
