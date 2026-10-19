"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "whatsapp" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight whitespace-nowrap " +
  "transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-[var(--ease-out-soft)] " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-600";

const variants: Record<Variant, string> = {
  primary:
    "bg-navy-900 text-white shadow-[0_10px_24px_-12px_rgba(11,31,58,0.6)] hover:bg-navy-800 hover:shadow-[0_14px_30px_-12px_rgba(11,31,58,0.65)]",
  accent:
    "bg-fresh-600 text-white shadow-[0_10px_24px_-12px_rgba(22,163,74,0.6)] hover:bg-fresh-700",
  outline:
    "border border-navy-900/20 bg-white text-navy-900 hover:border-navy-900/40 hover:bg-navy-50",
  ghost: "text-navy-900 hover:bg-navy-900/5",
  whatsapp:
    "bg-[#25D366] text-[#062b17] shadow-[0_10px_24px_-12px_rgba(37,211,102,0.7)] hover:bg-[#1fbb59]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-7 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", href, external, children, ...props },
  ref
) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} {...props}>
      {children}
    </button>
  );
});
