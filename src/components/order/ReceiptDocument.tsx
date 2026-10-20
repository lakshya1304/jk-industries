import type { Order, OrderItem } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

type BillOrder = Order & { items: OrderItem[] };

/**
 * Compact 80 mm thermal receipt.
 *
 * This is the default print target for both the customer bill page and the
 * admin bill view: it is sized in millimetres (58 mm of printable width inside
 * an 80 mm roll) so a receipt printer renders it edge to edge instead of
 * scaling a web page down. On an ordinary A4 printer it simply prints as a
 * narrow strip down the middle of the sheet, which is the expected behaviour.
 *
 * Layout is a single column of monospace rows, because that is what thermal
 * printers have always been good at. Nothing depends on colour, so it stays
 * legible on the greyscale output those printers produce.
 *
 * No online payment is taken — this is a priced order request, not a tax
 * invoice, and the copy says so.
 */
export function ReceiptDocument({
  order,
  settings,
}: {
  order: BillOrder;
  settings: SiteSettings;
}) {
  const addressParts = [
    settings.addressLine,
    [settings.city, settings.state].filter(Boolean).join(", "),
    settings.pincode,
  ].filter(Boolean);

  return (
    <article className="receipt mx-auto bg-white text-black">
      <div className="receipt-inner">
        {/* ---------------------------------------------------------- header */}
        <header className="receipt-center">
          <h1 className="receipt-brand">{settings.brandName}</h1>
          <p className="receipt-muted">A brand of {settings.manufacturerName}</p>
          {addressParts.map((line) => (
            <p key={line} className="receipt-muted">
              {line}
            </p>
          ))}
          {settings.contactPhone && <p className="receipt-muted">{settings.contactPhone}</p>}
          {settings.contactEmail && <p className="receipt-muted">{settings.contactEmail}</p>}
          {settings.gstin && <p className="receipt-muted">GSTIN: {settings.gstin}</p>}
        </header>

        <hr className="receipt-rule" />

        {/* -------------------------------------------------------- metadata */}
        <div className="receipt-row">
          <span>Order no.</span>
          <span className="receipt-strong">{order.reference}</span>
        </div>
        <div className="receipt-row">
          <span>Date</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="receipt-row">
          <span>Status</span>
          <span className="receipt-strong">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <hr className="receipt-rule" />

        {/* ----------------------------------------------------------- party */}
        <p className="receipt-label">Requested by</p>
        <p className="receipt-strong">{order.customerName}</p>
        {order.businessName && <p>{order.businessName}</p>}
        <p>{order.mobile}</p>
        {order.email && <p className="receipt-wrap">{order.email}</p>}
        {order.gstin && <p className="receipt-wrap">GSTIN: {order.gstin}</p>}
        <p className="receipt-muted receipt-wrap">
          {order.address}, {order.city}, {order.state} — {order.pincode}
        </p>

        <hr className="receipt-rule" />

        {/* ----------------------------------------------------------- items */}
        <p className="receipt-label">Items</p>
        {order.items.map((item) => (
          <div key={item.id} className="receipt-item">
            <p className="receipt-wrap">{item.productName}</p>
            <p className="receipt-muted receipt-wrap">
              {item.sku}
              {item.packLabel ? ` · ${item.packLabel}` : ""}
            </p>
            <div className="receipt-row">
              <span className="receipt-muted">
                {item.quantity} × {formatINR(item.unitMrp)}
              </span>
              <span className="receipt-strong">{formatINR(item.lineTotal)}</span>
            </div>
          </div>
        ))}

        <hr className="receipt-rule" />

        {/* --------------------------------------------------------- totals */}
        <div className="receipt-row receipt-total">
          <span>Subtotal</span>
          <span>{formatINR(order.subtotal)}</span>
        </div>

        <hr className="receipt-rule" />

        <p className="receipt-note">
          This is an order <strong>request</strong> — not a tax invoice. No payment has been
          collected. Wholesale pricing, taxes and shipping are confirmed by{" "}
          {settings.manufacturerName} before dispatch.
        </p>

        <p className="receipt-center receipt-thanks">Thank you for your enquiry.</p>
      </div>
    </article>
  );
}
