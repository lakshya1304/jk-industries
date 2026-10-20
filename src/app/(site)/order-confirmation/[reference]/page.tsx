import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MessageCircle, PackageSearch, ReceiptText } from "lucide-react";
import { getOrderByReference } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { ConfirmationAnimation } from "@/components/order/ConfirmationAnimation";
import { Reveal } from "@/components/ui/Reveal";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Order Request Received",
  // A per-customer confirmation page: it holds no content of value to search
  // and would leak order references if crawled.
  robots: { index: false, follow: false },
};

type Params = Promise<{ reference: string }>;

export default function OrderConfirmationPage({ params }: { params: Params }) {
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <Suspense fallback={<div className="skeleton mx-auto h-96 w-full max-w-2xl rounded-3xl" aria-hidden />}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params }: { params: Params }) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();
  const settings = await getSettings();

  const waHref = waLink(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I have submitted order request ${order.reference} (${order.customerName}). Please confirm pricing and delivery.`
  );

  return (
    <Reveal className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-navy-900/8 bg-white p-8 text-center shadow-[0_30px_70px_-45px_rgba(11,31,58,0.4)] md:p-10">
        <ConfirmationAnimation />

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl">
          Order request received
        </h1>
        <p className="mt-3 text-ink-soft">
          Thank you, {order.customerName.split(" ")[0]}. Your request has been saved with{" "}
          {settings.brandName} and is pending confirmation by our team.
        </p>

        <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-navy-50 px-6 py-4">
          <span className="text-xs font-bold tracking-[0.16em] text-ink-mute uppercase">
            Order reference
          </span>
          <span className="font-mono text-xl font-extrabold tracking-wide text-navy-900">
            {order.reference}
          </span>
          <span className="text-xs font-semibold text-fresh-700">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <dl className="mt-8 divide-y divide-navy-900/6 text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 py-3">
              <dt>
                <p className="text-sm font-bold text-navy-900">{item.productName}</p>
                <p className="mt-0.5 text-xs text-ink-mute">
                  {item.packLabel} · {item.sku} · qty {item.quantity}
                </p>
              </dt>
              <dd className="shrink-0 text-sm font-bold text-navy-900">
                {formatINR(item.lineTotal)}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-3.5">
            <dt className="text-sm font-bold text-navy-900">Estimated subtotal</dt>
            <dd className="text-lg font-extrabold text-navy-900">{formatINR(order.subtotal)}</dd>
          </div>
        </dl>

        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs leading-relaxed text-amber-800">
          Final wholesale pricing, taxes, shipping charges and payment terms will be shared by
          our team when the order is confirmed. Nothing has been charged — this is a request,
          not a payment.
        </p>

        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
          >
            <MessageCircle className="size-4.5" aria-hidden />
            Follow up on WhatsApp
          </a>
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center rounded-full border border-navy-900/15 px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <Link
            href={`/track?mobile=${encodeURIComponent(order.mobile)}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-navy-900/15 px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            <PackageSearch className="size-4.5" aria-hidden />
            Track this order
          </Link>
          <Link
            href={`/bill/${order.reference}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-navy-900/15 px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            <ReceiptText className="size-4.5" aria-hidden />
            View bill
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
