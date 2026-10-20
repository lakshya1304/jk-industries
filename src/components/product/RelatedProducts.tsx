import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/product/ProductCard";
import { StaggeredGrid } from "@/components/ui/StaggeredGrid";

/**
 * Related products on a product detail page.
 *
 * Two purposes. For visitors it is a route onward from a single product; for
 * search it creates horizontal internal links between product pages, so link
 * equity flows to every product rather than being funnelled only through the
 * catalogue. Product pages with no inbound internal links are the classic
 * cause of "Discovered – currently not indexed" in Search Console.
 *
 * Selection is deterministic (same catalogue order, offset past the current
 * product) rather than random, so the rendered HTML is stable and crawlable.
 */
export async function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  const [all, settings] = await Promise.all([getActiveProducts(), getSettings()]);

  const others = all.filter((p) => p.slug !== currentSlug);
  if (others.length === 0) return null;

  // Start just after the current product so adjacent catalogue items surface,
  // wrapping around at the end.
  const index = all.findIndex((p) => p.slug === currentSlug);
  const start = index >= 0 ? index + 1 : 0;
  const rotated = [...all.slice(start), ...all.slice(0, start)];
  const related = rotated.filter((p) => p.slug !== currentSlug).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mt-20 border-t border-navy-900/8 pt-14" aria-labelledby="related-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="related-heading"
            className="text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl"
          >
            More from the {settings.brandName} range
          </h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            Other products in the catalogue, available for retail and wholesale supply.
          </p>
        </div>
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
        >
          View all products
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <StaggeredGrid className="mt-8">
        {related.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            options={{
              showMRP: settings.showMRP,
              showWholesale: settings.showWholesalePrice,
              showStockBadge: settings.showStockBadge,
              whatsappNumber: settings.whatsappNumber,
              brandName: settings.brandName,
            }}
          />
        ))}
      </StaggeredGrid>
    </section>
  );
}
