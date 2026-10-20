"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Trash2, X } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type OrderRow = {
  id: string;
  reference: string;
  customerName: string;
  mobile: string;
  businessName: string | null;
  itemCount: number;
  subtotal: number;
  status: string;
  createdAt: string;
  /** Null when the shop was never alerted automatically for this order. */
  adminNotifiedAt: string | null;
};

function badgeTone(status: string) {
  return status === "pending"
    ? "warning"
    : status === "cancelled"
      ? "danger"
      : status === "delivered"
        ? "success"
        : "navy";
}

/**
 * Whether the shop was automatically alerted about this order.
 *
 * Shown as a distinct column because "was I told?" is a different question from
 * "what is this order's status?" — an order can be pending AND unalerted, which
 * is exactly the case that needs a human to act.
 */
function AlertIndicator({ notifiedAt }: { notifiedAt: string | null }) {
  if (notifiedAt) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold text-fresh-700"
        title={`Alert delivered ${formatDate(notifiedAt)}`}
      >
        <span className="size-1.5 rounded-full bg-fresh-600" aria-hidden />
        Alerted
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"
      title="No automatic alert was delivered. Open the order to send it manually."
    >
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      Not alerted
    </span>
  );
}

/**
 * Orders table with row selection and deletion.
 *
 * Selection lives here (not on the server) so checkboxes respond instantly.
 * Deletion is always two-step — the confirm bar names how many requests are
 * about to go — because deleting an order cannot be undone. Every action calls
 * the admin API, which re-validates the session server-side.
 */
export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const selectedRows = useMemo(
    () => orders.filter((o) => selected.has(o.id)),
    [orders, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError(null);
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))));
    setError(null);
  }

  async function remove(ids: string[]) {
    setBusy(true);
    setError(null);
    try {
      const res =
        ids.length === 1
          ? await fetch(`/api/admin/orders/${ids[0]}`, { method: "DELETE" })
          : await fetch("/api/admin/orders/bulk-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not delete. Please try again.");
        return;
      }
      setSelected(new Set());
      setConfirming(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* ---------- selection toolbar ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-900/8 bg-white px-4 py-2.5">
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-navy-900">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 accent-fresh-600"
          />
          {selected.size === 0 ? "Select all on this page" : `${selected.size} selected`}
        </label>

        <AnimatePresence initial={false}>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="flex items-center gap-2"
            >
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete selected
                </button>
              ) : (
                <>
                  <span className="text-xs font-bold text-red-700">
                    Delete {selected.size} order{selected.size === 1 ? "" : "s"} permanently?
                  </span>
                  <button
                    type="button"
                    onClick={() => remove([...selected])}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-4 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />}
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                    className="rounded-full p-2 text-ink-mute transition-colors hover:bg-navy-50"
                    aria-label="Cancel delete"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">{error}</p>
      )}

      {/* ---------- desktop table ---------- */}
      <div className="hidden overflow-hidden rounded-2xl border border-navy-900/8 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Est. total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Alert</th>
                <th className="px-4 py-3">Received</th>
                <th className="w-14 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className={cn(
                    "border-b border-navy-900/6 transition-colors last:border-0",
                    selected.has(o.id) ? "bg-fresh-50/60" : "hover:bg-navy-50/40"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggle(o.id)}
                      aria-label={`Select ${o.reference}`}
                      className="size-4 accent-fresh-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy-900 hover:text-fresh-700">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-900">{o.customerName}</p>
                    <p className="text-xs text-ink-mute">
                      {o.mobile}
                      {o.businessName ? ` · ${o.businessName}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{formatINR(o.subtotal)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={badgeTone(o.status)}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <AlertIndicator notifiedAt={o.adminNotifiedAt} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-mute">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <RowDelete id={o.id} reference={o.reference} onDelete={remove} disabled={busy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- mobile cards ---------- */}
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li
            key={o.id}
            className={cn(
              "rounded-2xl border bg-white p-4 transition-colors",
              selected.has(o.id) ? "border-fresh-600/40 bg-fresh-50/60" : "border-navy-900/8"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.has(o.id)}
                  onChange={() => toggle(o.id)}
                  aria-label={`Select ${o.reference}`}
                  className="size-4 accent-fresh-600"
                />
                <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-extrabold tracking-wide text-navy-900">
                  {o.reference}
                </Link>
              </label>
              <Badge tone={badgeTone(o.status)}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge>
            </div>
            <p className="mt-2 font-semibold text-navy-900">{o.customerName}</p>
            <p className="text-xs text-ink-mute">
              {o.mobile}
              {o.businessName ? ` · ${o.businessName}` : ""}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-navy-900/8 pt-3 text-sm">
              <span className="text-ink-mute">
                {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {formatDate(o.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy-900">{formatINR(o.subtotal)}</span>
                <RowDelete id={o.id} reference={o.reference} onDelete={remove} disabled={busy} />
              </div>
            </div>
            <div className="mt-2">
              <AlertIndicator notifiedAt={o.adminNotifiedAt} />
            </div>
          </li>
        ))}
      </ul>

      {selectedRows.length > 0 && (
        <p className="text-center text-xs text-ink-mute">
          {selectedRows.length} request{selectedRows.length === 1 ? "" : "s"} selected ·{" "}
          {formatINR(selectedRows.reduce((s, o) => s + o.subtotal, 0))} estimated value
        </p>
      )}
    </>
  );
}

/** Single-row delete with an inline two-step confirm. */
function RowDelete({
  id,
  reference,
  onDelete,
  disabled,
}: {
  id: string;
  reference: string;
  onDelete: (ids: string[]) => void;
  disabled: boolean;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onDelete([id])}
          disabled={disabled}
          title={`Delete ${reference}`}
          className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={disabled}
          aria-label="Cancel"
          className="rounded-lg p-1 text-ink-mute transition-colors hover:bg-navy-50"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      disabled={disabled}
      aria-label={`Delete ${reference}`}
      title="Delete this request"
      className="rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
