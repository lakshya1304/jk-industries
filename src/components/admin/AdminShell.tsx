"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertBell } from "@/components/admin/AlertBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function titleFor(pathname: string) {
  const match = [...NAV].reverse().find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));
  if (!match) return "Admin";
  if (match.href === "/admin/products" && pathname.includes("/new")) return "Add product";
  if (match.href === "/admin/products" && /\/admin\/products\/.+/.test(pathname)) return "Edit product";
  if (match.href === "/admin/orders" && /\/admin\/orders\/.+/.test(pathname)) return "Order details";
  return match.label;
}

export function AdminShell({
  session,
  children,
}: {
  session: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navLinks = (
    <nav className="space-y-1" aria-label="Admin sections">
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-white/10 text-white" : "text-navy-100/75 hover:bg-white/5 hover:text-white"
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3 px-1.5 pt-1">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/jk-mark.svg" alt="JK Industries" className="size-full" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold text-white">JK Industries</span>
            <span className="block text-[11px] font-medium text-navy-100/60">Admin dashboard</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-navy-100/70 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {navLinks}

      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-navy-100/75 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-4.5" aria-hidden />
          View website
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-navy-100/75 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
        >
          <LogOut className="size-4.5" aria-hidden />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col bg-surface lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-66 shrink-0 bg-navy-900 lg:block">{sidebarInner}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-navy-900 lg:hidden"
              role="dialog"
              aria-label="Admin menu"
            >
              {sidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-900/8 bg-white/85 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-navy-900 hover:bg-navy-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-navy-900 lg:text-base">
              {titleFor(pathname)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <AlertBell />
            <span className="mx-1 hidden h-8 w-px bg-navy-900/10 sm:block" aria-hidden />
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-xs font-bold text-navy-900">{session.name}</span>
              <span className="block text-[11px] text-ink-mute">{session.email}</span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">
              {session.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
