import { cacheLife, cacheTag, revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { parseImages } from "@/lib/utils";
import type { PackSizeDTO, ProductDTO } from "@/lib/types";

export const PRODUCTS_TAG = "products";

function toDTO(p: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  usage: string;
  images: string;
  minOrderQty: number;
  unitsPerCarton: number | null;
  availability: string;
  featured: boolean;
  showPrice: boolean;
  packSizes: { id: string; label: string; mrp: number; wholesalePrice: number | null; stock: number | null; active: boolean }[];
}): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    usage: p.usage,
    images: parseImages(p.images),
    minOrderQty: p.minOrderQty,
    unitsPerCarton: p.unitsPerCarton,
    availability: p.availability as ProductDTO["availability"],
    featured: p.featured,
    showPrice: p.showPrice,
    packSizes: p.packSizes
      .filter((ps) => ps.active)
      .map(
        (ps): PackSizeDTO => ({
          id: ps.id,
          label: ps.label,
          mrp: ps.mrp,
          wholesalePrice: ps.wholesalePrice,
          stock: ps.stock,
          active: ps.active,
        })
      ),
  };
}

const packOrder = { orderBy: { sortOrder: "asc" } as const };

/** All active products for the public catalogue, sorted by sortOrder then name. */
export async function getActiveProducts(): Promise<ProductDTO[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PRODUCTS_TAG);

  const rows = await prisma.product.findMany({
    where: { active: true },
    include: { packSizes: packOrder },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toDTO);
}

/** Featured products for the homepage showcase. */
export async function getFeaturedProducts(limit = 6): Promise<ProductDTO[]> {
  const all = await getActiveProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length >= 2 ? featured : all).slice(0, limit);
}

/** Single product by slug (active only). */
export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PRODUCTS_TAG);

  const row = await prisma.product.findFirst({
    where: { slug, active: true },
    include: { packSizes: packOrder },
  });
  return row ? toDTO(row) : null;
}

/** Invalidate cached product data after admin mutations. */
export function revalidateProducts() {
  revalidateTag(PRODUCTS_TAG, "max");
  // Product images / names also appear on prerendered pages (homepage featured
  // grid, catalogue, product detail). Refresh those paths so an image change is
  // visible immediately, not just after the cache window expires.
  revalidatePath("/", "page");
  revalidatePath("/products", "page");
  revalidatePath("/products/[slug]", "page");
}

/**
 * Photos for the homepage hero cluster.
 *
 * Uses the dedicated hero images configured in admin settings when present,
 * otherwise falls back to real product photos (never a placeholder graphic).
 */
export async function getHeroImages(): Promise<{ src: string; alt: string }[]> {
  const settings = await getSettings();
  if (settings.heroImages.length > 0) {
    return settings.heroImages.map((src, i) => ({
      src,
      alt: `${settings.brandName} product range photo ${i + 1}`,
    }));
  }

  const products = await getActiveProducts();
  return products
    .filter((p) => p.images.length > 0)
    .map((p) => ({ src: p.images[0], alt: p.name }));
}
