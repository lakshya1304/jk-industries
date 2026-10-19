import type { Order, OrderItem } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

type BillOrder = Order & { items: OrderItem[] };

/**
 * Printable bill / order request document. Shared by the customer-facing
 * `/bill/[reference]` page and the admin "Print bill" view. No payment is taken
 * online — this is a priced order request, not a tax invoice.
 */
export function BillDocument({
  order,
  settings,
  showNote = true,
}: {
  order: BillOrder;
  settings: SiteSettings;
  showNote?: boolean;
}) {
  const addressParts = [
    settings.addressLine,
    [settings.city, settings.state].filter(Boolean).join(", "),
    settings.pincode,
  ].filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl bg-white p-6 text-navy-900 shadow-[0_24px_60px_-45px_rgba(11,31,58,0.5)] print:max-w-none print:p-0 print:shadow-none md:p-10">
      {/* header */}
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-navy-900/10 pb-6">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">{settings.brandName}</p>
          <p className="text-sm font-semibold text-ink-soft">
            A brand of {settings.manufacturerName}
          </p>
          <address className="mt-2 text-xs leading-relaxed text-ink-mute not-italic">
            {addressParts.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {settings.contactPhone && <span className="block">{settings.contactPhone}</span>}
            {settings.contactEmail && <span className="block">{settings.contactEmail}</span>}
            {settings.gstin && <span className="block">GSTIN: {settings.gstin}</span>}
          </address>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold tracking-[0.18em] text-ink-mute uppercase">
            Order request
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold tracking-wide">{order.reference}</p>
          <p className="mt-1 text-xs text-ink-mute">{formatDate(order.createdAt)}</p>
          <p className="mt-1 text-xs font-bold text-fresh-700">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </p>
        </div>
      </header>

      {/* parties */}
      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-bold tracking-[0.14em] text-ink-mute uppercase">
            Requested by
          </h2>
          <p className="mt-2 text-sm font-bold">{order.customerName}</p>
          {order.businessName && <p className="text-sm text-ink-soft">{order.businessName}</p>}
          <p className="text-sm text-ink-soft">{order.mobile}</p>
          {order.email && <p className="text-sm text-ink-soft">{order.email}</p>}
          {order.gstin && <p className="text-sm text-ink-soft">GSTIN: {order.gstin}</p>}
        </div>
        <div>
          <h2 className="text-xs font-bold tracking-[0.14em] text-ink-mute uppercase">
            Delivery address
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {order.address}
            <br />
            {order.city}, {order.state} — {order.pincode}
          </p>
        </div>
      </section>

      {/* items */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-navy-900/10 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
              <th className="py-3 pr-3">#</th>
              <th className="py-3 pr-3">Product</th>
              <th className="py-3 pr-3">Pack</th>
              <th className="py-3 pr-3 text-right">Rate</th>
              <th className="py-3 pr-3 text-right">Qty</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} className="border-b border-navy-900/6">
                <td className="py-3 pr-3 text-ink-mute">{i + 1}</td>
                <td className="py-3 pr-3">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-xs text-ink-mute">{item.sku}</p>
                </td>
                <td className="py-3 pr-3 text-ink-soft">{item.packLabel}</td>
                <td className="py-3 pr-3 text-right text-ink-soft">{formatINR(item.unitMrp)}</td>
                <td className="py-3 pr-3 text-right text-ink-soft">{item.quantity}</td>
                <td className="py-3 text-right font-semibold">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-4 text-right text-sm font-bold">
                Estimated subtotal
              </td>
              <td className="pt-4 text-right text-lg font-extrabold">
                {formatINR(order.subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showNote && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 print:bg-transparent print:p-0">
          This is an order <strong>request</strong>, not a tax invoice. No payment has been
          collected online. Final wholesale pricing, applicable taxes and shipping charges are
          confirmed by {settings.manufacturerName} before dispatch.
        </p>
      )}
    </article>
  );
}
