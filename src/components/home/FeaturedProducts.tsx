import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/product/ProductCard";
import { StaggeredGrid } from "@/components/ui/StaggeredGrid";
import { Reveal } from "@/components/ui/Reveal";

export async function FeaturedProducts() {
  const [products, settings] = await Promise.all([
    // Four, not eight. The homepage is an overview that points at the
    // catalogue; the full range lives on /products. Showing the whole range
    // here made the front page read as a second catalogue and diluted the
    // "view all products" path.
    getFeaturedProducts(4),
    getSettings(),
  ]);

  return (
    <section className="section bg-surface" aria-labelledby="featured-heading">
      <div className="container-page">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
              Featured products
            </p>
            <h2
              id="featured-heading"
              className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl"
            >
              Popular picks from the Super Cleaner range
            </h2>
            <p className="mt-3 max-w-xl text-ink-soft">
              Cleaning and automotive care essentials, available in retail and bulk pack sizes.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            View all products
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>

        {products.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-navy-900/15 bg-white p-10 text-center text-ink-mute">
            Products will appear here once they are added in the admin dashboard.
          </p>
        ) : (
          <StaggeredGrid className="mt-10">
            {products.map((product) => (
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
        )}
      </div>
    </section>
  );
}
