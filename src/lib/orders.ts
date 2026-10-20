import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderReference } from "@/lib/utils";
import { revalidateProducts } from "@/lib/products";
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
    packSizeId: string;
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
    // Stock is tracked only for pack sizes that have a stock value set.
    if (packSize.stock != null && item.quantity > packSize.stock) {
      throw new OrderError(
        `Only ${packSize.stock} unit${packSize.stock === 1 ? "" : "s"} of ${product.name} (${packSize.label}) are available right now.`
      );
    }
    qtyPerProduct.set(product.id, (qtyPerProduct.get(product.id) ?? 0) + item.quantity);
    lines.push({
      productId: product.id,
      packSizeId: packSize.id,
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

  // Create with a unique reference; retry on the unlikely collision. Stock for
  // tracked pack sizes is reserved in the same transaction as the order itself.
  let order: { id: string; reference: string; subtotal: number; itemCount: number } | null = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const reference = generateOrderReference();
    try {
      order = await prisma.$transaction(
        async (tx) => {
          const created = await tx.order.create({
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

          // Reserve stock for every tracked pack in one round-trip each, issued
          // together rather than one-at-a-time: fewer network hops inside the
          // transaction is what keeps a slow connection from timing it out.
          const packs = await tx.packSize.findMany({
            where: { id: { in: lines.map((l) => l.packSizeId) } },
            select: { id: true, stock: true },
          });
          const stockById = new Map(packs.map((p) => [p.id, p.stock]));

          await Promise.all(
            lines.map((line) => {
              const stock = stockById.get(line.packSizeId);
              if (stock == null) return null;
              return tx.packSize.update({
                where: { id: line.packSizeId },
                data: { stock: Math.max(0, stock - line.quantity) },
              });
            })
          );

          return created;
        },
        // The default 5s budget is not enough when the database is remote and
        // the network is slow, which would fail a real customer's checkout.
        { timeout: 20_000, maxWait: 10_000 }
      );
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isUniqueViolation) throw err;
      order = null;
    }
  }
  if (!order) {
    throw new OrderError("Could not allocate an order reference. Please try again.");
  }
  if (order) revalidateProducts();

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

export type OrderTracking = {
  reference: string;
  status: string;
  createdAt: Date;
  itemCount: number;
  subtotal: number;
  city: string;
  items: { productName: string; packLabel: string; quantity: number }[];
  events: { status: string; createdAt: Date }[];
};

/**
 * Orders belonging to a mobile number, for the public "Track order" page.
 *
 * PRIVACY: only the caller-supplied mobile number is matched, and the returned
 * payload deliberately omits the delivery address, email and GSTIN. The route
 * that calls this is rate-limited to slow down number enumeration.
 */
export async function trackOrdersByMobile(mobile: string): Promise<OrderTracking[]> {
  const digits = mobile.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) return [];

  const orders = await prisma.order.findMany({
    where: { mobile: { contains: digits } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      items: { select: { productName: true, packLabel: true, quantity: true } },
      events: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true } },
    },
  });

  return orders.map((o) => ({
    reference: o.reference,
    status: o.status,
    createdAt: o.createdAt,
    itemCount: o.itemCount,
    subtotal: o.subtotal,
    city: o.city,
    items: o.items,
    events: o.events,
  }));
}

/** Full order (items + status timeline) for the printable bill page. */
export async function getOrderForBill(reference: string) {
  return prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}
