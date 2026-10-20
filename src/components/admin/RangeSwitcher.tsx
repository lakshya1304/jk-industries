"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
] as const;

/**
 * Range switcher for the revenue screen. Updates `?range=` in the URL so the
 * server component re-renders with the chosen window (shareable/bookmarkable).
 */
export function RangeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-navy-900/12 bg-white p-1">
      {pending && <Loader2 className="ml-2 size-3.5 animate-spin text-ink-mute" aria-hidden />}
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => select(r.value)}
          aria-pressed={current === r.value}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
            current === r.value
              ? "bg-navy-900 text-white"
              : "text-ink-soft hover:bg-navy-50 hover:text-navy-900"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
