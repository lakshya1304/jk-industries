"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ENQUIRY_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EnquiryStatusControl({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function update(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setValue(previous);
        setError(true);
      } else {
        router.refresh();
      }
    } catch {
      setValue(previous);
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Enquiry status"
        value={value}
        disabled={saving}
        onChange={(e) => update(e.target.value)}
        className={cn(
          "rounded-lg border bg-white px-2.5 py-1.5 text-xs font-bold text-navy-900 transition-colors focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25 disabled:opacity-60",
          value === "new" ? "border-amber-300" : value === "resolved" ? "border-fresh-600/40" : "border-navy-900/15"
        )}
      >
        {ENQUIRY_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-[11px] text-ink-mute">saving…</span>}
      {error && <span className="text-[11px] font-semibold text-red-600">failed</span>}
    </div>
  );
}
