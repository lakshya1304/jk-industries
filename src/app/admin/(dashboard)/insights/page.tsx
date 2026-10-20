import { Suspense } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  Info,
  PackageSearch,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAiReport } from "@/lib/ai";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/admin/StatCard";
import { RangeSwitcher } from "@/components/admin/RangeSwitcher";
import { RankBars } from "@/components/admin/charts";

export const metadata = { title: "AI insights" };

// Reads live order history on every visit.
export const instant = false;

type SearchParams = Promise<{ range?: string }>;

const LOOKBACK: Record<string, number> = { "7": 7, "30": 30, "90": 90, "365": 180 };

const TONE_STYLES: Record<string, { wrap: string; icon: typeof Info }> = {
  danger: { wrap: "border-red-200 bg-red-50", icon: AlertTriangle },
  warning: { wrap: "border-amber-200 bg-amber-50", icon: AlertTriangle },
  success: { wrap: "border-fresh-100 bg-fresh-50", icon: TrendingUp },
  info: { wrap: "border-navy-900/8 bg-white", icon: Info },
};

const CATEGORY_LABEL: Record<string, string> = {
  stock: "Stock",
  demand: "Demand",
  revenue: "Revenue",
  customers: "Customers",
  quality: "Operations",
};

export default function AdminInsightsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-navy-900">
            <BrainCircuit className="size-6 text-fresh-600" aria-hidden />
            AI insights
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Demand forecasts, restock priorities and anomalies computed from your own order history
            on this server. No external service is called and no data leaves the shop.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-10 w-72 rounded-full" />}>
          <RangePicker searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RangePicker({ searchParams }: { searchParams: SearchParams }) {
  const { range = "30" } = await searchParams;
  return <RangeSwitcher current={LOOKBACK[range] ? range : "30"} />;
}

async function InsightsContent({ searchParams }: { searchParams: SearchParams }) {
  const { range = "30" } = await searchParams;
  const days = LOOKBACK[range] ?? 30;
  const report = await getAiReport(new Date(), days, 14);

  const restock = report.forecasts.filter((f) => f.priority >= 60);
  const growing = report.forecasts.filter((f) => f.trend === "up");

  return (
    <>
      {/* ---------- summary banner ---------- */}
      <section className="rounded-2xl border border-navy-900/8 bg-[linear-gradient(135deg,rgba(34,197,94,0.08),rgba(11,31,58,0.04))] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fresh-600 text-white">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-navy-900">
              What the last {report.lookbackDays} days look like
            </h2>
            <ul className="mt-2 space-y-1.5">
              {report.summary.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fresh-500" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- KPIs ---------- */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Requests analysed"
          value={String(report.totals.orders)}
          hint={`${report.totals.units} units · ${formatINR(Math.round(report.totals.value))}`}
          icon={PackageSearch}
        />
        <StatCard
          label={`Forecast · next ${report.horizonDays}d`}
          value={formatINR(report.trend.projected)}
          hint="Fitted from the daily trend line"
          icon={CalendarClock}
          tone={report.trend.direction === "growing" ? "success" : report.trend.direction === "declining" ? "warning" : "default"}
        />
        <StatCard
          label="Needs restocking"
          value={String(restock.length)}
          hint="Products short on cover"
          icon={AlertTriangle}
          tone={restock.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Repeat customers"
          value={`${report.totals.repeatRate}%`}
          hint={`${report.totals.repeatCustomers} of ${report.totals.uniqueCustomers} ordered twice+`}
          icon={Users}
          tone={report.totals.repeatRate >= 25 ? "success" : "default"}
        />
      </div>

      {/* ---------- insights ---------- */}
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-navy-900">Recommendations</h2>
        {report.insights.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-navy-900/15 bg-white p-8 text-center text-sm text-ink-mute">
            Not enough order history yet to draw conclusions. Insights appear as requests come in.
          </p>
        ) : (
          <ul className="stagger space-y-3">
            {report.insights.map((insight) => {
              const style = TONE_STYLES[insight.tone];
              const Icon = style.icon;
              return (
                <li
                  key={insight.id}
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${style.wrap}`}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/70 text-navy-900">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-navy-900">{insight.title}</p>
                      <Badge tone="neutral">{CATEGORY_LABEL[insight.category] ?? insight.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{insight.detail}</p>
                    {insight.action && (
                      <p className="mt-1.5 text-xs font-semibold text-navy-800">→ {insight.action}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------- forecast table ---------- */}
      <section className="overflow-hidden rounded-2xl border border-navy-900/8 bg-white">
        <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-navy-900">Demand forecast</h2>
            <p className="mt-1 text-xs text-ink-mute">
              Extrapolated from the last {report.lookbackDays} days at the current daily rate. Treat
              as a guide, not a promise.
            </p>
          </div>
          <Badge tone="navy">{report.horizonDays}-day horizon</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="border-y border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Sold</th>
                <th className="px-5 py-3 text-right">Per day</th>
                <th className="px-5 py-3 text-right">Forecast</th>
                <th className="px-5 py-3 text-right">In stock</th>
                <th className="px-5 py-3 text-right">Cover</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {report.forecasts.slice(0, 12).map((f) => (
                <tr key={f.sku} className="border-b border-navy-900/6 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-bold text-navy-900">{f.productName}</p>
                    <p className="text-xs text-ink-mute">{f.sku}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-navy-900">{f.units}</td>
                  <td className="px-5 py-3 text-right text-ink-soft">{f.dailyRate}</td>
                  <td className="px-5 py-3 text-right font-bold text-fresh-700">{f.forecast}</td>
                  <td className="px-5 py-3 text-right text-ink-soft">
                    {f.stock == null ? "untracked" : f.stock}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {f.daysOfCover == null ? (
                      <span className="text-ink-mute">—</span>
                    ) : (
                      <span
                        className={
                          f.daysOfCover === 0
                            ? "font-bold text-red-600"
                            : f.daysOfCover <= 14
                              ? "font-bold text-amber-700"
                              : "font-semibold text-navy-900"
                        }
                      >
                        {f.daysOfCover}d
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {f.trend === "up" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-fresh-700">
                        <TrendingUp className="size-3.5" aria-hidden /> Rising
                      </span>
                    ) : f.trend === "down" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                        <TrendingDown className="size-3.5" aria-hidden /> Easing
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-ink-mute">Steady</span>
                    )}
                  </td>
                </tr>
              ))}
              {report.forecasts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink-mute">
                    No product demand recorded in this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- anomalies + momentum ---------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Unusual days</h2>
          <p className="mt-1 text-xs text-ink-mute">
            Days whose order value sits two or more standard deviations from the average.
          </p>
          {report.anomalies.length === 0 ? (
            <p className="mt-5 text-sm text-ink-mute">No unusual days in this window.</p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {report.anomalies.map((a) => (
                <li
                  key={a.date}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy-900/8 px-3.5 py-2.5"
                >
                  <span className="text-sm font-bold text-navy-900">{a.label}</span>
                  <span className="text-sm font-semibold text-ink-soft">{formatINR(a.value)}</span>
                  <Badge tone={a.direction === "spike" ? "success" : "warning"}>
                    {a.direction === "spike" ? "+" : ""}
                    {a.z}σ
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <h2 className="text-base font-extrabold text-navy-900">Momentum</h2>
          <p className="mt-1 text-xs text-ink-mute">
            Products whose orders grew in the second half of the window.
          </p>
          <div className="mt-5">
            <RankBars
              rows={growing.slice(0, 6).map((f) => ({
                key: f.sku,
                label: f.productName,
                sub: `${f.units} units · ${f.dailyRate}/day`,
                value: f.units,
              }))}
              valueFormat={(v) => `${v} units`}
            />
          </div>
        </section>
      </div>

      <details className="rounded-2xl border border-navy-900/8 bg-white p-5 text-sm">
        <summary className="cursor-pointer font-extrabold text-navy-900">
          How these numbers are worked out
        </summary>
        <ul className="mt-3 space-y-2 text-ink-soft">
          <li>
            <strong className="text-navy-900">Demand rate</strong> — total units sold in the window ÷
            number of days. The forecast is that rate × the horizon.
          </li>
          <li>
            <strong className="text-navy-900">Days of cover</strong> — current tracked stock ÷ daily
            rate. Untracked packs are reported as untracked rather than guessed.
          </li>
          <li>
            <strong className="text-navy-900">Trend</strong> — units in the recent half of the window
            compared with the earlier half (±20% decides rising/easing).
          </li>
          <li>
            <strong className="text-navy-900">Anomalies</strong> — z-score of each day&apos;s value
            against the window mean; |z| ≥ 2 is flagged.
          </li>
          <li>
            <strong className="text-navy-900">Outlook</strong> — a least-squares line fitted to the
            daily values, projected forward.
          </li>
        </ul>
      </details>
    </>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
