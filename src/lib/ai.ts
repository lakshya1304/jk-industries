import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Insight engine.
 *
 * Everything here is computed from the shop's own order history — no external
 * AI service, no API key, no data leaving the server. The techniques are the
 * ones that actually pay off for a catalogue of this size:
 *
 *   - moving-average demand forecast per product (with a trend direction)
 *   - days-of-cover projection from current stock
 *   - restock priority scoring (urgency × value at risk)
 *   - z-score anomaly detection on daily order value
 *   - simple linear trend for the revenue outlook
 *   - customer segmentation (repeat / one-off, by value)
 *   - plain-English observations assembled from the numbers above
 *
 * Every number includes its basis so the reader can audit it, and nothing is
 * phrased as a guarantee.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type Insight = {
  id: string;
  /** higher = more urgent */
  priority: number;
  tone: "danger" | "warning" | "success" | "info";
  category: "stock" | "demand" | "revenue" | "customers" | "quality";
  title: string;
  detail: string;
  /** Optional suggested action rendered as a sentence. */
  action?: string;
};

export type ForecastRow = {
  productName: string;
  sku: string;
  /** Units sold across the lookback window. */
  units: number;
  /** Average units per day over the lookback window. */
  dailyRate: number;
  /** Forecast units for the next `horizonDays`. */
  forecast: number;
  /** Current tracked stock across packs (null when nothing is tracked). */
  stock: number | null;
  /** Days until stock runs out at the current rate (null when unknown/infinite). */
  daysOfCover: number | null;
  /** "up" | "down" | "flat" — recent vs earlier half of the window. */
  trend: "up" | "down" | "flat";
  /** Restock urgency score; higher means fix sooner. */
  priority: number;
};

export type AnomalyRow = {
  date: string;
  label: string;
  value: number;
  /** Standard deviations from the mean. */
  z: number;
  direction: "spike" | "drop";
};

export type AiReport = {
  generatedAt: string;
  lookbackDays: number;
  horizonDays: number;
  totals: {
    orders: number;
    units: number;
    value: number;
    cancelled: number;
    cancelRate: number;
    repeatCustomers: number;
    uniqueCustomers: number;
    repeatRate: number;
  };
  trend: {
    /** Least-squares slope per day, in rupees. */
    slopePerDay: number;
    direction: "growing" | "declining" | "steady";
    /** Projected value for the next `horizonDays`, from the fitted line. */
    projected: number;
  };
  forecasts: ForecastRow[];
  anomalies: AnomalyRow[];
  insights: Insight[];
  /** Deterministic summary sentences built from the figures above. */
  summary: string[];
};

type Item = { productName: string; sku: string; quantity: number; lineTotal: number };

/** Least-squares linear fit; returns slope and intercept for y = a + b·x. */
function linearFit(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function mean(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length);
}

/**
 * Build the full AI report. `now` is injected so the caller controls the clock
 * and the function stays deterministic for a given dataset + time.
 */
export async function getAiReport(now: Date, lookbackDays = 30, horizonDays = 14): Promise<AiReport> {
  const since = new Date(now.getTime() - lookbackDays * DAY_MS);

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        subtotal: true,
        itemCount: true,
        mobile: true,
        customerName: true,
        createdAt: true,
        items: { select: { productName: true, sku: true, quantity: true, lineTotal: true } },
      },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        name: true,
        sku: true,
        packSizes: { select: { stock: true } },
      },
    }),
  ]);

  const earning = orders.filter((o) => o.status !== "cancelled");
  const cancelledCount = orders.length - earning.length;

  // ---------- totals ----------
  const units = earning.reduce((s, o) => s + o.itemCount, 0);
  const value = earning.reduce((s, o) => s + o.subtotal, 0);

  const perCustomer = new Map<string, number>();
  for (const o of earning) perCustomer.set(o.mobile, (perCustomer.get(o.mobile) ?? 0) + 1);
  const uniqueCustomers = perCustomer.size;
  const repeatCustomers = [...perCustomer.values()].filter((c) => c > 1).length;

  // ---------- daily series + trend ----------
  const dayMap = new Map<string, number>();
  for (let i = 0; i < lookbackDays; i++) {
    const d = new Date(now.getTime() - (lookbackDays - 1 - i) * DAY_MS);
    d.setHours(0, 0, 0, 0);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of earning) {
    const k = new Date(o.createdAt).toISOString().slice(0, 10);
    if (dayMap.has(k)) dayMap.set(k, (dayMap.get(k) ?? 0) + o.subtotal);
  }
  const dailyValues = [...dayMap.values()];
  const dailySeries = [...dayMap.entries()].map(([date, v], i) => ({ x: i, y: v, date }));

  const fit = linearFit(dailySeries.map((d) => ({ x: d.x, y: d.y })));
  const direction: AiReport["trend"]["direction"] =
    fit.slope > mean(dailyValues) * 0.05
      ? "growing"
      : fit.slope < -mean(dailyValues) * 0.05
        ? "declining"
        : "steady";
  const projected = Math.max(
    0,
    Math.round(fit.intercept * horizonDays + fit.slope * ((lookbackDays + horizonDays) * horizonDays) / 2)
  );

  // ---------- anomalies (z-score on daily value) ----------
  const m = mean(dailyValues);
  const sd = stdDev(dailyValues);
  const anomalies: AnomalyRow[] = [];
  if (sd > 0) {
    for (const d of dailySeries) {
      const z = (d.y - m) / sd;
      if (Math.abs(z) >= 2) {
        anomalies.push({
          date: d.date,
          label: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          value: Math.round(d.y),
          z: Math.round(z * 10) / 10,
          direction: z > 0 ? "spike" : "drop",
        });
      }
    }
  }
  anomalies.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

  // ---------- per-product demand + stock cover ----------
  const productAgg = new Map<string, { sku: string; units: number; byHalf: [number, number]; recentUnits: number }>();
  const halfMs = (lookbackDays / 2) * DAY_MS;
  const midPoint = new Date(now.getTime() - halfMs);

  for (const o of earning) {
    const isRecent = o.createdAt >= midPoint;
    for (const it of o.items as Item[]) {
      const entry =
        productAgg.get(it.productName) ?? { sku: it.sku, units: 0, byHalf: [0, 0], recentUnits: 0 };
      entry.units += it.quantity;
      entry.byHalf[isRecent ? 1 : 0] += it.quantity;
      if (isRecent) entry.recentUnits += it.quantity;
      productAgg.set(it.productName, entry);
    }
  }

  const stockByProduct = new Map<string, number | null>();
  for (const p of products) {
    const tracked = p.packSizes.filter((ps) => ps.stock != null);
    stockByProduct.set(
      p.name,
      tracked.length === 0 ? null : tracked.reduce((s, ps) => s + (ps.stock as number), 0)
    );
  }

  const forecasts: ForecastRow[] = [...productAgg.entries()]
    .map(([productName, agg]) => {
      const dailyRate = agg.units / lookbackDays;
      const forecast = Math.ceil(dailyRate * horizonDays);
      const stock = stockByProduct.get(productName) ?? null;
      const daysOfCover = stock != null && dailyRate > 0 ? Math.floor(stock / dailyRate) : stock != null ? null : null;
      const [earlier, recent] = agg.byHalf;
      const trend: ForecastRow["trend"] =
        recent > earlier * 1.2 ? "up" : recent < earlier * 0.8 ? "down" : "flat";

      // Urgency: cover inside the horizon is urgent; an upward trend raises it.
      let priority = 0;
      if (stock != null) {
        if (stock === 0) priority = 100;
        else if (daysOfCover != null) priority = Math.max(0, 100 - daysOfCover * 3);
      }
      if (trend === "up") priority += 10;
      if (forecast > 0 && (stock ?? 0) < forecast) priority += 15;

      return {
        productName,
        sku: agg.sku,
        units: agg.units,
        dailyRate: Math.round(dailyRate * 100) / 100,
        forecast,
        stock,
        daysOfCover,
        trend,
        priority: Math.round(priority),
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // ---------- assemble plain-English insights ----------
  const insights: Insight[] = [];

  for (const f of forecasts.filter((x) => x.priority >= 60).slice(0, 4)) {
    const cover =
      f.stock === 0
        ? "is already out of stock"
        : f.daysOfCover != null
          ? `has about ${f.daysOfCover} day${f.daysOfCover === 1 ? "" : "s"} of cover left`
          : "is running low";
    insights.push({
      id: `stock-${f.sku}`,
      priority: f.priority,
      tone: f.stock === 0 ? "danger" : "warning",
      category: "stock",
      title: `${f.productName} needs restocking`,
      detail: `${f.productName} ${cover}. It sold ${f.units} unit${f.units === 1 ? "" : "s"} in the last ${lookbackDays} days (~${f.dailyRate}/day).`,
      action: `Aim for at least ${Math.max(f.forecast, 10)} units to cover the next ${horizonDays} days.`,
    });
  }

  for (const f of forecasts.filter((x) => x.trend === "up" && x.units >= 5).slice(0, 3)) {
    insights.push({
      id: `demand-${f.sku}`,
      priority: 55,
      tone: "info",
      category: "demand",
      title: `${f.productName} demand is climbing`,
      detail: `Orders picked up in the second half of the ${lookbackDays}-day window. At the current pace expect roughly ${f.forecast} units over the next ${horizonDays} days.`,
      action: "Consider keeping a deeper buffer of this line.",
    });
  }

  if (anomalies.length > 0) {
    const worst = anomalies[0];
    insights.push({
      id: "anomaly-daily",
      priority: 70,
      tone: worst.direction === "spike" ? "success" : "warning",
      category: "revenue",
      title: worst.direction === "spike" ? "Unusually strong day" : "Unusually quiet day",
      detail: `${worst.label} recorded ₹${worst.value.toLocaleString("en-IN")} of order value — ${Math.abs(worst.z)} standard deviations ${worst.direction === "spike" ? "above" : "below"} the daily average.`,
      action: worst.direction === "spike" ? "Worth noting what drove it." : "Check whether any enquiries went unanswered.",
    });
  }

  if (direction !== "steady") {
    insights.push({
      id: "trend-outlook",
      priority: 50,
      tone: direction === "growing" ? "success" : "warning",
      category: "revenue",
      title: direction === "growing" ? "Revenue trend is upward" : "Revenue trend is easing",
      detail: `Order value has been ${direction === "growing" ? "rising" : "falling"} by roughly ₹${Math.abs(Math.round(fit.slope)).toLocaleString("en-IN")} per day over the last ${lookbackDays} days.`,
      action: `Fitted outlook for the next ${horizonDays} days is about ₹${projected.toLocaleString("en-IN")}.`,
    });
  }

  if (uniqueCustomers > 0) {
    const rate = Math.round((repeatCustomers / uniqueCustomers) * 100);
    if (rate >= 25) {
      insights.push({
        id: "customers-repeat",
        priority: 45,
        tone: "success",
        category: "customers",
        title: `${rate}% of customers ordered more than once`,
        detail: `${repeatCustomers} of ${uniqueCustomers} customers placed repeat order requests in this window.`,
      });
    } else if (uniqueCustomers >= 5) {
      insights.push({
        id: "customers-repeat",
        priority: 45,
        tone: "info",
        category: "customers",
        title: "Most customers are ordering once",
        detail: `Only ${repeatCustomers} of ${uniqueCustomers} customers came back in this window (${rate}%).`,
        action: "A follow-up message after delivery is the cheapest way to lift this.",
      });
    }
  }

  const cancelRate = orders.length > 0 ? cancelledCount / orders.length : 0;
  if (cancelRate >= 0.15 && cancelledCount >= 2) {
    insights.push({
      id: "quality-cancellations",
      priority: 65,
      tone: "warning",
      category: "quality",
      title: "Cancellation rate is high",
      detail: `${cancelledCount} of ${orders.length} order requests (${Math.round(cancelRate * 100)}%) were cancelled in this window.`,
      action: "Confirming stock and pricing earlier usually reduces these.",
    });
  }

  insights.sort((a, b) => b.priority - a.priority);

  const summary: string[] = [
    `${orders.length} order request${orders.length === 1 ? "" : "s"} worth ₹${Math.round(value).toLocaleString("en-IN")} arrived in the last ${lookbackDays} days (${units} units).`,
    direction === "growing"
      ? `The daily order value is trending up by about ₹${Math.abs(Math.round(fit.slope)).toLocaleString("en-IN")} per day.`
      : direction === "declining"
        ? `The daily order value is trending down by about ₹${Math.abs(Math.round(fit.slope)).toLocaleString("en-IN")} per day.`
        : "Daily order value is broadly steady.",
    forecasts.filter((f) => f.priority >= 60).length > 0
      ? `${forecasts.filter((f) => f.priority >= 60).length} product${forecasts.filter((f) => f.priority >= 60).length === 1 ? "" : "s"} need restocking attention.`
      : "No product is critically short on stock right now.",
    uniqueCustomers > 0
      ? `${repeatCustomers} of ${uniqueCustomers} customers placed repeat order requests.`
      : "No customers recorded in this window yet.",
  ];

  return {
    generatedAt: now.toISOString(),
    lookbackDays,
    horizonDays,
    totals: {
      orders: orders.length,
      units,
      value,
      cancelled: cancelledCount,
      cancelRate: Math.round(cancelRate * 1000) / 10,
      repeatCustomers,
      uniqueCustomers,
      repeatRate: uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 1000) / 10 : 0,
    },
    trend: {
      slopePerDay: Math.round(fit.slope),
      direction,
      projected,
    },
    forecasts,
    anomalies: anomalies.slice(0, 6),
    insights,
    summary,
  };
}
