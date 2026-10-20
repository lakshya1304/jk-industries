import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductBySlug, getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { brandTitle, breadcrumbSchema, productSchema } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

/**
 * Builds the search-facing description for a product.
 *
 * Product descriptions are authored in the admin dashboard and may be empty.
 * When they are, a factual description is assembled from real fields (name,
 * pack sizes, availability) rather than invented marketing claims — the pack
 * sizes are the single most useful thing a trade buyer searches for, and they
 * are unique per product, which avoids near-duplicate descriptions across the
 * catalogue.
 */
function buildDescription(
  product: { name: string; sku: string; description: string; packSizes: { label: string }[] },
  manufacturerName: string
): string {
  const authored = product.description.trim();
  if (authored) return authored;

  const packs = product.packSizes.map((p) => p.label).filter(Boolean);
  const packText = packs.length
    ? `Available in ${packs.slice(0, 4).join(", ")}${packs.length > 4 ? " and more" : ""}.`
    : "";
  return `${product.name} (SKU ${product.sku}) from ${manufacturerName}. ${packText} Enquire for retail, wholesale and bulk pricing.`.trim();
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: true } };
  }

  const description = buildDescription(product, settings.manufacturerName).slice(0, 300);
  const path = `/products/${product.slug}`;
  const packs = product.packSizes.map((p) => p.label).filter(Boolean);

  return {
    // Includes the pack sizes, which is what buyers actually search, plus the
    // brand. The root layout appends "| Super Cleaner" via the title template.
    title: packs.length ? `${product.name} — ${packs.join(", ")}` : product.name,
    description,
    keywords: [
      product.name,
      `${product.name} price`,
      `${product.name} wholesale`,
      `${product.name} manufacturer`,
      product.sku,
      ...packs.map((p) => `${product.name} ${p}`),
    ],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${product.name} | ${brandTitle(settings)}`,
      description,
      url: path,
      /*
        The card image is deliberately NOT set here.

        A product photo is often low-resolution, or (as in the current data) an
        external thumbnail, which makes a poor 1200×630 card and renders
        inconsistently between products. Setting `images` here would also
        override the colocated `opengraph-image.tsx`, so cards would differ
        depending on whether a product happened to have a photo. Leaving it
        unset lets every product get the same generated card.
      */
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${brandTitle(settings)}`,
      description,
    },
  };
}

/**
 * Reading `params` at the page level ties the App Shell to a single URL, which
 * Next flags as "URL data outside of Suspense" and which makes navigation
 * non-instant. Both the structured data and the detail body therefore read
 * `params` inside their own `<Suspense>` boundary, keeping the shell shared.
 */
export default function ProductPage({ params }: { params: Params }) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductStructuredData params={params} />
      </Suspense>
      <div className="container-page pt-24 pb-20 md:pt-28">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailLoader params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function ProductStructuredData({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) return null;

  return (
    <JsonLd
      data={[
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "All Products", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ]),
        productSchema(product, settings),
      ]}
    />
  );
}

async function ProductDetailLoader({ params }: { params: Params }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}

/**
 * Pre-render every active product at build time.
 *
 * Product pages are the main organic entry points, so they are generated ahead
 * of the first visitor instead of on demand — faster first response and no
 * cold-render cost. Products added later in the admin dashboard are still
 * served on demand and cached, without needing a rebuild.
 */
export async function generateStaticParams() {
  try {
    const products = await getActiveProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    // A database hiccup during a build must not fail the deployment; pages
    // simply render on demand.
    return [];
  }
}
