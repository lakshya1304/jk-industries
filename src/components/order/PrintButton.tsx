"use client";

import { Printer } from "lucide-react";

/** Print / save-as-PDF button for the bill pages. */
export function PrintButton({ label = "Print bill" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800 print:hidden"
    >
      <Printer className="size-4" aria-hidden />
      {label}
    </button>
  );
}
