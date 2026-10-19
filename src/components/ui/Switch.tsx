"use client";

import { cn } from "@/lib/utils";

/**
 * Accessible pill switch used across the admin dashboard.
 *
 * Geometry is driven by one variable so the track and knob can never drift out
 * of alignment: the track is 2.75rem × 1.5rem, the knob is 1.25rem and travels
 * exactly `track − knob − 2 × padding`, which keeps an even 0.125rem gutter on
 * both sides in the off and on states.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Accessible name. Required because the control has no visible label. */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
        "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-fresh-600" : "bg-slate-300 dark:bg-slate-600",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-1 ring-black/5",
          "transition-transform duration-200 ease-[var(--ease-out-soft)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
