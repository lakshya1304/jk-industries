import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, MessageCircle, Phone, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { buildAdminOrderMessage, manualWhatsAppLink } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const settings = await getSettings();
  const waNumber = normalizeWhatsAppNumber(order.mobile);
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hello ${order.customerName}, regarding your order request ${order.reference} from Super Cleaner:`
  )}`;

  // Same text the automatic alert sends, so the manual fallback is identical.
  const alertMessage = buildAdminOrderMessage(
    {
      reference: order.reference,
      customerName: order.customerName,
      businessName: order.businessName,
      mobile: order.mobile,
      email: order.email,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      gstin: order.gstin,
      notes: order.notes,
      items: order.items.map((i) => ({
        name: i.productName,
        packLabel: i.packLabel,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      subtotal: order.subtotal,
      itemCount: order.itemCount,
    },
    settings.brandName
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-bold text-fresh-700 hover:underline">
            ← Back to orders
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-900">
            {order.reference}
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Received {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/orders/${order.id}/bill`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-navy-900/15 px-4 text-sm font-bold text-navy-900 transition-colors hover:border-navy-900/40 hover:bg-navy-50"
          >
            <ReceiptText className="size-4" aria-hidden />
            Print bill
          </Link>
          <Badge tone={order.status === "pending" ? "warning" : order.status === "cancelled" ? "danger" : order.status === "delivered" ? "success" : "navy"}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Customer &amp; delivery</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 font-semibold text-ink-mute">Name</dt>
                <dd className="text-navy-900">
                  {order.customerName}
                  {order.businessName ? ` · ${order.businessName}` : ""}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 font-semibold text-ink-mute">Mobile</dt>
                <dd className="flex items-center gap-3">
                  <a href={`tel:${order.mobile}`} className="inline-flex items-center gap-1.5 font-semibold text-navy-900 hover:text-fresh-700">
                    <Phone className="size-3.5" aria-hidden /> {order.mobile}
                  </a>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f7a3d] hover:underline">
                    <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
                  </a>
                </dd>
              </div>
              {order.email && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-semibold text-ink-mute">Email</dt>
                  <dd>
                    <a href={`mailto:${order.email}`} className="inline-flex items-center gap-1.5 text-navy-900 hover:text-fresh-700">
                      <Mail className="size-3.5" aria-hidden /> {order.email}
                    </a>
                  </dd>
                </div>
              )}
              {order.gstin && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-semibold text-ink-mute">GSTIN</dt>
                  <dd className="font-mono text-navy-900">{order.gstin}</dd>
                </div>
              )}
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 font-semibold text-ink-mute">Address</dt>
                <dd className="flex gap-1.5 text-navy-900">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-mute" aria-hidden />
                  <span>
                    {order.address}, {order.city}, {order.state} — {order.pincode}
                  </span>
                </dd>
              </div>
              {order.notes && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 font-semibold text-ink-mute">Customer note</dt>
                  <dd className="text-ink-soft">{order.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                    <th className="py-2.5 pr-4">Product</th>
                    <th className="py-2.5 pr-4">Pack</th>
                    <th className="py-2.5 pr-4 text-right">MRP</th>
                    <th className="py-2.5 pr-4 text-right">Qty</th>
                    <th className="py-2.5 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-navy-900/6 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-semibold text-navy-900">{item.productName}</p>
                        <p className="text-xs text-ink-mute">{item.sku}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-soft">{item.packLabel}</td>
                      <td className="py-2.5 pr-4 text-right text-ink-soft">{formatINR(item.unitMrp)}</td>
                      <td className="py-2.5 pr-4 text-right text-ink-soft">{item.quantity}</td>
                      <td className="py-2.5 text-right font-semibold text-navy-900">{formatINR(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-3 text-right text-sm font-bold text-navy-900">
                      Estimated subtotal
                    </td>
                    <td className="pt-3 text-right text-base font-extrabold text-navy-900">
                      {formatINR(order.subtotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-mute">
              Prices are snapshotted at the time of the request. Wholesale pricing, taxes and
              shipping are confirmed separately.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Update order</h2>
            <div className="mt-4">
              <OrderStatusControl
                orderId={order.id}
                status={order.status}
                internalNotes={order.internalNotes ?? null}
              />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Status timeline</h2>
            {order.events.length === 0 ? (
              <p className="mt-3 text-sm text-ink-mute">
                No status changes yet — this order is still {ORDER_STATUS_LABELS[order.status] ?? order.status}.
              </p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-navy-900/8 pl-4">
                {order.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className={cn(
                        "absolute top-1 -left-[23px] size-3 rounded-full border-2 border-white",
                        event.notified ? "bg-fresh-600" : event.channel === "none" ? "bg-navy-300" : "bg-red-500"
                      )}
                      aria-hidden
                    />
                    <p className="text-sm font-bold text-navy-900">
                      {ORDER_STATUS_LABELS[event.status] ?? event.status}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-mute">{formatDate(event.createdAt)}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {event.notified
                        ? `${event.channel === "sms" ? "SMS" : "WhatsApp"} message submitted to the customer`
                        : event.detail
                          ? "Automatic message failed — send manually from the update panel"
                          : "No automatic message — send manually from the update panel"}
                    </p>
                    {event.detail && (
                      <p className="mt-1 line-clamp-2 text-[11px] break-words text-red-600">{event.detail}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            aria-labelledby="order-alert-heading"
            className="mt-6 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6"
          >
            <h2 id="order-alert-heading" className="text-base font-extrabold text-navy-900">
              Order alert
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-mute">
              {order.adminNotifiedAt ? (
                <>
                  This order was sent to your WhatsApp automatically on{" "}
                  {formatDate(order.adminNotifiedAt)}.
                </>
              ) : (
                <>
                  No automatic alert was delivered for this order. New orders are sent to
                  your WhatsApp automatically when the WhatsApp Business API is configured;
                  until then, use the button below to send the full details to yourself.
                </>
              )}
            </p>
            <a
              href={manualWhatsAppLink(normalizeWhatsAppNumber(settings.whatsappNumber), alertMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-fresh-600/40 bg-fresh-50 px-4 text-sm font-bold text-fresh-800 transition-colors hover:border-fresh-600/70 hover:bg-fresh-100"
            >
              <MessageCircle className="size-4" aria-hidden />
              Send order alert to my WhatsApp
            </a>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
                Preview the message
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-navy-50/70 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-navy-900">
                {alertMessage}
              </pre>
            </details>
          </section>
        </aside>
      </div>
    </div>
  );
}
