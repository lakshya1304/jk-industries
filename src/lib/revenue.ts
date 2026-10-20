import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Revenue + demand analytics, computed entirely from the shop's own order data.
 *
 * Everything here is derived, not stored: order lines already snapshot product
 * name, SKU, pack label, quantity and money at the time of the request, so the
 * same numbers reproduce for any historical window without a separate ledger.
 *
 * "Revenue" for this shop means the value of order requests that were not
 * cancelled. Cancelled orders are excluded from money figures but still counted
 * as demand signals in the AI insights.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Statuses that represent real, expected money. */
export const EARNING_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export type RevenuePoint = { key: string; label: string; value: number; orders: number; units: number };

export type RevenueSnapshot = {
  /** Window covered by this snapshot, in days. */
  days: number;
  currency: { total: number; paid: number; pipeline: number; cancelled: number; average: number; units: number };
  /** Day-by-day series for the trend line, oldest first. */
  series: RevenuePoint[];
  /** Month-by-month series for the longer-range bars. */
  months: RevenuePoint[];
  /** Money per order status. */
  byStatus: { status: string; value: number; orders: number }[];
  /** Best products by value in the window. */
  topProducts: { productName: string; sku: string; units: number; value: number }[];
  /** Best customers by value in the window. */
  topCustomers: { name: string; mobile: string; orders: number; value: number }[];
  /** Delivery locations by value. */
  topCities: { city: string; orders: number; value: number }[];
  /** Comparison against the immediately preceding window of equal length. */
  comparison: {
    /** Current window total value. */
    current: number;
    /** Previous window total value. */
    previous: number;
    /** Percentage change, rounded. Null when the previous window had no data. */
    changePct: number | null;
  };
};

type OrderRow = {
  id: string;
  status: string;
  subtotal: number;
  itemCount: number;
  customerName: string;
  mobile: string;
  city: string;
  createdAt: Date;
  items: { productName: string; sku: string; quantity: number; lineTotal: number }[];
};

/** Start of the day, in local server time, used for daily bucketing. */
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

/**
 * Build the revenue snapshot for the trailing `days` window (plus the preceding
 * window of the same size, for the change comparison).
 */
export async function getRevenueSnapshot(now: Date, days = 30): Promise<RevenueSnapshot> {
  const windowStart = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS));
  const previousStart = startOfDay(new Date(windowStart.getTime() - days * DAY_MS));
  const monthsBack = 6;
  const monthsStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1));

  const earliest = previousStart < monthsStart ? previousStart : monthsStart;

  const orders = (await prisma.order.findMany({
    where: { createdAt: { gte: earliest } },
    select: {
      id: true,
      status: true,
      subtotal: true,
      itemCount: true,
      customerName: true,
      mobile: true,
      city: true,
      createdAt: true,
      items: { select: { productName: true, sku: true, quantity: true, lineTotal: true } },
    },
  })) as OrderRow[];

  const inWindow = orders.filter((o) => o.createdAt >= windowStart);
  const earning = inWindow.filter((o) => o.status !== "cancelled");
  const cancelled = inWindow.filter((o) => o.status === "cancelled");

  const total = earning.reduce((s, o) => s + o.subtotal, 0);
  const pipeline = earning
    .filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "processing")
    .reduce((s, o) => s + o.subtotal, 0);
  const paid = earning.filter((o) => o.status === "shipped" || o.status === "delivered").reduce((s, o) => s + o.subtotal, 0);
  const units = earning.reduce((s, o) => s + o.itemCount, 0);

  // ---- daily series (fill empty days so the line has no gaps) ----------
  const dayMap = new Map<string, RevenuePoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(windowStart.getTime() + i * DAY_MS);
    dayMap.set(dayKey(d), { key: dayKey(d), label: shortLabel(d), value: 0, orders: 0, units: 0 });
  }
  for (const o of earning) {
    const point = dayMap.get(dayKey(o.createdAt));
    if (!point) continue;
    point.value += o.subtotal;
    point.orders += 1;
    point.units += o.itemCount;
  }
  const series = [...dayMap.values()];

  // ---- monthly series --------------------------------------------------
  const monthMap = new Map<string, RevenuePoint>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1) + i, 1);
    monthMap.set(monthKey(d), { key: monthKey(d), label: monthLabel(d), value: 0, orders: 0, units: 0 });
  }
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const point = monthMap.get(monthKey(o.createdAt));
    if (!point) continue;
    point.value += o.subtotal;
    point.orders += 1;
    point.units += o.itemCount;
  }
  const months = [...monthMap.values()];

  // ---- per status ------------------------------------------------------
  const statusMap = new Map<string, { status: string; value: number; orders: number }>();
  for (const o of inWindow) {
    const entry = statusMap.get(o.status) ?? { status: o.status, value: 0, orders: 0 };
    entry.value += o.subtotal;
    entry.orders += 1;
    statusMap.set(o.status, entry);
  }

  // ---- top products / customers / cities -------------------------------
  const productMap = new Map<string, { productName: string; sku: string; units: number; value: number }>();
  for (const o of earning) {
    for (const it of o.items) {
      const entry = productMap.get(it.productName) ?? {
        productName: it.productName,
        sku: it.sku,
        units: 0,
        value: 0,
      };
      entry.units += it.quantity;
      entry.value += it.lineTotal;
      productMap.set(it.productName, entry);
    }
  }

  const customerMap = new Map<string, { name: string; mobile: string; orders: number; value: number }>();
  for (const o of earning) {
    const entry = customerMap.get(o.mobile) ?? { name: o.customerName, mobile: o.mobile, orders: 0, value: 0 };
    entry.orders += 1;
    entry.value += o.subtotal;
    entry.name = o.customerName;
    customerMap.set(o.mobile, entry);
  }

  const cityMap = new Map<string, { city: string; orders: number; value: number }>();
  for (const o of earning) {
    const key = o.city.trim() || "Unknown";
    const entry = cityMap.get(key) ?? { city: key, orders: 0, value: 0 };
    entry.orders += 1;
    entry.value += o.subtotal;
    cityMap.set(key, entry);
  }

  // ---- comparison with the previous window -----------------------------
  const previous = orders
    .filter((o) => o.createdAt >= previousStart && o.createdAt < windowStart && o.status !== "cancelled")
    .reduce((s, o) => s + o.subtotal, 0);

  return {
    days,
    currency: {
      total,
      paid,
      pipeline,
      cancelled: cancelled.reduce((s, o) => s + o.subtotal, 0),
      average: earning.length > 0 ? total / earning.length : 0,
      units,
    },
    series,
    months,
    byStatus: [...statusMap.values()].sort((a, b) => b.value - a.value),
    topProducts: [...productMap.values()].sort((a, b) => b.value - a.value).slice(0, 8),
    topCustomers: [...customerMap.values()].sort((a, b) => b.value - a.value).slice(0, 8),
    topCities: [...cityMap.values()].sort((a, b) => b.value - a.value).slice(0, 8),
    comparison: {
      current: total,
      previous,
      changePct: previous > 0 ? Math.round(((total - previous) / previous) * 100) : null,
    },
  };
}
