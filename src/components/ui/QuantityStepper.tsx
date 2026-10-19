"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible −/+ quantity selector. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10_000,
  className,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9" : "h-11";
  const btn =
    "grid place-items-center text-navy-900/70 transition-colors hover:bg-navy-900/5 hover:text-navy-900 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-navy-900/12 bg-white",
        dim,
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn(btn, size === "sm" ? "size-9" : "size-11")}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantity"
        className={cn(
          "w-10 border-x border-navy-900/10 bg-transparent text-center text-sm font-semibold text-navy-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" ? "h-9" : "h-11"
        )}
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(1, Math.floor(next))));
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn(btn, size === "sm" ? "size-9" : "size-11")}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      </button>
    </div>
  );
}
