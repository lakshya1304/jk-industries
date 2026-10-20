import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { revalidateProducts } from "@/lib/products";
import { manualWhatsAppLink, sendStatusNotification } from "@/lib/notify";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

/** Put the reserved quantity of every tracked pack size back into stock. */
async function releaseOrderStock(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { packSizeId: true, quantity: true },
  });
  for (const item of items) {
    if (!item.packSizeId) continue;
    const pack = await prisma.packSize.findUnique({
      where: { id: item.packSizeId },
      select: { stock: true },
    });
    if (pack?.stock == null) continue;
    await prisma.packSize.update({
      where: { id: item.packSizeId },
      data: { stock: pack.stock + item.quantity },
    });
  }
}

/**
 * PATCH /api/admin/orders/[id] — update status and/or internal notes (admin only).
 *
 * When the status actually changes, the customer is notified (WhatsApp/SMS when
 * configured, otherwise the message is returned for one-click manual sending)
 * and the change is recorded in the order's status timeline. A notification
 * failure never fails the update itself.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const parsed = orderStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status update." },
      { status: 422 }
    );
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Order not found." }, { status: 404 });

  const data: { status: string; internalNotes?: string | null } = { status: parsed.data.status };
  if (parsed.data.internalNotes !== undefined) {
    data.internalNotes = parsed.data.internalNotes.trim() === "" ? null : parsed.data.internalNotes;
  }

  const statusChanged = existing.status !== parsed.data.status;

  try {
    const order = await prisma.order.update({ where: { id }, data });

    if (!statusChanged) {
      return Response.json({ ok: true, status: order.status, changed: false, notification: null });
    }

    // Stock moves back to inventory when an order is cancelled (it was reserved
    // when the request was submitted).
    if (parsed.data.status === "cancelled" && existing.status !== "cancelled") {
      try {
        await releaseOrderStock(order.id);
        revalidateProducts();
      } catch (err) {
        console.error("[orders] could not restore stock:", err);
      }
    }

    // Best-effort customer notification — never blocks the status update.
    let brandName = "Super Cleaner";
    try {
      brandName = (await getSettings()).brandName;
    } catch {
      /* fall back to the default brand name */
    }

    const notification = await sendStatusNotification({
      brandName,
      customerName: order.customerName,
      reference: order.reference,
      mobile: order.mobile,
      status: order.status,
    });

    try {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          status: order.status,
          channel: notification.channel,
          notified: notification.ok,
          detail: notification.error ?? null,
        },
      });
    } catch (err) {
      console.error("[orders] could not record status event:", err);
    }

    return Response.json({
      ok: true,
      status: order.status,
      changed: true,
      notification: { ...notification, manualLink: manualWhatsAppLink(notification.to, notification.message) },
    });
  } catch {
    return Response.json({ error: "Could not update the order." }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/orders/[id] — permanently remove one order request.
 *
 * Deleting is irreversible, so it is admin-only and never touches inventory
 * silently: if the order still held reserved stock (anything not cancelled or
 * delivered), that quantity is returned to the packs first. Order items and the
 * status timeline are removed explicitly, in a transaction, so a partial delete
 * can never leave orphaned rows behind.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return Response.json({ error: "Order not found." }, { status: 404 });

  // Released outside the transaction because it touches PackSize rows; a failure
  // here must not block the delete the admin explicitly asked for.
  const holdsStock = existing.status !== "cancelled" && existing.status !== "delivered";
  if (holdsStock) {
    try {
      await releaseOrderStock(id);
      revalidateProducts();
    } catch (err) {
      console.error("[orders] could not restore stock before delete:", err);
    }
  }

  try {
    await prisma.$transaction([
      prisma.orderEvent.deleteMany({ where: { orderId: id } }),
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);
  } catch (err) {
    console.error("[orders] failed to delete order:", err);
    return Response.json({ error: "Could not delete the order." }, { status: 500 });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/inventory");

  return Response.json({ ok: true, releasedStock: holdsStock });
}
