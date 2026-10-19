import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidateProducts } from "@/lib/products";
import type { ProductInput } from "@/lib/validation";

/** Thrown when a product cannot be hard-deleted because order history references it. */
export class ProductInUseError extends Error {
  constructor(public orderCount: number) {
    super(
      `This product appears in ${orderCount} order request(s). Deactivate it instead so past orders keep their record.`
    );
    this.name = "ProductInUseError";
  }
}

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  let counter = 1;
  // Bound the loop defensively; collisions beyond this are effectively impossible.
  while (counter < 200) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

/** All products (including inactive) for the admin list, newest edits first. */
export async function listAdminProducts() {
  return prisma.product.findMany({
    include: { packSizes: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createProduct(input: ProductInput) {
  const skuOwner = await prisma.product.findUnique({ where: { sku: input.sku }, select: { id: true } });
  if (skuOwner) throw new Error(`SKU “${input.sku}” is already used by another product.`);

  const slug = await uniqueSlug(input.name);
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      sku: input.sku,
      description: input.description,
      usage: input.usage,
      images: JSON.stringify(input.images),
      minOrderQty: input.minOrderQty,
      unitsPerCarton: input.unitsPerCarton ?? null,
      availability: input.availability,
      featured: input.featured,
      active: input.active,
      showPrice: input.showPrice,
      sortOrder: input.sortOrder,
      packSizes: {
        create: input.packSizes.map((p, i) => ({
          label: p.label,
          mrp: p.mrp,
          wholesalePrice: p.wholesalePrice ?? null,
          stock: p.stock ?? null,
          active: p.active,
          sortOrder: i,
        })),
      },
    },
    select: { id: true, slug: true },
  });
  revalidateProducts();
  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const current = await prisma.product.findUnique({
    where: { id },
    include: { packSizes: true },
  });
  if (!current) throw new Error("Product not found.");

  const skuOwner = await prisma.product.findUnique({ where: { sku: input.sku }, select: { id: true } });
  if (skuOwner && skuOwner.id !== id) {
    throw new Error(`SKU “${input.sku}” is already used by another product.`);
  }

  const slug = current.name === input.name ? current.slug : await uniqueSlug(input.name, id);
  const existingIds = new Set(current.packSizes.map((p) => p.id));
  const keepIds = input.packSizes
    .map((p) => p.id)
    .filter((pid): pid is string => typeof pid === "string" && existingIds.has(pid));

  await prisma.$transaction(async (tx) => {
    // Remove pack sizes the admin deleted from the form.
    await tx.packSize.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });

    for (const [index, pack] of input.packSizes.entries()) {
      const data = {
        label: pack.label,
        mrp: pack.mrp,
        wholesalePrice: pack.wholesalePrice ?? null,
        stock: pack.stock ?? null,
        active: pack.active,
        sortOrder: index,
      };
      if (pack.id && existingIds.has(pack.id)) {
        await tx.packSize.update({ where: { id: pack.id }, data });
      } else {
        await tx.packSize.create({ data: { ...data, productId: id } });
      }
    }

    await tx.product.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        sku: input.sku,
        description: input.description,
        usage: input.usage,
        images: JSON.stringify(input.images),
        minOrderQty: input.minOrderQty,
        unitsPerCarton: input.unitsPerCarton ?? null,
        availability: input.availability,
        featured: input.featured,
        active: input.active,
        showPrice: input.showPrice,
        sortOrder: input.sortOrder,
      },
    });
  });

  revalidateProducts();
  return { id, slug };
}

/** Quick show/hide toggle used from the products list. */
export async function setProductActive(id: string, active: boolean) {
  const product = await prisma.product.update({ where: { id }, data: { active } });
  revalidateProducts();
  return product;
}

/**
 * Permanent delete — admin only. Blocked when the product is referenced by any
 * order line so historical orders never lose their reference. Prefer deactivate.
 */
export async function deleteProduct(id: string) {
  const orderCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderCount > 0) throw new ProductInUseError(orderCount);
  await prisma.product.delete({ where: { id } });
  revalidateProducts();
}
