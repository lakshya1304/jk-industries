import { cn } from "@/lib/utils";

export type StockBar = {
  key: string;
  label: string;
  productName: string;
  stock: number;
};

/**
 * Horizontal bar chart of tracked stock ordered by lowest first, so what needs
 * restocking sits at the top. Colour encodes severity: red = out of stock,
 * amber = at/below the low threshold, green = healthy.
 *
 * `mode` only changes the copy — "pack" lists one bar per pack size, "product"
 * lists one bar per product with its packs rolled up.
 */
export function StockLevelChart({
  bars,
  lowThreshold,
  maxBars = 10,
  mode = "pack",
  title,
}: {
  bars: StockBar[];
  lowThreshold: number;
  maxBars?: number;
  mode?: "pack" | "product";
  title?: string;
}) {
  const shown = bars.slice(0, maxBars);
  const max = Math.max(1, ...shown.map((b) => b.stock));
  const critical = shown.filter((b) => b.stock <= lowThreshold).length;

  const heading = title ?? (mode === "product" ? "Critical products" : "Critical stock levels");
  const subtitle =
    mode === "product"
      ? `Total units per product, lowest first. Red is out of stock, amber is at or below ${lowThreshold} units.`
      : `Lowest-tracked packs first. Red is out of stock, amber is at or below ${lowThreshold} units.`;

  return (
    <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">{heading}</h2>
          <p className="mt-1 text-xs text-ink-mute">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-mute">
          {critical > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
              {critical} need attention
            </span>
          )}
          <Legend className="bg-fresh-500" label="Healthy" />
          <Legend className="bg-amber-500" label="Low" />
          <Legend className="bg-red-500" label="Out" />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-5 text-sm text-ink-mute">No tracked stock yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {shown.map((bar) => {
            const pct = Math.max(3, (bar.stock / max) * 100);
            const tone =
              bar.stock === 0
                ? "bg-[linear-gradient(90deg,var(--color-red-400),var(--color-red-600))]"
                : bar.stock <= lowThreshold
                  ? "bg-[linear-gradient(90deg,var(--color-amber-400),var(--color-amber-600))]"
                  : "bg-[linear-gradient(90deg,var(--color-fresh-400),var(--color-fresh-700))]";
            return (
              <li key={bar.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-xs font-semibold text-navy-900">
                    {bar.productName}
                    {bar.label && <span className="ml-1.5 font-normal text-ink-mute">{bar.label}</span>}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-extrabold",
                      bar.stock === 0
                        ? "text-red-600"
                        : bar.stock <= lowThreshold
                          ? "text-amber-700"
                          : "text-navy-900"
                    )}
                  >
                    {bar.stock}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-navy-50">
                  <div
                    className={cn("chart-bar-grow h-full rounded-full", tone)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}
