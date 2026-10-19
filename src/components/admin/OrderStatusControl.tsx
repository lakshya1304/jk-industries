"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, CircleAlert, LoaderCircle, MessageCircle, TriangleAlert } from "lucide-react";
import { ORDER_STATUSES, advanceActionLabel, NEXT_ORDER_STATUS } from "@/lib/constants";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type NotificationResult = {
  channel: "whatsapp" | "sms" | "none";
  ok: boolean;
  message: string;
  to: string;
  error?: string;
  manualLink: string;
};

export function OrderStatusControl({
  orderId,
  status,
  internalNotes,
}: {
  orderId: string;
  status: string;
  internalNotes: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationResult | null>(null);

  async function save(nextStatus?: string) {
    const target = nextStatus ?? value;
    if (nextStatus) setValue(nextStatus);
    setSaving(true);
    setSaved(false);
    setError(null);
    setNotification(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, internalNotes: notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not save the update.");
        return;
      }
      setSaved(true);
      setNotification(data?.notification ?? null);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const current = value;
  const next = NEXT_ORDER_STATUS[current] ?? null;
  const advanceLabel = advanceActionLabel(current);

  return (
    <div className="space-y-5">
      {/* One-click workflow actions */}
      <div className="space-y-2">
        {advanceLabel && next && (
          <button
            type="button"
            onClick={() => save(next)}
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-fresh-600 px-6 text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(22,163,74,0.9)] transition-colors hover:bg-fresh-700 disabled:opacity-60"
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {advanceLabel}
          </button>
        )}
        {current !== "cancelled" && current !== "delivered" && (
          <button
            type="button"
            onClick={() => save("cancelled")}
            disabled={saving}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-red-200 px-6 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Cancel order
          </button>
        )}
        <p className="text-xs text-ink-mute">
          {current === "pending"
            ? "Accepting the order notifies the customer automatically."
            : "Changing the status notifies the customer with the new status."}
        </p>
      </div>

      <Field label="Order status" htmlFor="order-status">
        <Select id="order-status" value={value} onChange={(e) => setValue(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Internal notes" htmlFor="order-notes" hint="Only visible to staff — never shown to the customer.">
        <Textarea
          id="order-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Called customer, confirmed pack sizes, dispatch planned…"
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save update"}
        </button>
        {saved && <span className="text-sm font-semibold text-fresh-700">Saved ✓</span>}
      </div>

      {notification && <NotificationBanner result={notification} saving={saving} />}
    </div>
  );
}

function NotificationBanner({ result, saving }: { result: NotificationResult; saving: boolean }) {
  if (saving) return null;

  const sent = result.ok;
  const failed = !result.ok && Boolean(result.error);
  const channelLabel = result.channel === "sms" ? "SMS" : "WhatsApp";

  return (
    <div
      role="status"
      className={cn(
        "space-y-3 rounded-xl px-4 py-3 text-sm",
        sent && "bg-fresh-50 text-fresh-800",
        failed && "bg-red-50 text-red-700",
        !sent && !failed && "bg-amber-50 text-amber-800"
      )}
    >
      <p className="flex items-start gap-2 font-semibold">
        {sent ? (
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : failed ? (
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span>
          {sent && `Status updated — ${channelLabel} message submitted to +${result.to}.`}
          {failed && `Status updated, but the automatic ${channelLabel} message failed.`}
          {!sent && !failed && `Status updated — automatic ${channelLabel} sending is not configured.`}
        </span>
      </p>

      {failed && <p className="text-xs break-words opacity-80">{result.error}</p>}

      {!sent && (
        <div className="space-y-2">
          <p className="text-xs">
            Send it yourself in one click — the message is already written:
          </p>
          <a
            href={result.manualLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#25D366] px-4 text-xs font-bold text-[#062b17] transition hover:bg-[#1fbb59]"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Send on WhatsApp to +{result.to}
          </a>
          <p className="text-[11px] opacity-70">
            To send automatically, add the WhatsApp Business credentials in .env (see README).
          </p>
        </div>
      )}
    </div>
  );
}
