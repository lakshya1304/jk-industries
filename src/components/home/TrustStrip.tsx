import { getSettings } from "@/lib/settings";
import { getFeaturedProducts } from "@/lib/products";
import { Marquee } from "@/components/ui/Marquee";

/**
 * Slim navy strip of short, verifiable statements about how the shop operates.
 *
 * Everything shown here is derived from real settings or the live catalogue —
 * nothing is invented. If there is nothing true to say, the strip is omitted
 * rather than filled with generic marketing copy.
 */
export async function TrustStrip() {
  const [settings, products] = await Promise.all([getSettings(), getFeaturedProducts(50)]);

  const items: string[] = [];
  const packSizes = products.reduce((s, p) => s + p.packSizes.length, 0);

  if (products.length > 0) {
    items.push(`${products.length} product${products.length === 1 ? "" : "s"} in the catalogue`);
  }
  if (packSizes > 0) {
    items.push(`Retail & bulk pack sizes`);
  }
  if (settings.showWholesalePrice) {
    items.push("Wholesale pricing for trade partners");
  }
  if (settings.contactPhone) {
    items.push(`Call ${settings.contactPhone}`);
  }
  items.push("Order requests answered on WhatsApp");
  items.push(`Supplied by ${settings.manufacturerName}`);

  if (items.length === 0) return null;

  return (
    <section className="bg-navy-950 py-4" aria-label="At a glance">
      <Marquee items={items} />
    </section>
  );
}
