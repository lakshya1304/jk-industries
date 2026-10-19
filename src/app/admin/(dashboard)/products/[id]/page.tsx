import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import { ProductForm } from "@/components/admin/ProductForm";
import type { AdminProduct } from "@/components/admin/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.product.findUnique({
    where: { id },
    include: { packSizes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) notFound();

  const product: AdminProduct = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    usage: row.usage,
    images: parseImages(row.images),
    minOrderQty: row.minOrderQty,
    unitsPerCarton: row.unitsPerCarton,
    availability: row.availability,
    featured: row.featured,
    active: row.active,
    showPrice: row.showPrice,
    sortOrder: row.sortOrder,
    packSizes: row.packSizes.map((p) => ({
      id: p.id,
      label: p.label,
      mrp: p.mrp,
      wholesalePrice: p.wholesalePrice,
      stock: p.stock,
      active: p.active,
      sortOrder: p.sortOrder,
    })),
  };

  return <ProductForm product={product} />;
}
