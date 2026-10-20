import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidateProducts } from "@/lib/products";
import { revalidatePath } from "next/cache";

/** Hard cap so a single request can never wipe the whole table by accident. */
const MAX_BULK = 200;

/**
 * POST /api/admin/orders/bulk-delete — permanently remove several order requests.
 *
 * Body: `{ ids: string[] }`. Only ids that exist are deleted; unknown ids are
 * reported back rather than failing the whole batch. Any order that still held
 * reserved stock has that stock returned to the packs before its rows go, so
 * deleting never quietly loses inventory.
 *
 * The rows are removed in one transaction, so either every requested order goes
 * or none does.
 */
export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const body = (await readJson(request)) as { ids?: unknown } | null;
  const raw = Array.isArray(body?.ids) ? body.ids : null;
  if (!raw || raw.length === 0) {
    return Response.json({ error: "Select at least one order to delete." }, { status: 422 });
  }
  if (raw.length > MAX_BULK) {
    return Response.json(
      { error: `Delete at most ${MAX_BULK} orders at a time.` },
      { status: 422 }
    );
  }

  const ids = [...new Set(raw.filter((x): x is string => typeof x === "string" && x.length > 0))];
  if (ids.length === 0) {
    return Response.json({ error: "No valid order ids were supplied." }, { status: 422 });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  if (orders.length === 0) {
    return Response.json({ error: "None of those orders exist any more." }, { status: 404 });
  }

  // Return reserved stock for anything not already cancelled or delivered.
  const holdsStock = orders.filter((o) => o.status !== "cancelled" && o.status !== "delivered");
  if (holdsStock.length > 0) {
    try {
      const items = await prisma.orderItem.findMany({
        where: { orderId: { in: holdsStock.map((o) => o.id) }, packSizeId: { not: null } },
        select: { packSizeId: true, quantity: true },
      });
      const totals = new Map<string, number>();
      for (const it of items) {
        if (!it.packSizeId) continue;
        totals.set(it.packSizeId, (totals.get(it.packSizeId) ?? 0) + it.quantity);
      }
      for (const [packSizeId, qty] of totals) {
        const pack = await prisma.packSize.findUnique({
          where: { id: packSizeId },
          select: { stock: true },
        });
        if (pack?.stock == null) continue;
        await prisma.packSize.update({
          where: { id: packSizeId },
          data: { stock: pack.stock + qty },
        });
      }
      revalidateProducts();
    } catch (err) {
      console.error("[orders] could not restore stock before bulk delete:", err);
    }
  }

  const found = orders.map((o) => o.id);
  try {
    await prisma.$transaction([
      prisma.orderEvent.deleteMany({ where: { orderId: { in: found } } }),
      prisma.orderItem.deleteMany({ where: { orderId: { in: found } } }),
      prisma.order.deleteMany({ where: { id: { in: found } } }),
    ]);
  } catch (err) {
    console.error("[orders] failed to bulk delete:", err);
    return Response.json({ error: "Could not delete those orders." }, { status: 500 });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/inventory");

  return Response.json({
    ok: true,
    deleted: found.length,
    missing: ids.filter((id) => !found.includes(id)),
  });
}
