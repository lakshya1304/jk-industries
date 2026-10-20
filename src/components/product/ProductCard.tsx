"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boxes, MessageCircle, Plus } from "lucide-react";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { NoImage } from "@/components/ui/NoImage";
import { Tilt } from "@/components/ui/Tilt";
import { useCart } from "@/components/cart/CartProvider";
import { cn, formatINR } from "@/lib/utils";
import { productEnquiryMessage, waLink } from "@/lib/whatsapp";
import type { ProductDTO } from "@/lib/types";

export type ProductCardOptions = {
  showMRP: boolean;
  showWholesale: boolean;
  showStockBadge: boolean;
  whatsappNumber: string;
  brandName: string;
};

export function ProductCard({
  product,
  options,
}: {
  product: ProductDTO;
  options: ProductCardOptions;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [packIndex, setPackIndex] = useState(0);
  const packs = product.packSizes.length > 0 ? product.packSizes : [];
  const selected = packs[Math.min(packIndex, packs.length - 1)];
  const image = product.images[0] ?? null;
  const out = product.availability === "out_of_stock";

  // Cartons are only offered when the catalogue knows how many units a carton
  // holds and the chosen pack has a wholesale rate to bill it at. Otherwise
  // there is nothing to price and bulk buying stays a WhatsApp enquiry.
  const cartonUnits = product.unitsPerCarton ?? 0;
  const cartonRate = selected?.wholesalePrice ?? null;
  const cartonAvailable =
    options.showWholesale && cartonUnits > 1 && cartonRate != null && !out;
  const cartonPrice = cartonAvailable ? cartonRate! * cartonUnits : 0;

  const enquiryHref = selected
    ? waLink(
        options.whatsappNumber,
        productEnquiryMessage({
          brandName: options.brandName,
          product,
          packLabel: selected.label,
        }),
      )
    : waLink(
        options.whatsappNumber,
        productEnquiryMessage({ brandName: options.brandName, product }),
      );

  /**
   * Open the product page when any non-interactive part of the card is
   * clicked.
   *
   * Controls inside the card (pack chips, Add to Cart, carton, the WhatsApp
   * link) must keep their own behaviour, so a click that originated on one of
   * them is ignored here. `closest` walks up from the real event target, which
   * also covers clicks on icons or text *inside* a button.
   */
  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    // Let modified clicks behave normally (open in new tab, etc.).
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, label")) return;

    router.push(`/products/${product.slug}`);
  }

  return (
    <Tilt className="h-full">
      {/*
        The whole card opens the product page, not just the image or the title.

        Two mechanisms work together:
        - `onClick` on the article handles a click anywhere on the card. It
          ignores clicks that landed on a real control (pack chips, Add to
          Cart, WhatsApp, carton) by checking whether the event target is
          inside an interactive element, so those keep doing their own job.
        - A stretched <Link> covers the card for keyboard focus, screen
          readers and middle-click/open-in-new-tab. It is decorative to the
          pointer (`pointer-events-none`) because the article's onClick
          already handles mouse clicks — otherwise the two would fight over
          the same click and could double-navigate.

        Clicks on the image, the title, the price text, the padding and the
        gaps between controls all land on the article, so every part of the
        card is clickable.
      */}
      <article
        onClick={handleCardClick}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-navy-900/6 bg-white shadow-[0_1px_2px_rgba(11,31,58,0.04)] transition-[box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] hover:border-navy-900/12 hover:shadow-[0_28px_56px_-26px_rgba(11,31,58,0.34)]"
      >
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name} details`}
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl focus-visible:pointer-events-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-600"
        />

        <div className="relative block aspect-square overflow-hidden bg-navy-50 [transform-style:preserve-3d]">
          {image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                className={cn(
                  "size-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]",
                  out && "opacity-70 saturate-50",
                )}
              />
            </>
          ) : (
            <NoImage label={product.name} />
          )}
          {options.showStockBadge && (
            <span className="absolute top-3 left-3">
              <AvailabilityBadge
                availability={product.availability}
                className="bg-white/90 backdrop-blur"
              />
            </span>
          )}
        </div>

        <div className="relative flex flex-1 flex-col gap-2.5 p-3.5 [transform-style:preserve-3d]">
          <div>
            <h3 className="line-clamp-2 text-sm leading-snug font-bold text-navy-900">
              {product.name}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-ink-mute uppercase">
              SKU {product.sku}
              {product.unitsPerCarton
                ? ` · ${product.unitsPerCarton} pcs/carton`
                : ""}
            </p>
          </div>

          {packs.length > 0 && (
            <div className="flex flex-wrap gap-1" role="group" aria-label={`Pack sizes for ${product.name}`}>
              {packs.map((pack, i) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackIndex(i)}
                  aria-pressed={i === packIndex}
                  className={cn(
                    "inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors duration-200",
                    i === packIndex
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-navy-900/15 bg-white text-ink-soft hover:border-navy-900/35 hover:text-navy-900",
                  )}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto space-y-0.5">
            {product.showPrice && selected ? (
              <>
                {options.showMRP && (
                  <p className="text-base font-extrabold text-navy-900">
                    {formatINR(selected.mrp)}
                    <span className="ml-1 text-[11px] font-semibold text-ink-mute">
                      MRP / {selected.label}
                    </span>
                  </p>
                )}
                {options.showWholesale && selected.wholesalePrice != null && (
                  <p className="text-xs font-bold text-fresh-700">
                    Wholesale {formatINR(selected.wholesalePrice)}
                    <span className="ml-1 font-medium text-ink-mute">
                      / {selected.label}
                    </span>
                  </p>
                )}
                {cartonAvailable && (
                  <p className="text-[11px] font-semibold text-ink-mute">
                    {formatINR(cartonPrice)} per carton of {cartonUnits}
                  </p>
                )}
                {!options.showMRP && (
                  <p className="text-xs font-semibold text-ink-soft">
                    Price on enquiry
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs font-semibold text-ink-soft">
                Price on enquiry
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-1.5 pt-0.5">
            <button
              type="button"
              disabled={!selected || out}
              onClick={() =>
                selected && addItem(product, selected, product.minOrderQty)
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-navy-900 px-3 text-xs font-semibold text-white shadow-[0_10px_22px_-14px_rgba(11,31,58,0.8)] transition-[background-color,transform] duration-200 hover:bg-navy-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden />
              {out ? "Unavailable" : "Add to Cart"}
            </button>
            <a
              href={enquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire on WhatsApp about ${product.name}`}
              className="grid size-9 place-items-center rounded-full bg-[#25D366]/12 text-[#128C4A] transition-[background-color,transform] duration-200 hover:bg-[#25D366]/25 active:scale-[0.97]"
            >
              <MessageCircle className="size-4" aria-hidden />
            </a>
          </div>

          {cartonAvailable && (
            <button
              type="button"
              onClick={() =>
                selected &&
                addItem(product, selected, 1, {
                  unitsPerCarton: cartonUnits,
                  unitWholesale: cartonRate!,
                })
              }
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-fresh-600/40 bg-fresh-50 px-2.5 text-[11px] font-bold text-fresh-800 transition-[background-color,border-color,transform] duration-200 hover:border-fresh-600/70 hover:bg-fresh-100 active:scale-[0.97]"
            >
              <Boxes className="size-3" aria-hidden />
              Add carton ({cartonUnits} × {selected?.label}) · {formatINR(cartonPrice)}
            </button>
          )}
        </div>
      </article>
    </Tilt>
  );
}
