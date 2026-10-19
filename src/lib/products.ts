import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
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
  packSizes: { id: string; label: string; mrp: number; wholesalePrice: number | null; active: boolean }[];
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
}
