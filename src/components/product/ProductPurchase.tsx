"use client";

import { useState } from "react";
import { MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR } from "@/lib/utils";
import { productEnquiryMessage, waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/lib/types";

export type PurchaseOptions = {
  showMRP: boolean;
  showWholesale: boolean;
  whatsappNumber: string;
  brandName: string;
};

/** Pack selector, quantity stepper, pricing and add-to-cart / WhatsApp actions. */
export function ProductPurchase({
  product,
  options,
}: {
  product: ProductDTO;
  options: PurchaseOptions;
}) {
  const { addItem } = useCart();
  const [packIndex, setPackIndex] = useState(0);
  const [quantity, setQuantity] = useState(Math.max(1, product.minOrderQty));
  const packs = product.packSizes;
  const selected = packs[packIndex];
  const out = product.availability === "out_of_stock";

  const selectPack = (i: number) => {
    setPackIndex(i);
    setQuantity(Math.max(1, product.minOrderQty));
  };

  const waHref = waLink(
    options.whatsappNumber,
    productEnquiryMessage({
      brandName: options.brandName,
      product,
      packLabel: selected?.label,
      quantity,
    })
  );

  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
      {/* pack sizes */}
      <fieldset>
        <legend className="text-sm font-bold text-navy-900">Pack size</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {packs.map((pack, i) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => selectPack(i)}
              aria-pressed={i === packIndex}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
                i === packIndex
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-navy-900/15 bg-white text-ink-soft hover:border-navy-900/40 hover:text-navy-900"
              )}
            >
              {pack.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* price */}
      {product.showPrice && selected ? (
        <div className="mt-5 rounded-xl bg-navy-50/70 px-4 py-3.5">
          {options.showMRP ? (
            <p className="text-2xl font-extrabold text-navy-900">
              {formatINR(selected.mrp)}
              <span className="ml-1.5 text-sm font-semibold text-ink-mute">
                MRP / {selected.label}
              </span>
            </p>
          ) : (
            <p className="text-base font-bold text-navy-900">Price on enquiry</p>
          )}
          {options.showWholesale && selected.wholesalePrice != null && (
            <p className="mt-1 text-sm font-bold text-fresh-700">
              Wholesale price: {formatINR(selected.wholesalePrice)} per {selected.label}
              <span className="ml-1 font-medium text-ink-mute">
                — confirmed on bulk enquiry
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-navy-50/70 px-4 py-3.5 text-base font-bold text-navy-900">
          Price on enquiry
        </p>
      )}

      {/* quantity */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy-900">Quantity</p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Minimum order quantity: {product.minOrderQty}
            {product.unitsPerCarton ? ` · ${product.unitsPerCarton} units per carton` : ""}
          </p>
        </div>
        <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
      </div>

      {/* actions */}
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={!selected || out}
          onClick={() => selected && addItem(product, selected, quantity)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-navy-900 px-6 text-sm font-bold text-white shadow-[0_16px_32px_-18px_rgba(11,31,58,0.9)] transition-[background-color,transform] duration-200 hover:bg-navy-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4.5" aria-hidden />
          {out ? "Out of Stock" : "Add to Cart"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] shadow-[0_16px_32px_-18px_rgba(37,211,102,0.9)] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
        >
          <MessageCircle className="size-4.5" aria-hidden />
          Enquire on WhatsApp
        </a>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-mute">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-fresh-700" aria-hidden />
        Order requests are confirmed by {options.brandName} team — final wholesale pricing,
        taxes, shipping and payment terms are shared before dispatch.
      </p>
    </div>
  );
}
