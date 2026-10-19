import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderReference } from "@/lib/utils";
import { sendOrderNotificationEmail } from "@/lib/email";
import type { OrderRequestInput } from "@/lib/validation";

/** User-facing error for order validation failures. */
export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export type CreatedOrder = {
  id: string;
  reference: string;
  subtotal: number;
  itemCount: number;
  duplicate?: boolean;
};

/**
 * Validate and persist an order request.
 *
 * - Prices, pack sizes, availability and minimum order quantities are all
 *   re-validated against the database; nothing is trusted from the client.
 * - Order line items snapshot name/price data so later catalogue changes do
 *   not alter historical orders.
 * - Idempotent when a clientToken is supplied (prevents duplicate submissions).
 */
export async function createOrderRequest(input: OrderRequestInput): Promise<CreatedOrder> {
  if (input.clientToken) {
    const existing = await prisma.order.findFirst({ where: { clientToken: input.clientToken } });
    if (existing) {
      return {
        id: existing.id,
        reference: existing.reference,
        subtotal: existing.subtotal,
        itemCount: existing.itemCount,
        duplicate: true,
      };
    }
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { packSizes: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  type Line = {
    productId: string;
    productName: string;
    sku: string;
    packLabel: string;
    unitMrp: number;
    unitWholesale: number | null;
    quantity: number;
    lineTotal: number;
  };
  const lines: Line[] = [];
  const qtyPerProduct = new Map<string, number>();

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.active) {
      throw new OrderError("One or more products in your request are no longer available.");
    }
    const packSize = product.packSizes.find((ps) => ps.id === item.packSizeId && ps.active);
    if (!packSize) {
      throw new OrderError(`Selected pack size is not available for ${product.name}.`);
    }
    if (product.availability === "out_of_stock") {
      throw new OrderError(`${product.name} is currently out of stock.`);
    }
    qtyPerProduct.set(product.id, (qtyPerProduct.get(product.id) ?? 0) + item.quantity);
    lines.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      packLabel: packSize.label,
      unitMrp: packSize.mrp,
      unitWholesale: packSize.wholesalePrice,
      quantity: item.quantity,
      lineTotal: Math.round(packSize.mrp * item.quantity * 100) / 100,
    });
  }

  // Minimum order quantity per product (across chosen pack sizes).
  for (const product of products) {
    const total = qtyPerProduct.get(product.id) ?? 0;
    if (product.active && total > 0 && total < product.minOrderQty) {
      throw new OrderError(
        `${product.name} has a minimum order quantity of ${product.minOrderQty}.`
      );
    }
  }

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  // Create with a unique reference; retry on the unlikely collision.
  let order: { id: string; reference: string; subtotal: number; itemCount: number } | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const reference = generateOrderReference();
    try {
      order = await prisma.order.create({
        data: {
          reference,
          status: "pending",
          customerName: input.customerName,
          businessName: input.businessName ?? null,
          mobile: input.mobile,
          email: input.email ?? null,
          gstin: input.gstin ?? null,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          notes: input.notes ?? null,
          subtotal,
          itemCount,
          clientToken: input.clientToken ?? null,
          items: { create: lines },
        },
        select: { id: true, reference: true, subtotal: true, itemCount: true },
      });
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isUniqueViolation) throw err;
    }
  }
  if (!order) {
    throw new OrderError("Could not allocate an order reference. Please try again.");
  }

  // Best-effort admin notification; failure must not fail the order.
  await sendOrderNotificationEmail({
    reference: order.reference,
    customerName: input.customerName,
    businessName: input.businessName ?? null,
    mobile: input.mobile,
    email: input.email ?? null,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    items: lines.map((l) => ({ name: l.productName, packLabel: l.packLabel, quantity: l.quantity, lineTotal: l.lineTotal })),
    subtotal,
  });

  return order;
}

/** Look up an order by reference for the confirmation page. */
export async function getOrderByReference(reference: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  return order;
}
