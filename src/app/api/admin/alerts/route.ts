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

  // Every query takes a connection from a small pool, and this route is polled
  // by the dashboard shell while other admin pages load, so it is kept to four
  // cheap reads. The old version pulled *every* active pack in order to count
  // the low-stock ones; a count plus a top-5 slice does the same job for far
  // less work and avoids exhausting the pool (P2024).
  const lowStockWhere = {
    stock: { not: null, lte: LOW_STOCK_THRESHOLD },
    active: true,
  } as const;

  const [pendingOrders, newEnquiries, lowStockTotal, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: "pending" } }),
    prisma.enquiry.count({ where: { status: "new" } }),
    prisma.packSize.count({ where: lowStockWhere }),
    prisma.packSize.findMany({
      where: lowStockWhere,
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, label: true, stock: true, product: { select: { name: true } } },
    }),
  ]);

  return Response.json({
    ok: true,
    counts: {
      pendingOrders,
      newEnquiries,
      lowStock: lowStockTotal,
      total: pendingOrders + newEnquiries + lowStockTotal,
    },
    lowStock: lowStock.map((p) => ({
      id: p.id,
      productName: p.product.name,
      label: p.label,
      stock: p.stock ?? 0,
    })),
  });
}
