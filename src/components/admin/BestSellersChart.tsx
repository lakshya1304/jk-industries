import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";

type Row = { productName: string; units: number; value: number };

/**
 * Most-requested (best-selling) products, ranked by total units across all
 * order requests. Rendered as a compact bar list with the order value beside
 * each bar. Server component — reads straight from Prisma.
 */
export async function BestSellersChart({ limit = 6 }: { limit?: number }) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productName"],
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const rows: Row[] = grouped.map((g) => ({
    productName: g.productName,
    units: g._sum.quantity ?? 0,
    value: Math.round(g._sum.lineTotal ?? 0),
  }));

  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const maxUnits = Math.max(1, ...rows.map((r) => r.units));

  return (
    <section
      aria-labelledby="best-sellers-heading"
      className="rounded-2xl border border-navy-900/8 bg-white p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="best-sellers-heading" className="text-base font-extrabold text-navy-900">
            Most selling products
          </h2>
          <p className="mt-1 text-xs text-ink-mute">
            Ranked by total units across all order requests.
          </p>
        </div>
        {totalUnits > 0 && (
          <span className="text-xs font-semibold text-ink-mute">
            {totalUnits} units requested
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-ink-mute">
          No order requests yet — this chart fills up as customers order.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {rows.map((row, i) => {
            const pct = Math.max(6, (row.units / maxUnits) * 100);
            return (
              <li key={row.productName} className="flex items-center gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-navy-50 text-xs font-extrabold text-navy-800">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-bold text-navy-900">
                      {row.productName}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ink-mute">
                      {row.units} units · {formatINR(row.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-fresh-400),var(--color-fresh-700))] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
