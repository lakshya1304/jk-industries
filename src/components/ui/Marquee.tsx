"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Continuously scrolling strip of short messages.
 *
 * The track is duplicated so the loop has no visible seam. When the visitor
 * prefers reduced motion the strip stops and simply centres a single copy —
 * every message stays readable either way.
 */
export function Marquee({
  items,
  className,
  speed = 32,
}: {
  items: string[];
  className?: string;
  /** Seconds for one full pass. */
  speed?: number;
}) {
  const reduced = useReducedMotion();

  if (items.length === 0) return null;

  if (reduced) {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-x-6 gap-y-2", className)}>
        {items.map((t) => (
          <MarqueeItem key={t} text={t} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("group relative overflow-hidden", className)} aria-hidden>
      {/* Fade the ends so items dissolve rather than clip. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-[linear-gradient(90deg,var(--color-navy-950),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(270deg,var(--color-navy-950),transparent)]" />
      <motion.div
        className="flex w-max items-center gap-10 group-hover:[animation-play-state:paused]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <MarqueeItem key={`${t}-${i}`} text={t} />
        ))}
      </motion.div>
    </div>
  );
}

function MarqueeItem({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-white/70">
      <span className="size-1.5 rounded-full bg-fresh-500" aria-hidden />
      {text}
    </span>
  );
}
