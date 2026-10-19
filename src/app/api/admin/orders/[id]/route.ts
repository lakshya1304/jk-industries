import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { manualWhatsAppLink, sendStatusNotification } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

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
