import Link from "next/link";
import { BarChart3, TrendingUp } from "lucide-react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

const DAYS = 14;

type Bucket = { key: string; label: string; orders: number; value: number };
type Analytics = {
  totalOrders: number;
  totalValue: number;
  avgValue: number;
  confirmedish: number;
  conversion: number;
  recentCount: number;
  recentValue: number;
  maxOrders: number;
  statusCounts: Map<string, number>;
  buckets: Bucket[];
  items: { productName: string; units: number; value: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Aggregate order analytics. Split out of the component so render stays pure. */
async function loadAnalytics(now: Date): Promise<Analytics> {
  const since = new Date(now.getTime() - DAYS * DAY_MS);

  const [byStatus, recentOrders, items, totals] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, subtotal: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.aggregate({ _sum: { subtotal: true }, _count: { _all: true } }),
  ]);

  const statusCounts = new Map(byStatus.map((s) => [s.status, s._count._all]));
  const totalOrders = totals._count._all;
  const totalValue = totals._sum.subtotal ?? 0;
  const confirmedish =
    (statusCounts.get("confirmed") ?? 0) +
    (statusCounts.get("processing") ?? 0) +
    (statusCounts.get("shipped") ?? 0) +
    (statusCounts.get("delivered") ?? 0);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const buckets: Bucket[] = Array.from({ length: DAYS }, (_, i) => {
    const day = new Date(startOfToday.getTime() - (DAYS - 1 - i) * DAY_MS);
    return {
      key: day.toISOString().slice(0, 10),
      label: `${day.getDate()}/${day.getMonth() + 1}`,
      orders: 0,
      value: 0,
    };
  });
  for (const order of recentOrders) {
    const day = new Date(order.createdAt);
    day.setHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.key === day.toISOString().slice(0, 10));
    if (bucket) {
      bucket.orders += 1;
      bucket.value += order.subtotal;
    }
  }

  return {
    totalOrders,
    totalValue,
    avgValue: totalOrders > 0 ? totalValue / totalOrders : 0,
    confirmedish,
    conversion: totalOrders > 0 ? Math.round((confirmedish / totalOrders) * 100) : 0,
    recentCount: recentOrders.length,
    recentValue: buckets.reduce((s, b) => s + b.value, 0),
    maxOrders: Math.max(1, ...buckets.map((b) => b.orders)),
    statusCounts,
    buckets,
    items: items.map((i) => ({
      productName: i.productName,
      units: i._sum.quantity ?? 0,
      value: Math.round(i._sum.lineTotal ?? 0),
    })),
  };
}

/**
 * Analytics block for the admin overview: order volume trend, status mix and
 * best-selling products. All figures come from existing order data.
 */
export async function AnalyticsPanel() {
  // The 14-day window is anchored to "now", so this must resolve at request
  // time. Without `connection()` the prerenderer reaches `new Date()` and Next
  // rejects it as an unstable value.
  await connection();
  const data = await loadAnalytics(new Date());
  const {
    totalOrders,
    totalValue,
    avgValue,
    confirmedish,
    conversion,
    recentCount,
    recentValue,
    maxOrders,
    statusCounts,
    buckets,
    items,
  } = data;

  return (
    <section aria-labelledby="analytics-heading" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 id="analytics-heading" className="inline-flex items-center gap-2 text-base font-extrabold text-navy-900">
          <BarChart3 className="size-4.5 text-fresh-700" aria-hidden />
          Analytics
        </h2>
        <span className="text-xs text-ink-mute">Last {DAYS} days</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total request value" value={formatINR(Math.round(totalValue))} hint="At MRP, all time" />
        <Metric label="Average request" value={formatINR(Math.round(avgValue))} hint="Per order request" />
        <Metric label="Confirmed+" value={String(confirmedish)} hint={`${conversion}% of all requests`} />
        <Metric
          label={`Requests (${DAYS} days)`}
          value={String(recentCount)}
          hint={`${formatINR(Math.round(recentValue))} value`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* trend */}
        <div className="min-w-0 rounded-2xl border border-navy-900/8 bg-white p-5">
          <h3 className="text-sm font-extrabold text-navy-900">Request volume</h3>
          <div
            className="mt-5 flex h-40 items-end gap-1"
            role="img"
            aria-label={`Daily order request volume for the last ${DAYS} days`}
          >
            {buckets.map((b) => (
              <div key={b.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-ink-mute opacity-0 transition-opacity group-hover:opacity-100">
                  {b.orders}
                </span>
                <div
                  className="w-full rounded-t-md bg-[linear-gradient(180deg,var(--color-fresh-500),var(--color-fresh-700))] transition-all duration-300"
                  style={{ height: `${Math.max(4, (b.orders / maxOrders) * 100)}%` }}
                  title={`${b.orders} request(s) · ${formatINR(Math.round(b.value))}`}
                />
                {/* The label must not widen the bar, so it is taken out of the
                    min-content calculation and allowed to be clipped. */}
                <span className="w-full truncate text-center text-[9px] font-semibold text-ink-mute">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* status mix */}
        <div className="min-w-0 rounded-2xl border border-navy-900/8 bg-white p-5">
          <h3 className="text-sm font-extrabold text-navy-900">Status mix</h3>
          {totalOrders === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">No order requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {ORDER_STATUSES.map((s) => {
                const count = statusCounts.get(s.value) ?? 0;
                const pct = Math.round((count / totalOrders) * 100);
                return (
                  <li key={s.value}>
                    <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
                      <span>{s.label}</span>
                      <span className="text-navy-900">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-50">
                      <div className="h-full rounded-full bg-navy-800" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* best sellers */}
      <div className="rounded-2xl border border-navy-900/8 bg-white p-5">
        <h3 className="inline-flex items-center gap-2 text-sm font-extrabold text-navy-900">
          <TrendingUp className="size-4 text-fresh-700" aria-hidden />
          Most requested products
        </h3>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-ink-mute">No order items yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-navy-900/6">
            {items.map((item) => (
              <li key={item.productName} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm font-semibold text-navy-900">{item.productName}</span>
                <span className="shrink-0 text-xs font-semibold text-ink-mute">
                  {item.units} units · {formatINR(item.value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-5">
      <p className="text-xs font-bold tracking-wide text-ink-mute uppercase">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-ink-mute">{hint}</p>
    </div>
  );
}

/** Small helper used by the overview page header links. */
export function AnalyticsLink() {
  return (
    <Link href="/admin/inventory" className="text-xs font-bold text-fresh-700 hover:underline">
      View inventory
    </Link>
  );
}
