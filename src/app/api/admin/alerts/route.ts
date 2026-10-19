import { getAdminApiSession, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 15;

/**
 * GET /api/admin/alerts — counters for the admin alert bell.
 *
 * Polled by the dashboard shell so staff see new order requests, unread
 * enquiries and low stock without refreshing.
 */
export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const [pendingOrders, newEnquiries, lowStockRow] = await Promise.all([
    prisma.order.count({ where: { status: "pending" } }),
    prisma.enquiry.count({ where: { status: "new" } }),
    prisma.packSize.findMany({
      where: { stock: { not: null }, active: true },
      select: { id: true, label: true, stock: true, product: { select: { name: true } } },
    }),
  ]);

  const lowStock = lowStockRow
    .filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  return Response.json({
    ok: true,
    counts: {
      pendingOrders,
      newEnquiries,
      lowStock: lowStock.length,
      total: pendingOrders + newEnquiries + lowStock.length,
    },
    lowStock: lowStock.slice(0, 5).map((p) => ({
      id: p.id,
      productName: p.product.name,
      label: p.label,
      stock: p.stock ?? 0,
    })),
  });
}
