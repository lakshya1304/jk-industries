import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free chart primitives.
 *
 * All of them are plain SVG so they render on the server, scale crisply, and
 * need no client JavaScript. Motion comes from CSS (see globals.css): bars grow
 * from the baseline, line paths draw themselves, and donuts sweep — all driven
 * by `--ease-out-soft` and disabled under `prefers-reduced-motion`.
 */

export type SeriesPoint = { key: string; label: string; value: number };

function niceMax(value: number) {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const norm = value / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/** Axis labels for a money scale. */
function moneyTick(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${Math.round(v / 1_000)}k`;
  return `₹${Math.round(v)}`;
}

/**
 * Area + line chart for a daily series. The path is drawn with a sweep
 * animation and the area beneath it fades in.
 */
export function AreaChart({
  points,
  height = 220,
  label = "Trend",
}: {
  points: SeriesPoint[];
  height?: number;
  label?: string;
}) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">No data for this range.</p>;
  }

  const width = 720;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: padTop + innerH - (p.value / max) * innerH,
  }));

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${(padX + innerW).toFixed(1)},${(padTop + innerH).toFixed(1)} L${padX},${(padTop + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${label}: ${points.length} points, peak ₹${Math.round(max).toLocaleString("en-IN")}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-fresh-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-fresh-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = padTop + innerH * g;
          return (
            <g key={g}>
              <line x1={padX} y1={y} x2={padX + innerW} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
              <text x={0} y={y - 4} fontSize="10" fill="currentColor" opacity="0.5">
                {moneyTick(max * (1 - g))}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#areaFill)" className="chart-area-fade" />

        <path
          d={line}
          fill="none"
          stroke="var(--color-fresh-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="chart-line-draw"
        />

        {coords.map((c, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={points[i].key} x={c.x} y={height - 8} fontSize="10" fill="currentColor" opacity="0.55" textAnchor="middle">
              {points[i].label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

/** Vertical bars, one per point, with a highlighted maximum. */
export function BarChart({
  points,
  height = 200,
  formatValue,
}: {
  points: SeriesPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">No data for this range.</p>;
  }
  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const maxIdx = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);

  return (
    <ul className="flex items-end gap-2" style={{ height }}>
      {points.map((p, i) => {
        const pct = Math.max(2, (p.value / max) * 100);
        return (
          <li key={p.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[11px] font-bold text-ink-soft">
              {formatValue ? formatValue(p.value) : Math.round(p.value).toLocaleString("en-IN")}
            </span>
            <div className="relative w-full flex-1 overflow-hidden rounded-t-lg bg-navy-50/60">
              <div
                className={cn(
                  "absolute bottom-0 w-full rounded-t-lg",
                  i === maxIdx
                    ? "bg-[linear-gradient(180deg,var(--color-fresh-500),var(--color-fresh-700))]"
                    : "bg-[linear-gradient(180deg,var(--color-navy-500),var(--color-navy-700))]",
                  "animate-[grow-y_0.7s_var(--ease-out-soft)_both]"
                )}
                style={{ height: `${pct}%`, animationDelay: `${i * 60}ms` }}
              />
            </div>
            <span className="truncate text-[11px] font-semibold text-ink-mute">{p.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Horizontal ranking bars for products / customers / cities. */
export function RankBars({
  rows,
  valueFormat,
  tone = "fresh",
}: {
  rows: { key: string; label: string; sub?: string; value: number }[];
  valueFormat: (v: number) => string;
  tone?: "fresh" | "navy";
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-sm text-ink-mute">Nothing to show yet.</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <ol className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.key} className="flex items-center gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-navy-50 text-[11px] font-extrabold text-navy-800">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-bold text-navy-900">{r.label}</span>
              <span className="shrink-0 text-xs font-semibold text-ink-mute">{valueFormat(r.value)}</span>
            </div>
            {r.sub && <p className="truncate text-[11px] text-ink-mute">{r.sub}</p>}
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
              <div
                className={cn(
                  "h-full rounded-full animate-[grow-x_0.7s_var(--ease-out-soft)_both]",
                  tone === "fresh"
                    ? "bg-[linear-gradient(90deg,var(--color-fresh-400),var(--color-fresh-700))]"
                    : "bg-[linear-gradient(90deg,var(--color-navy-500),var(--color-navy-800))]"
                )}
                style={{ width: `${Math.max(4, (r.value / max) * 100)}%`, animationDelay: `${i * 55}ms` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Donut showing how a total splits into parts. */
export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 168,
}: {
  slices: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="16" />
          {total > 0 &&
            slices.map((s) => {
              const len = (s.value / total) * circumference;
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-offset}
                  className="chart-donut-sweep"
                />
              );
              offset += len;
              return el;
            })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">
          {centerValue}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
          {centerLabel}
        </text>
      </svg>

      <ul className="space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="font-semibold text-navy-900">{s.label}</span>
            <span className="text-ink-mute">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
