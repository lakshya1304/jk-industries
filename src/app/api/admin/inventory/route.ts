import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_STOCK = 1_000_000;

type Body = {
  packSizeId?: unknown;
  stock?: unknown;
  /** Relative change applied to the current stock, e.g. +1 / -5. */
  delta?: unknown;
  /** New MRP for the pack, when the admin edits the price inline. */
  mrp?: unknown;
};

/**
 * PATCH /api/admin/inventory — edit one pack size from the inventory screen.
 *
 * Accepts any combination of:
 *   - `stock`  absolute quantity (null / "" = stop tracking this pack)
 *   - `delta`  relative change applied to the stored stock (quick +/- buttons)
 *   - `mrp`    new MRP (quick price correction while reviewing stock)
 *
 * Stock is otherwise maintained automatically by order creation (reserve) and
 * cancellation (restore). A delta on an untracked pack is ignored rather than
 * silently starting to track it.
 */
export async function PATCH(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const body = (await readJson(request)) as Body | null;
  const packSizeId = typeof body?.packSizeId === "string" ? body.packSizeId : "";
  if (!packSizeId) {
    return Response.json({ error: "A pack size id is required." }, { status: 422 });
  }

  const existing = await prisma.packSize.findUnique({
    where: { id: packSizeId },
    select: { id: true, stock: true, mrp: true },
  });
  if (!existing) {
    return Response.json({ error: "That pack size no longer exists." }, { status: 404 });
  }

  const data: { stock?: number | null; mrp?: number } = {};

  // ---- absolute stock ------------------------------------------------
  if (body?.stock !== undefined) {
    const raw = body.stock;
    if (raw === null || raw === "") {
      data.stock = null;
    } else if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= MAX_STOCK) {
      data.stock = raw;
    } else {
      return Response.json(
        { error: "Stock must be a whole number from 0 to 1,000,000, or blank to stop tracking." },
        { status: 422 }
      );
    }
  }

  // ---- relative stock ------------------------------------------------
  if (body?.delta !== undefined) {
    const raw = body.delta;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw === 0) {
      return Response.json({ error: "Adjustment must be a non-zero whole number." }, { status: 422 });
    }
    if (existing.stock == null) {
      return Response.json(
        { error: "This pack is not tracked yet — set a quantity first." },
        { status: 422 }
      );
    }
    const next = existing.stock + raw;
    if (next < 0 || next > MAX_STOCK) {
      return Response.json(
        { error: `Adjusting by ${raw} would leave stock outside 0–1,000,000.` },
        { status: 422 }
      );
    }
    data.stock = next;
  }

  // ---- MRP -----------------------------------------------------------
  if (body?.mrp !== undefined) {
    const raw = body.mrp;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0 || raw > 10_000_000) {
      return Response.json({ error: "MRP must be a number between 0 and 1,00,00,000." }, { status: 422 });
    }
    data.mrp = Math.round(raw * 100) / 100;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 422 });
  }

  try {
    const updated = await prisma.packSize.update({
      where: { id: packSizeId },
      data,
      select: { stock: true, mrp: true },
    });

    // Keep the inventory view, alerts and product pages consistent.
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    revalidatePath("/admin/revenue");

    return Response.json({ ok: true, stock: updated.stock, mrp: updated.mrp });
  } catch (err) {
    console.error("[api/admin/inventory] failed to update pack:", err);
    return Response.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}
