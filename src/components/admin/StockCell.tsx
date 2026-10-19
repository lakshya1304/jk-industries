"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline stock editor for one pack size on the inventory page.
 *
 * Saving calls PATCH /api/admin/inventory which validates the integer and
 * updates the pack, then refreshes the server component so totals and alerts
 * stay in sync.
 */
export function StockCell({
  packSizeId,
  stock,
  lowThreshold,
}: {
  packSizeId: string;
  stock: number | null;
  lowThreshold: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock == null ? "" : String(stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = value.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isInteger(next) || next < 0 || next > 1_000_000)) {
      setError("Enter a whole number from 0 to 1,000,000, or leave blank to stop tracking.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSizeId, stock: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not save stock.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setValue(stock == null ? "" : String(stock));
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Edit stock"
        className={cn(
          "group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-bold transition-colors hover:bg-navy-50",
          stock == null
            ? "text-ink-mute"
            : stock === 0
              ? "text-red-600"
              : stock <= lowThreshold
                ? "text-amber-700"
                : "text-navy-900"
        )}
      >
        {stock ?? "—"}
        <Pencil className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          autoFocus
          disabled={saving}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          placeholder="untracked"
          className="h-9 w-24 rounded-lg border border-navy-900/15 bg-white px-2.5 text-right text-sm font-semibold text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
          aria-label="Stock quantity"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Save stock"
          className="rounded-lg p-1.5 text-fresh-700 transition-colors hover:bg-fresh-50 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          aria-label="Cancel"
          className="rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-navy-50 disabled:opacity-60"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {error && <p className="max-w-56 text-right text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
