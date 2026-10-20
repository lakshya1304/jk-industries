"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Counts a number up when it scrolls into view.
 *
 * State is only written from the animation callback (never synchronously in the
 * effect body), so this does not trigger a cascading render on mount. Reduced
 * motion users, and anyone without JavaScript, simply see the final value —
 * which is what the server rendered in the first place.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 1.1,
  className,
}: {
  value: number;
  /** Optional formatter; defaults to a grouped integer. */
  format?: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  const current = shown ?? value;
  const text = format ? format(current) : Math.round(current).toLocaleString("en-IN");

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
