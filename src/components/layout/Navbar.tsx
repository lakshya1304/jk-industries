"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({
  brandName,
  manufacturerName,
  whatsappNumber,
}: {
  brandName: string;
  manufacturerName: string;
  whatsappNumber: string;
}) {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile menu closes on link click below (see mobile links), so no
  // pathname-driven effect is needed here.

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const onHome = pathname === "/";
  const overHero = onHome && !scrolled && !mobileOpen;
  const whatsappHref = waLink(whatsappNumber, generalEnquiryMessage(brandName));

  return (
    <motion.header
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        overHero
          ? "bg-transparent"
          : "glass shadow-[0_1px_0_rgba(11,31,58,0.08)]"
      )}
    >
      <nav
        aria-label="Main"
        className="container-page flex h-16 items-center justify-between gap-4 md:h-18"
      >
        <Link
          href="/"
          className="rounded-lg"
          aria-label={`${brandName} home`}
        >
          <BrandLogo
            brandName={brandName}
            manufacturerName={manufacturerName}
            tone={overHero ? "light" : "dark"}
          />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "nav-link group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                    active && "is-active",
                    overHero
                      ? "text-white/85 hover:text-white"
                      : "text-navy-900/70 hover:text-navy-900",
                    active && (overHero ? "text-white" : "text-navy-900")
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-4 bottom-1 h-0.5 origin-left rounded-full bg-fresh-500 transition-transform duration-300 ease-[var(--ease-out-soft)]",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          <ButtonLike
            href={whatsappHref}
            className={cn(
              "hidden lg:inline-flex",
              overHero
                ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                : ""
            )}
            variant={overHero ? "custom" : "outline"}
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </ButtonLike>

          <ThemeToggle className={overHero ? "[&>button]:text-white [&>button:hover]:bg-white/10" : undefined} />

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className={cn(
              "relative grid size-10 place-items-center rounded-full transition-colors duration-200",
              overHero
                ? "text-white hover:bg-white/10"
                : "text-navy-900 hover:bg-navy-900/5"
            )}
          >
            <ShoppingBag className="size-5" aria-hidden />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-fresh-600 px-1 py-0.5 text-[10px] font-bold text-white"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={cn(
              "grid size-10 place-items-center rounded-full transition-colors md:hidden",
              overHero || mobileOpen
                ? "text-white hover:bg-white/10"
                : "text-navy-900 hover:bg-navy-900/5"
            )}
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-navy-900 md:hidden"
          >
            <ul className="container-page space-y-1 py-5">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.08, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-lg font-bold transition-colors",
                      pathname === link.href
                        ? "bg-white/10 text-white"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                className="flex items-center justify-between rounded-xl px-4 py-3"
              >
                <span className="text-sm font-bold text-white/60">Appearance</span>
                <ThemeToggle variant="inline" className="border-white/15 bg-white/5 [&_button]:text-white/80" />
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32, duration: 0.35 }}
                className="pt-3"
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-[#062b17]"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Enquire on WhatsApp
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/** Small wrapper so the ghost WhatsApp button can sit over the dark hero. */
function ButtonLike({
  href,
  className,
  variant,
  children,
}: {
  href: string;
  className?: string;
  variant: "outline" | "custom";
  children: React.ReactNode;
}) {
  if (variant === "custom") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors duration-200",
          className
        )}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-navy-900/20 bg-white px-5 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50",
        className
      )}
    >
      {children}
    </a>
  );
}
