"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-driven 3D tilt wrapper.
 *
 * Adds a subtle perspective rotation that follows the cursor, giving cards a
 * tactile "depth" feel without WebGL. Automatically disabled for people who
 * prefer reduced motion and on coarse (touch) pointers, where tilt would fight
 * the scroll gesture.
 */
export function Tilt({
  children,
  className,
  max = 9,
  scale = 1.012,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const sx = useSpring(px, { stiffness: 180, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 180, damping: 20, mass: 0.4 });

  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      whileHover={reduced ? undefined : { scale }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "[transform-style:preserve-3d] will-change-transform",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
