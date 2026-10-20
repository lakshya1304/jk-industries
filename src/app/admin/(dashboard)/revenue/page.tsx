import { Suspense } from "react";
import Link from "next/link";
import { Boxes, IndianRupee, PackageCheck, Receipt, TrendingDown, TrendingUp, Users } from "lucide-react";
import { getRevenueSnapshot, EARNING_STATUSES } from "@/lib/revenue";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/admin/StatCard";
import { RangeSwitcher } from "@/components/admin/RangeSwitcher";
import { AreaChart, BarChart, DonutChart, RankBars } from "@/components/admin/charts";

export const metadata = { title: "Revenue" };

// Revenue always reflects the live order table, so block instead of prerendering.
export const instant = false;

type SearchParams = Promise<{ range?: string }>;

const ALLOWED_RANGES = new Set(["7", "30", "90", "365"]);

export default function AdminRevenuePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Revenue</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Order-request value by period, status, product and customer. Cancelled requests are
            excluded from money figures.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-72 rounded-full" />}>
          <RangePicker searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<RevenueSkeleton />}>
        <RevenueContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RangePicker({ searchParams }: { searchParams: SearchParams }) {
  const { range = "30" } = await searchParams;
  return <RangeSwitcher current={ALLOWED_RANGES.has(range) ? range : "30"} />;
}

async function RevenueContent({ searchParams }: { searchParams: SearchParams }) {
  const { range = "30" } = await searchParams;
  const days = ALLOWED_RANGES.has(range) ? Number(range) : 30;

  const snap = await getRevenueSnapshot(new Date(), days);
  const { currency, comparison } = snap;

  const statusSlices = EARNING_STATUSES.map((s, i) => {
    const entry = snap.byStatus.find((x) => x.status === s);
    const palette: Record<string, string> = {
      pending: "#f59e0b",
      confirmed: "#3b82f6",
      processing: "#8b5cf6",
      shipped: "#06b6d4",
      delivered: "var(--color-fresh-600)",
    };
    return { label: ORDER_STATUS_LABELS[s] ?? s, value: entry?.value ?? 0, color: palette[s] ?? "#64748b", i };
  }).filter((s) => s.value > 0);

  return (
    <>
      {/* ---------- headline metrics ---------- */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Revenue · ${days}d`}
          value={formatINR(Math.round(currency.total))}
          hint={`${currency.units} units across ${snap.series.reduce((s, p) => s + p.orders, 0)} requests`}
          icon={IndianRupee}
          tone="success"
          trend={{ delta: comparison.changePct, label: "vs prev." }}
        />
        <StatCard
          label="Average request"
          value={formatINR(Math.round(currency.average))}
          hint="Mean value per non-cancelled request"
          icon={Receipt}
        />
        <StatCard
          label="In progress"
          value={formatINR(Math.round(currency.pipeline))}
          hint="Pending, confirmed or processing"
          icon={Boxes}
          tone="warning"
        />
        <StatCard
          label="Fulfilled"
          value={formatINR(Math.round(currency.paid))}
          hint="Shipped or delivered"
          icon={PackageCheck}
          tone="navy"
        />
      </div>

      {/* ---------- trend + split ---------- */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-navy-900">Daily revenue</h2>
              <p className="mt-1 text-xs text-ink-mute">Order-request value per day over the selected range.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft">
              {snap.comparison.changePct === null ? (
                <span className="text-ink-mute">No prior period to compare</span>
              ) : snap.comparison.changePct >= 0 ? (
                <span className="inline-flex items-center gap-1 text-fresh-700">
                  <TrendingUp className="size-3.5" aria-hidden /> {snap.comparison.changePct}% vs previous {days}d
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <TrendingDown className="size-3.5" aria-hidden /> {Math.abs(snap.comparison.changePct)}% vs previous {days}d
                </span>
              )}
            </span>
          </div>
          <div className="mt-5 text-navy-900">
            <AreaChart points={snap.series} label="Daily revenue" />
          </div>
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Where the money sits</h2>
          <p className="mt-1 text-xs text-ink-mute">Split of non-cancelled value by order status.</p>
          <div className="mt-5 text-navy-900">
            {statusSlices.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-mute">No orders in this range.</p>
            ) : (
              <DonutChart
                slices={statusSlices}
                centerLabel="total value"
                centerValue={formatINR(Math.round(currency.total))}
              />
            )}
          </div>
          {currency.cancelled > 0 && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {formatINR(Math.round(currency.cancelled))} of requests were cancelled and excluded.
            </p>
          )}
        </section>
      </div>

      {/* ---------- monthly bars ---------- */}
      <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
        <h2 className="text-base font-extrabold text-navy-900">Last 6 months</h2>
        <p className="mt-1 text-xs text-ink-mute">
          Monthly order-request value — the selected range above only affects the daily view.
        </p>
        <div className="mt-6">
          <BarChart
            points={snap.months}
            formatValue={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${Math.round(v)}`)}
          />
        </div>
      </section>

      {/* ---------- rankings ---------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-navy-900">Top products</h2>
            <Badge tone="success">by value</Badge>
          </div>
          <div className="mt-5">
            <RankBars
              rows={snap.topProducts.map((p) => ({
                key: p.sku,
                label: p.productName,
                sub: `${p.units} units · ${p.sku}`,
                value: p.value,
              }))}
              valueFormat={(v) => formatINR(Math.round(v))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-navy-900">Top customers</h2>
            <Badge tone="navy">
              <Users className="mr-1 size-3" aria-hidden />
              by value
            </Badge>
          </div>
          <div className="mt-5">
            <RankBars
              rows={snap.topCustomers.map((c) => ({
                key: c.mobile,
                label: c.name,
                sub: `${c.mobile} · ${c.orders} request${c.orders === 1 ? "" : "s"}`,
                value: c.value,
              }))}
              valueFormat={(v) => formatINR(Math.round(v))}
              tone="navy"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-navy-900">Top locations</h2>
            <Badge tone="navy">by value</Badge>
          </div>
          <div className="mt-5">
            <RankBars
              rows={snap.topCities.map((c) => ({
                key: c.city,
                label: c.city,
                sub: `${c.orders} request${c.orders === 1 ? "" : "s"}`,
                value: c.value,
              }))}
              valueFormat={(v) => formatINR(Math.round(v))}
              tone="navy"
            />
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-ink-mute">
        Figures are derived from order requests, not confirmed payments.{" "}
        <Link href="/admin/orders" className="font-semibold text-fresh-700 hover:underline">
          Review orders →
        </Link>
      </p>
    </>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
