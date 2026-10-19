"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

/** Animated success check for the order confirmation screen. */
export function ConfirmationAnimation() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mx-auto grid size-24 place-items-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-fresh-600/12"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={reduced ? {} : { scale: [0.6, 1.25, 1], opacity: [0, 0.9, 0.55] }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="absolute inset-2 rounded-full bg-fresh-600/20"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={reduced ? {} : { scale: [0.7, 1.2, 1], opacity: [0, 0.8, 0.45] }}
        transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        className="relative grid size-16 place-items-center rounded-full bg-fresh-600 text-white shadow-[0_18px_40px_-16px_rgba(22,163,74,0.9)]"
        initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
      >
        <motion.span
          initial={reduced ? {} : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          <Check className="size-7" strokeWidth={3} aria-hidden />
        </motion.span>
      </motion.span>
    </div>
  );
}
