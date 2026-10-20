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

/**
 * Props accepted by {@link Button}.
 *
 * Anchored at the anchor element rather than the button element so the same
 * attributes can be forwarded to `<a>`, `<Link>` and `<button>` without a cast.
 * The only button-only attributes anyone would pass here (`type`, `disabled`)
 * are re-declared where they are actually meaningful. Spreading a
 * `ButtonHTMLAttributes` object onto an `<a>` is what produced the type error
 * that blocked `onClick` from being forwarded in the first place.
 */
export type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  /** Only meaningful for the `<button>` branch. */
  type?: "button" | "submit" | "reset";
  /** Only meaningful for the `<button>` branch. */
  disabled?: boolean;
};

/**
 * Shared button. Renders an `<a>`, a Next `<Link>` or a `<button>` depending on
 * whether `href` is supplied.
 *
 * `onClick` is forwarded to the link branches as well as the button branch.
 * Leaving it off was a real bug: the cart drawer's "Proceed to Order Request"
 * passes both `href="/cart"` and `onClick={closeDrawer}`, so the navigation ran
 * but the drawer never closed and stayed open over the cart page. Callers should
 * be able to attach a side effect to a navigational button.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", href, external, children, ...props },
  ref
) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    /*
      The props carry anchor-typed handlers (see `ButtonProps`), which are
      structurally incompatible with the button element's own handler types.
      Narrowing to the button's attribute shape for the remaining props keeps
      this branch honest at compile time; every attribute callers actually use
      on a non-link Button (onClick, aria-*, data-*, title…) is present in both
      element scopes, so nothing is lost at runtime.
    */
    <button
      ref={ref}
      className={cls}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});
