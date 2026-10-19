"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Responsive grid with staggered scroll-triggered card entrances.
 * Children should carry their own key handling (e.g. ProductCard articles).
 */
export function StaggeredGrid({
  children,
  className,
  columns = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={["grid gap-5 sm:gap-6", columns, className].filter(Boolean).join(" ")}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: delay } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 26 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="h-full"
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
