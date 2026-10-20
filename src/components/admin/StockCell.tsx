"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Pencil, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Patch = { stock?: number | null; delta?: number; mrp?: number };

/**
 * Inline editor for one pack size on the inventory page.
 *
 * Two modes:
 *   - quick  : −/+ buttons that PATCH a delta, plus a pencil to type an exact value
 *   - edit   : number input for the exact quantity, and (when enabled) the MRP
 *
 * Every save calls PATCH /api/admin/inventory, which validates the integer
 * server-side and refreshes the route so totals, charts and alerts stay in sync.
 */
export function StockCell({
  packSizeId,
  stock,
  mrp,
  lowThreshold,
  allowPrice = true,
}: {
  packSizeId: string;
  stock: number | null;
  mrp: number;
  lowThreshold: number;
  allowPrice?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock == null ? "" : String(stock));
  const [price, setPrice] = useState(String(mrp));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function send(patch: Patch, opts: { close?: boolean } = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSizeId, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not save.");
        return false;
      }
      if (opts.close) setEditing(false);
      startTransition(() => router.refresh());
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function saveExact() {
    const trimmed = value.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 0 || next > 1_000_000)) {
      setError("Whole number 0–1,000,000, or blank to stop tracking.");
      return;
    }
    const nextPrice = Number(price);
    if (allowPrice && (!Number.isFinite(nextPrice) || nextPrice < 0)) {
      setError("MRP must be a number.");
      return;
    }
    const patch: Patch = { stock: next };
    if (allowPrice && Math.round(nextPrice * 100) / 100 !== mrp) patch.mrp = nextPrice;
    send(patch, { close: true });
  }

  function cancel() {
    setValue(stock == null ? "" : String(stock));
    setPrice(String(mrp));
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <label className="sr-only" htmlFor={`stock-${packSizeId}`}>
            Stock quantity
          </label>
          <input
            id={`stock-${packSizeId}`}
            type="number"
            inputMode="numeric"
            min={0}
            value={value}
            autoFocus
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveExact();
              if (e.key === "Escape") cancel();
            }}
            placeholder="untracked"
            className="h-9 w-24 rounded-lg border border-navy-900/15 bg-white px-2.5 text-right text-sm font-semibold text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
          />
          {allowPrice && (
            <>
              <label className="sr-only" htmlFor={`mrp-${packSizeId}`}>
                MRP
              </label>
              <input
                id={`mrp-${packSizeId}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                disabled={busy}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveExact();
                  if (e.key === "Escape") cancel();
                }}
                className="h-9 w-24 rounded-lg border border-navy-900/15 bg-white px-2.5 text-right text-sm font-semibold text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
                title="MRP"
              />
            </>
          )}
          <button
            type="button"
            onClick={saveExact}
            disabled={busy}
            aria-label="Save"
            className="rounded-lg p-1.5 text-fresh-700 transition-colors hover:bg-fresh-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            aria-label="Cancel"
            className="rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-navy-50 disabled:opacity-60"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {error && <p className="max-w-64 text-right text-[11px] font-semibold text-red-600">{error}</p>}
      </div>
    );
  }

  const tone =
    stock == null
      ? "text-ink-mute"
      : stock === 0
        ? "text-red-600"
        : stock <= lowThreshold
          ? "text-amber-700"
          : "text-navy-900";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => send({ delta: -1 })}
          disabled={busy || stock == null || stock <= 0}
          aria-label="Decrease stock by 1"
          className="rounded-lg border border-navy-900/12 p-1.5 text-ink-soft transition-colors hover:bg-navy-50 disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Edit exact quantity and MRP"
          className={cn(
            "group inline-flex min-w-14 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold transition-colors hover:bg-navy-50",
            tone
          )}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : (stock ?? "—")}
          <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => send({ delta: 1 })}
          disabled={busy || stock == null}
          aria-label="Increase stock by 1"
          className="rounded-lg border border-navy-900/12 p-1.5 text-ink-soft transition-colors hover:bg-navy-50 disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
      {error && <p className="max-w-56 text-right text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
