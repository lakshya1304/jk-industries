"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductRowActions({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(active);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    const next = !isActive;
    setBusy(true);
    setError(null);
    setIsActive(next); // optimistic
    try {
      const res = await fetch(`/api/admin/products/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) {
        setIsActive(!next);
        setError("Could not update status.");
      } else {
        router.refresh();
      }
    } catch {
      setIsActive(!next);
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not delete this product.");
        setBusy(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${isActive ? "Hide" : "Show"} ${name}`}
        disabled={busy}
        onClick={toggleActive}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
          isActive ? "bg-fresh-600" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            isActive ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </button>

      <button
        type="button"
        aria-label={`Delete ${name}`}
        disabled={busy}
        onClick={() => setConfirming(true)}
        className="rounded-lg p-2 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${name}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl"
            >
              <h3 className="text-lg font-extrabold text-navy-900">Delete “{name}”?</h3>
              <p className="mt-2 text-sm text-ink-soft">
                This permanently removes the product and its pack sizes. Products that appear in
                past orders cannot be deleted — hide them instead so the catalogue stays clean and
                order history is preserved.
              </p>
              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    setError(null);
                  }}
                  disabled={busy}
                  className="inline-flex h-10 items-center rounded-full border border-navy-900/15 px-5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex h-10 items-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
