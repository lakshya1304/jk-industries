"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Thin progress bar pinned under the header showing how far down the page the
 * reader has scrolled. Purely decorative, so it is hidden from assistive tech and
 * the spring keeps it from jittering on trackpads.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 220, damping: 34, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width }}
      className="fixed top-0 left-0 z-[60] h-0.5 w-full origin-left bg-[linear-gradient(90deg,var(--color-fresh-500),var(--color-fresh-700),var(--color-navy-600))] print:hidden"
    />
  );
}
