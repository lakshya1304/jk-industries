import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOrderReference } from "@/lib/utils";
import { revalidateProducts } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { manualWhatsAppLink, sendAdminOrderNotification } from "@/lib/notify";
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
  /** True when email or WhatsApp confirmed delivery of the admin alert. */
  adminNotified?: boolean;
  /**
   * One-click link that sends the new-order alert to the shop's WhatsApp.
   * Present always, so the admin dashboard can offer it when no provider
   * accepted the automatic send.
   */
  adminWhatsAppLink?: string;
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
    /** Units of the underlying pack one line quantity consumes. */
    unitsPerLine: number;
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

    // Carton lines are billed at the wholesale rate and consume one carton's
    // worth of stock per unit ordered. Values are re-derived from the product
    // record; the client only told us that it picked a carton.
    const unitsPerLine = item.isCarton ? (product.unitsPerCarton ?? 0) : 1;
    if (item.isCarton) {
      if (!product.unitsPerCarton || product.unitsPerCarton < 1) {
        throw new OrderError(
          `${product.name} cannot be ordered by the carton — please order single packs.`
        );
      }
      if (packSize.wholesalePrice == null) {
        throw new OrderError(
          `Wholesale pricing for ${product.name} (${packSize.label}) is not available. Please enquire on WhatsApp.`
        );
      }
    }

    const stockUnits = item.quantity * unitsPerLine;
    // Stock is tracked only for pack sizes that have a stock value set.
    if (packSize.stock != null && stockUnits > packSize.stock) {
      const availableCartons = Math.floor(packSize.stock / unitsPerLine);
      throw new OrderError(
        item.isCarton
          ? `Only ${availableCartons} carton${availableCartons === 1 ? "" : "s"} of ${product.name} (${packSize.label}) are available right now.`
          : `Only ${packSize.stock} unit${packSize.stock === 1 ? "" : "s"} of ${product.name} (${packSize.label}) are available right now.`
      );
    }

    const unitPrice =
      item.isCarton && packSize.wholesalePrice != null
        ? packSize.wholesalePrice * product.unitsPerCarton!
        : packSize.mrp;

    qtyPerProduct.set(product.id, (qtyPerProduct.get(product.id) ?? 0) + stockUnits);
    lines.push({
      productId: product.id,
      packSizeId: packSize.id,
      productName: product.name,
      sku: product.sku,
      packLabel: item.isCarton
        ? `${packSize.label} carton of ${product.unitsPerCarton}`
        : packSize.label,
      unitMrp: packSize.mrp,
      unitWholesale: packSize.wholesalePrice,
      quantity: item.quantity,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      unitsPerLine,
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
              items: {
                create: lines.map((l) => ({
                  productId: l.productId,
                  packSizeId: l.packSizeId,
                  productName: l.productName,
                  sku: l.sku,
                  packLabel: l.packLabel,
                  unitMrp: l.unitMrp,
                  unitWholesale: l.unitWholesale,
                  quantity: l.quantity,
                  lineTotal: l.lineTotal,
                  stockUnits: l.unitsPerLine * l.quantity,
                })),
              },
            },
            select: { id: true, reference: true, subtotal: true, itemCount: true },
          });

          // Reserve stock for every tracked pack in one round-trip each, issued
          // together rather than one-at-a-time: fewer network hops inside the
          // transaction is what keeps a slow connection from timing it out.
          //
          // Several lines can target the same pack (a single pack *and* a carton
          // of it), so the reservation is summed per pack first — issuing one
          // update per line would otherwise compute the second from stale stock
          // and silently lose the first reservation.
          const reservedByPack = new Map<string, number>();
          for (const line of lines) {
            reservedByPack.set(
              line.packSizeId,
              (reservedByPack.get(line.packSizeId) ?? 0) + line.unitsPerLine * line.quantity
            );
          }

          const packs = await tx.packSize.findMany({
            where: { id: { in: [...reservedByPack.keys()] } },
            select: { id: true, stock: true },
          });
          const stockById = new Map(packs.map((p) => [p.id, p.stock]));

          await Promise.all(
            [...reservedByPack].map(([packSizeId, units]) => {
              const stock = stockById.get(packSizeId);
              if (stock == null) return null;
              return tx.packSize.update({
                where: { id: packSizeId },
                data: { stock: Math.max(0, stock - units) },
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

  // Best-effort admin notifications; failure must never fail the order.
  //
  // Email and WhatsApp are dispatched together rather than in sequence: they hit
  // different providers, so awaiting one before starting the other would add its
  // latency to the customer's checkout for no benefit.
  const orderData = {
    reference: order.reference,
    customerName: input.customerName,
    businessName: input.businessName ?? null,
    mobile: input.mobile,
    email: input.email ?? null,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    notes: input.notes ?? null,
    items: lines.map((l) => ({
      name: l.productName,
      packLabel: l.packLabel,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    subtotal,
  };

  const settings = await getSettings();

  const [emailSent, waResult] = await Promise.all([
    sendOrderNotificationEmail({
      reference: order.reference,
      customerName: orderData.customerName,
      businessName: orderData.businessName,
      mobile: orderData.mobile,
      email: orderData.email,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      pincode: orderData.pincode,
      items: orderData.items,
      subtotal,
    }),
    sendAdminOrderNotification({
      brandName: settings.brandName,
      adminWhatsappNumber: settings.whatsappNumber,
      order: { ...orderData, gstin: input.gstin ?? null, itemCount },
    }),
  ]);

  // Record whether the admin was actually alerted, so the dashboard can show a
  // one-click manual send when no provider is configured. Logged rather than
  // stored: `OrderEvent` tracks customer status notifications, and adding an
  // admin-only row there would show up in the customer's tracking timeline.
  if (!emailSent && !waResult.ok) {
    console.warn(
      `[orders] admin not alerted for ${order.reference} (email=${emailSent}, whatsapp=${waResult.ok})`
    );
  }

  // Expose the manual link so the caller can surface it immediately after
  // checkout when automatic delivery was not possible.
  return {
    ...order,
    adminNotified: emailSent || waResult.ok,
    adminWhatsAppLink: manualWhatsAppLink(waResult.to, waResult.message),
  };
}

/**
 * Add previously reserved units back to pack stock, summed per pack.
 *
 * Two lines can target the same pack (a single pack and a carton of it), so
 * deltas are accumulated before writing — updating once per item would read
 * stale stock for the second and lose the first restore. Carton lines restore
 * `stockUnits` (`quantity × unitsPerCarton`) rather than `quantity`.
 *
 * Best-effort: callers treat a failure as non-fatal, since the order itself
 * has already been removed or cancelled.
 */
export async function restockPacks(
  items: { packSizeId: string | null; quantity: number; stockUnits?: number }[]
): Promise<void> {
  const byPack = new Map<string, number>();
  for (const item of items) {
    if (!item.packSizeId) continue;
    byPack.set(
      item.packSizeId,
      (byPack.get(item.packSizeId) ?? 0) + (item.stockUnits ?? item.quantity)
    );
  }
  if (byPack.size === 0) return;

  const packs = await prisma.packSize.findMany({
    where: { id: { in: [...byPack.keys()] } },
    select: { id: true, stock: true },
  });
  const stockById = new Map(packs.map((p) => [p.id, p.stock]));

  await Promise.all(
    [...byPack].map(([packSizeId, units]) => {
      const stock = stockById.get(packSizeId);
      if (stock == null) return null;
      return prisma.packSize.update({
        where: { id: packSizeId },
        data: { stock: stock + units },
      });
    })
  );
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

/**
 * Same shape as `getOrderForBill`, but keyed on the primary key.
 *
 * The admin bill route has the order's `id` (it comes from the URL), while the
 * customer-facing bill route has the `reference`. They are different columns,
 * so passing an id to `getOrderForBill` silently returns `null` and the page
 * 404s.
 */
export async function getOrderForBillById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}
