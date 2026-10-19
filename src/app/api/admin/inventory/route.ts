import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * PATCH /api/admin/inventory — set the stock level for one pack size.
 *
 * `stock` may be null, which means "stop tracking this pack". Setting a value
 * starts tracking it again. Stock is otherwise maintained automatically by
 * order creation (reserve) and cancellation (restore).
 */
export async function PATCH(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const body = (await readJson(request)) as { packSizeId?: unknown; stock?: unknown } | null;
  const packSizeId = typeof body?.packSizeId === "string" ? body.packSizeId : "";
  if (!packSizeId) {
    return Response.json({ error: "A pack size id is required." }, { status: 422 });
  }

  const raw = body?.stock;
  let stock: number | null;
  if (raw === null || raw === "" || raw === undefined) {
    stock = null;
  } else if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 1_000_000) {
    stock = raw;
  } else {
    return Response.json(
      { error: "Stock must be a whole number from 0 to 1,000,000, or blank to stop tracking." },
      { status: 422 }
    );
  }

  try {
    const exists = await prisma.packSize.findUnique({
      where: { id: packSizeId },
      select: { id: true },
    });
    if (!exists) {
      return Response.json({ error: "That pack size no longer exists." }, { status: 404 });
    }

    await prisma.packSize.update({ where: { id: packSizeId }, data: { stock } });

    // Keep the inventory view, alerts and product pages consistent.
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");

    return Response.json({ ok: true, stock });
  } catch (err) {
    console.error("[api/admin/inventory] failed to update stock:", err);
    return Response.json({ error: "Could not save stock. Please try again." }, { status: 500 });
  }
}
