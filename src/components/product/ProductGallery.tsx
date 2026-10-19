"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NoImage } from "@/components/ui/NoImage";

/** Image gallery with animated transitions between images. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const list = images;
  const [index, setIndex] = useState(0);
  const current = list.length > 0 ? list[Math.min(index, list.length - 1)] : null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-navy-900/8 bg-navy-50">
        {current ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current} alt={name} className="size-full object-cover" />
            </motion.div>
          </AnimatePresence>
        ) : (
          <NoImage label="Photo coming soon" />
        )}
      </div>

      {list.length > 1 && (
        <ul className="flex gap-2.5" role="list" aria-label="Product images">
          {list.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View image ${i + 1} of ${list.length}`}
                aria-current={i === index}
                className={cn(
                  "relative size-18 overflow-hidden rounded-xl border-2 bg-navy-50 transition-colors duration-200 sm:size-20",
                  i === index
                    ? "border-fresh-600"
                    : "border-transparent opacity-70 hover:border-navy-900/25 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
