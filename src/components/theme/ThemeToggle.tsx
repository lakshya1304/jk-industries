"use client";

import { AnimatePresence, motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeChoice } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Theme switch (Light · Dark · System). `variant="button"` renders a compact
 * dropdown for the navbar; `variant="inline"` renders segmented buttons for
 * settings-style panels.
 */
export function ThemeToggle({
  variant = "button",
  className,
}: {
  variant?: "button" | "inline";
  className?: string;
}) {
  const { theme, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Before mount the stored theme is unknown on the server, so the label and
  // icon are kept theme-neutral to avoid a hydration mismatch.
  const activeTheme: ThemeChoice = mounted ? theme : "system";
  const Icon = !mounted ? Monitor : resolved === "dark" ? Moon : Sun;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (variant === "inline") {
    return (
      <div className={cn("inline-flex rounded-full border border-navy-900/12 bg-navy-50/60 p-1", className)} role="group" aria-label="Colour theme">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={activeTheme === opt.value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              activeTheme === opt.value
                ? "bg-navy-900 text-white shadow-sm"
                : "text-ink-soft hover:text-navy-900"
            )}
          >
            <opt.icon className="size-3.5" aria-hidden />
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Colour theme: ${activeTheme}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-full text-navy-900 transition-colors hover:bg-navy-900/5"
      >
        <Icon className="size-5" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-navy-900/10 bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(11,31,58,0.45)]"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={activeTheme === opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  activeTheme === opt.value
                    ? "bg-navy-50 text-navy-900"
                    : "text-ink-soft hover:bg-navy-50/60 hover:text-navy-900"
                )}
              >
                <opt.icon className="size-4" aria-hidden />
                {opt.label}
                {activeTheme === opt.value && <span className="ml-auto text-fresh-600">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
