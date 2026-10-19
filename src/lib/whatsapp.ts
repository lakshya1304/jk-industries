import type { CartItem, ProductDTO } from "@/lib/types";

/**
 * WhatsApp click-to-chat helpers.
 * Uses the official format: https://wa.me/<number>?text=<url-encoded message>
 * Messages are only PREPARED for the user to send — delivery is never claimed.
 */

/** Normalise an Indian business number to international format (91XXXXXXXXXX). */
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function waLink(number: string, message: string): string {
  const n = normalizeWhatsAppNumber(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function productEnquiryMessage(opts: {
  brandName: string;
  product: Pick<ProductDTO, "name" | "sku">;
  packLabel?: string;
  quantity?: number;
}): string {
  const lines = [
    `Hello ${opts.brandName},`,
    `I would like to enquire about:`,
    `• Product: ${opts.product.name}`,
    `• SKU: ${opts.product.sku}`,
  ];
  if (opts.packLabel) lines.push(`• Pack size: ${opts.packLabel}`);
  if (opts.quantity) lines.push(`• Quantity: ${opts.quantity}`);
  lines.push("", "Please share pricing and availability. Thank you.");
  return lines.join("\n");
}

export function cartEnquiryMessage(opts: {
  brandName: string;
  items: Pick<CartItem, "name" | "sku" | "packLabel" | "quantity">[];
  note?: string;
}): string {
  const lines = [
    `Hello ${opts.brandName},`,
    `I would like bulk pricing for the following:`,
    "",
    ...opts.items.map(
      (i, idx) => `${idx + 1}. ${i.name} (${i.sku}) — ${i.packLabel} × ${i.quantity}`
    ),
    "",
    "Please share your best price and availability. Thank you.",
  ];
  if (opts.note?.trim()) lines.splice(lines.length - 2, 0, `Note: ${opts.note.trim()}`, "");
  return lines.join("\n");
}

export function generalEnquiryMessage(brandName: string): string {
  return `Hello ${brandName}, I would like to know more about your products and dealership options.`;
}
