"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Field";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import type { ProductDTO } from "@/lib/types";
import type { ProductCardOptions } from "@/components/product/ProductCard";

type SortKey = "featured" | "name" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name: A–Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const minMrp = (p: ProductDTO) =>
  p.packSizes.length > 0 ? Math.min(...p.packSizes.map((s) => s.mrp)) : Infinity;

export function ProductCatalogue({
  products,
  options,
}: {
  products: ProductDTO[];
  options: ProductCardOptions;
}) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [availability, setAvailability] = useState("all");
  const [isPending, setIsPending] = useState(false);
  const firstRender = useRef(true);

  // Show the skeleton from the moment the visitor types (set in the change
  // handler, not here — updating state inside this effect would cascade).
  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim()) setIsPending(true);
  };

  // Debounce typing so results feel smooth instead of jittery.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setIsPending(false);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setIsPending(true);
    const t = setTimeout(() => setIsPending(false), 240);
    return () => clearTimeout(t);
  }, [sort, availability]);

  const filtered = useMemo(() => {
    let list = products;
    if (debouncedQuery) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(debouncedQuery) ||
          p.sku.toLowerCase().includes(debouncedQuery)
      );
    }
    if (availability !== "all") {
      list = list.filter((p) => p.availability === availability);
    }
    const sorted = [...list];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price_asc":
        sorted.sort((a, b) => minMrp(a) - minMrp(b));
        break;
      case "price_desc":
        sorted.sort((a, b) => minMrp(b) - minMrp(a));
        break;
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [products, debouncedQuery, sort, availability]);

  const hasFilters = Boolean(debouncedQuery) || availability !== "all";

  return (
    <div>
      {/* controls */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-navy-900/6 bg-surface/85 px-4 py-4 backdrop-blur md:top-18">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-ink-mute"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="Search by product name or SKU…"
              aria-label="Search products by name or SKU"
              className="h-12 w-full rounded-full border border-navy-900/12 bg-white pr-10 pl-11 text-sm font-medium text-navy-900 placeholder:text-slate-400 transition-colors focus:border-fresh-600 focus:ring-2 focus:ring-fresh-600/20 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-mute transition hover:bg-navy-900/5 hover:text-navy-900"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="size-4 shrink-0 text-ink-mute" aria-hidden />
            <Select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-12 w-44 rounded-full text-sm font-semibold"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="h-12 w-40 rounded-full text-sm font-semibold"
            >
              <option value="all">All availability</option>
              {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1">
          <p className="text-sm text-ink-mute" aria-live="polite">
            {isPending ? (
              "Updating results…"
            ) : (
              <>
                <span className="font-bold text-navy-900">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "product" : "products"}
                {hasFilters ? " match your search" : "in the catalogue"}
              </>
            )}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                updateQuery("");
                setAvailability("all");
              }}
              className="text-sm font-semibold text-fresh-700 underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* results */}
      <div className="min-h-96 py-8">
        <AnimatePresence mode="wait" initial={false}>
          {isPending ? (
            <motion.ul
              key="skeletons"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-hidden
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i}>
                  <ProductCardSkeleton />
                </li>
              ))}
            </motion.ul>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-navy-900/15 bg-white px-8 py-16 text-center"
            >
              <span className="grid size-16 place-items-center rounded-full bg-navy-50">
                <PackageSearch className="size-7 text-navy-600" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-bold text-navy-900">No products found</p>
                <p className="mt-1 text-sm text-ink-mute">
                  Try a different name or SKU, or clear the filters. You can also send us an
                  enquiry on WhatsApp for sourcing help.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateQuery("");
                  setAvailability("all");
                }}
                className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                Clear search
              </button>
            </motion.div>
          ) : (
            <motion.ul
              key={`results-${sort}-${availability}`}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {filtered.map((product, i) => (
                <motion.li
                  key={product.id}
                  layout={!reduced}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(i * 0.045, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full"
                >
                  <ProductCard product={product} options={options} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
