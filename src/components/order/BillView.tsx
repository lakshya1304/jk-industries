"use client";

import type { Order, OrderItem } from "@prisma/client";
import { useState } from "react";
import { ReceiptDocument } from "@/components/order/ReceiptDocument";
import { BillDocument } from "@/components/order/BillDocument";
import { PrintButton } from "@/components/order/PrintButton";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

type BillOrder = Order & { items: OrderItem[] };

type Format = "receipt" | "full";

/**
 * Bill view shared by the customer page and the admin page.
 *
 * Two formats are offered:
 *  - "receipt" (default) — the compact 80 mm thermal receipt, sized for a till
 *    roll printer.
 *  - "full" — the detailed A4-style document, kept for anyone who wants the
 *    whole thing on one page.
 *
 * `.print-area` marks what should reach paper. The print stylesheet hides every
 * other element on the page, so the storefront navbar/footer and the admin
 * sidebar/header are all excluded without either page having to list them.
 */
export function BillView({ order, settings }: { order: BillOrder; settings: SiteSettings }) {
  const [format, setFormat] = useState<Format>("receipt");

  return (
    <div className="space-y-5">
      {/* Toolbar — never printed. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full border border-navy-900/12 bg-white p-1"
          role="group"
          aria-label="Bill format"
        >
          <button
            type="button"
            onClick={() => setFormat("receipt")}
            aria-pressed={format === "receipt"}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              format === "receipt"
                ? "bg-navy-900 text-white"
                : "text-ink-soft hover:text-navy-900",
            )}
          >
            Small receipt
          </button>
          <button
            type="button"
            onClick={() => setFormat("full")}
            aria-pressed={format === "full"}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              format === "full"
                ? "bg-navy-900 text-white"
                : "text-ink-soft hover:text-navy-900",
            )}
          >
            Full bill
          </button>
        </div>

        <PrintButton label={format === "receipt" ? "Print receipt" : "Print full bill"} />
      </div>

      {/* On-screen framing differs per format, but both live inside .print-area
          so the print stylesheet treats them the same way. */}
      <div className="print-area">
        {format === "receipt" ? (
          <div className="mx-auto w-fit rounded-lg border border-navy-900/10 bg-white px-3 py-4 shadow-[0_16px_40px_-30px_rgba(11,31,58,0.5)] print:border-0 print:shadow-none">
            <ReceiptDocument order={order} settings={settings} />
          </div>
        ) : (
          <BillDocument order={order} settings={settings} />
        )}
      </div>
    </div>
  );
}
