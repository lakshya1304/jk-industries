"use client";

import { Printer } from "lucide-react";

/**
 * Print button for the bill pages.
 *
 * `window.print()` is called inside a `requestAnimationFrame` so the browser
 * has committed the current layout — including any size switch made by the
 * receipt/full-bill toggle — before the print dialog snapshots the page.
 * Calling it synchronously in the click handler could print the previous
 * layout if the toggle and the print button were pressed in quick succession.
 */
export function PrintButton({ label = "Print" }: { label?: string }) {
  function handlePrint() {
    requestAnimationFrame(() => window.print());
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
    >
      <Printer className="size-4" aria-hidden />
      {label}
    </button>
  );
}
