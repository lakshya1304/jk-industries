"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellRing, MessageSquare, PackageX, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AlertPayload = {
  counts: { pendingOrders: number; newEnquiries: number; lowStock: number; total: number };
  lowStock: { id: string; productName: string; label: string; stock: number }[];
};

const POLL_MS = 30_000;

/**
 * Admin alert bell. Polls /api/admin/alerts, shows a badge, and can raise a
 * desktop notification (with permission) when new orders arrive.
 */
function readSoundPref() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("sc-alert-sound") === "1";
  } catch {
    return false;
  }
}

function readNotifyEnabled() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

export function AlertBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AlertPayload | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(readNotifyEnabled);
  const [soundEnabled, setSoundEnabled] = useState(readSoundPref);
  const prevPending = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/alerts", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as AlertPayload;
      setData(json);

      // Desktop notification when the pending count grows (new order request).
      const pending = json.counts.pendingOrders;
      if (prevPending.current != null && pending > prevPending.current) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New order request", {
            body: `${pending} request${pending === 1 ? "" : "s"} awaiting confirmation.`,
            icon: "/icon.svg",
          });
        }
        if (soundEnabled) ping();
      }
      prevPending.current = pending;
    } catch {
      /* offline — try again on the next tick */
    }
  }, [soundEnabled]);

  // Polling is an external-system subscription: the initial fetch runs on a
  // timer tick rather than synchronously in the effect body.
  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotifyEnabled(permission === "granted");
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("sc-alert-sound", next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) ping();
  }

  const total = data?.counts.total ?? 0;

  const items = [
    {
      href: "/admin/orders",
      icon: ShoppingBag,
      label: "Pending order requests",
      value: data?.counts.pendingOrders ?? 0,
    },
    {
      href: "/admin/enquiries",
      icon: MessageSquare,
      label: "New enquiries",
      value: data?.counts.newEnquiries ?? 0,
    },
    {
      href: "/admin/inventory",
      icon: PackageX,
      label: "Low / out of stock packs",
      value: data?.counts.lowStock ?? 0,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alerts${total > 0 ? `, ${total} active` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-full text-navy-900 transition-colors hover:bg-navy-900/5"
      >
        {total > 0 ? <BellRing className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-[0_24px_50px_-24px_rgba(11,31,58,0.45)]"
          >
            <p className="border-b border-navy-900/8 px-4 py-3 text-sm font-extrabold text-navy-900">
              Alerts
            </p>
            <ul className="p-1.5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-navy-50"
                  >
                    <item.icon className="size-4 shrink-0 text-ink-mute" aria-hidden />
                    <span className="flex-1 text-ink-soft">{item.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        item.value > 0 ? "bg-red-50 text-red-600" : "bg-navy-50 text-ink-mute"
                      )}
                    >
                      {item.value}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {data && data.lowStock.length > 0 && (
              <div className="border-t border-navy-900/8 px-4 py-3">
                <p className="text-[11px] font-bold tracking-wide text-ink-mute uppercase">
                  Low stock
                </p>
                <ul className="mt-2 space-y-1.5">
                  {data.lowStock.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2 text-xs">
                      <span className="truncate text-ink-soft">
                        {p.productName} · {p.label}
                      </span>
                      <span className={cn("shrink-0 font-bold", p.stock === 0 ? "text-red-600" : "text-amber-700")}>
                        {p.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1 border-t border-navy-900/8 p-1.5">
              <button
                type="button"
                onClick={enableNotifications}
                disabled={notifyEnabled}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-navy-50 disabled:opacity-60"
              >
                Desktop notifications
                <span className="text-xs font-bold text-fresh-700">
                  {notifyEnabled ? "On" : "Enable"}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-navy-50"
              >
                Alert sound
                <span className="text-xs font-bold text-fresh-700">{soundEnabled ? "On" : "Off"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Short two-tone beep via Web Audio (no asset needed). */
function ping() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio blocked — ignore */
  }
}
