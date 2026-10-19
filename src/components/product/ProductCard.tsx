"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
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
  const { addItem } = useCart();
  const [packIndex, setPackIndex] = useState(0);
  const packs = product.packSizes.length > 0 ? product.packSizes : [];
  const selected = packs[Math.min(packIndex, packs.length - 1)];
  const image = product.images[0] ?? null;
  const out = product.availability === "out_of_stock";

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

  return (
    <Tilt className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy-900/6 bg-white shadow-[0_1px_2px_rgba(11,31,58,0.04)] transition-[box-shadow,border-color] duration-300 ease-[var(--ease-out-soft)] hover:border-navy-900/12 hover:shadow-[0_28px_56px_-26px_rgba(11,31,58,0.34)]">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-4/5 overflow-hidden bg-navy-50 [transform:translateZ(28px)]"
          tabIndex={-1}
          aria-hidden
        >
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
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-5 [transform:translateZ(40px)]">
          <div>
            <h3 className="text-base leading-snug font-bold text-navy-900">
              <Link
                href={`/products/${product.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs font-semibold tracking-wide text-ink-mute uppercase">
              SKU {product.sku}
              {product.unitsPerCarton
                ? ` · ${product.unitsPerCarton} pcs/carton`
                : ""}
            </p>
          </div>

          {packs.length > 0 && (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={`Pack sizes for ${product.name}`}
            >
              {packs.map((pack, i) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackIndex(i)}
                  aria-pressed={i === packIndex}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200",
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
                  <p className="text-lg font-extrabold text-navy-900">
                    {formatINR(selected.mrp)}
                    <span className="ml-1 text-xs font-semibold text-ink-mute">
                      MRP / {selected.label}
                    </span>
                  </p>
                )}
                {options.showWholesale && selected.wholesalePrice != null && (
                  <p className="text-sm font-bold text-fresh-700">
                    Wholesale: {formatINR(selected.wholesalePrice)}
                    <span className="ml-1 text-xs font-medium text-ink-mute">
                      per {selected.label}
                    </span>
                  </p>
                )}
                {!options.showMRP && (
                  <p className="text-sm font-semibold text-ink-soft">
                    Price on enquiry
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-semibold text-ink-soft">
                Price on enquiry
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
            <button
              type="button"
              disabled={!selected || out}
              onClick={() =>
                selected && addItem(product, selected, product.minOrderQty)
              }
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-navy-900 px-4 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(11,31,58,0.8)] transition-[background-color,transform] duration-200 hover:bg-navy-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              {out ? "Unavailable" : "Add to Cart"}
            </button>
            <a
              href={enquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Enquire on WhatsApp about ${product.name}`}
              className="grid size-10 place-items-center rounded-full bg-[#25D366]/12 text-[#128C4A] transition-[background-color,transform] duration-200 hover:bg-[#25D366]/25 active:scale-[0.97]"
            >
              <MessageCircle className="size-4.5" aria-hidden />
            </a>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-9 items-center justify-center rounded-full border border-navy-900/15 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            View Details
          </Link>
        </div>
      </article>
    </Tilt>
  );
}
