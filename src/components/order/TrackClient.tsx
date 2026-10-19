"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CircleAlert, PackageSearch, PartyPopper, ReceiptText, Search, Truck } from "lucide-react";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TrackedOrder = {
  reference: string;
  status: string;
  createdAt: string;
  itemCount: number;
  subtotal: number;
  city: string;
  items: { productName: string; packLabel: string; quantity: number }[];
  events: { status: string; createdAt: string }[];
};

/** Only non-cancelled steps count towards the progress bar. */
const FLOW: string[] = ORDER_STATUSES.filter((s) => s.value !== "cancelled").map((s) => s.value);

export function TrackClient({
  initialMobile = "",
  brandName,
}: {
  initialMobile?: string;
  brandName?: string;
}) {
  const [mobile, setMobile] = useState(initialMobile);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(value: string) {
    const digits = value.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit mobile number.");
      setOrders(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not look up orders.");
        setOrders(null);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setError("A network error occurred. Please try again.");
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-search when arriving from the confirmation page with ?mobile=…
  useEffect(() => {
    if (!initialMobile) return;
    const timer = setTimeout(() => void lookup(initialMobile), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(mobile);
        }}
        className="rounded-3xl border border-navy-900/8 bg-white p-5 shadow-[0_24px_60px_-45px_rgba(11,31,58,0.5)] md:p-7"
      >
        <label htmlFor="track-mobile" className="text-sm font-bold text-navy-900">
          Mobile number used for the order request
        </label>
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
          <input
            id="track-mobile"
            inputMode="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile number"
            className="h-12 flex-1 rounded-xl border border-navy-900/12 bg-white px-4 text-base text-navy-900 placeholder:text-slate-400 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 px-7 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? (
              "Searching…"
            ) : (
              <>
                <Search className="size-4" aria-hidden />
                Track order
              </>
            )}
          </button>
        </div>
        <p className="mt-2.5 text-xs text-ink-mute">
          For privacy we only look up orders placed with this number and never show your address
          or email here.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </form>

      {orders !== null && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-navy-900/15 bg-white p-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-navy-50">
            <PackageSearch className="size-6 text-navy-600" aria-hidden />
          </span>
          <h2 className="text-lg font-bold text-navy-900">No orders found for this number</h2>
          <p className="max-w-sm text-sm text-ink-mute">
            Check the number you entered, or submit an order request from the catalogue. You can
            also contact {brandName ?? "us"} on WhatsApp and we will look it up for you.
          </p>
        </div>
      )}

      {orders?.map((order, i) => (
        <TrackedOrderCard key={order.reference} order={order} delay={i * 0.06} />
      ))}
    </div>
  );
}

function TrackedOrderCard({ order, delay }: { order: TrackedOrder; delay: number }) {
  const cancelled = order.status === "cancelled";
  const currentIndex = FLOW.indexOf(order.status);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-navy-900/8 bg-white"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/8 px-5 py-4 md:px-6">
        <div>
          <p className="font-mono text-lg font-extrabold tracking-wide text-navy-900">
            {order.reference}
          </p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Placed {formatDate(order.createdAt)} · {order.itemCount} item
            {order.itemCount === 1 ? "" : "s"} · {formatINR(order.subtotal)} · {order.city}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <div className="px-5 py-5 md:px-6">
        {cancelled ? (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            This order request was cancelled. Contact us on WhatsApp if this looks wrong.
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-4">
            {FLOW.map((step, index) => {
              const done = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <li key={step} className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        done ? "bg-fresh-600 text-white" : "bg-navy-50 text-ink-mute"
                      )}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        done ? "text-navy-900" : "text-ink-mute"
                      )}
                    >
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mt-2 block h-1.5 rounded-full",
                      done ? "bg-fresh-600" : "bg-navy-50"
                    )}
                    aria-hidden
                  />
                  {isCurrent && step === "delivered" && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-fresh-700">
                      <PartyPopper className="size-3.5" aria-hidden /> Delivered
                    </p>
                  )}
                  {isCurrent && step === "shipped" && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-fresh-700">
                      <Truck className="size-3.5" aria-hidden /> On the way
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <details className="mt-5 rounded-2xl border border-navy-900/8 bg-navy-50/40 px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-navy-900">
            Items in this request
          </summary>
          <ul className="mt-3 space-y-2">
            {order.items.map((item, i) => (
              <li key={`${item.productName}-${i}`} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-soft">
                  {item.productName} · {item.packLabel}
                </span>
                <span className="shrink-0 font-semibold text-navy-900">× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/bill/${order.reference}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-navy-900/15 px-4 text-sm font-bold text-navy-900 transition-colors hover:border-navy-900/40 hover:bg-navy-50"
          >
            <ReceiptText className="size-4" aria-hidden />
            View bill
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = cancelledTone(status);
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", tone)}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function cancelledTone(status: string) {
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "delivered") return "bg-fresh-50 text-fresh-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-navy-50 text-navy-800";
}
