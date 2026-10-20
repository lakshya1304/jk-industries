import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Metric tile used across the dashboard.
 *
 * Server-rendered; the entrance animation is pure CSS (`stagger` on the parent
 * grid, `rise` per card) so no client JavaScript is needed. A `trend` renders a
 * directional arrow with the delta — used by the revenue comparison cards.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "navy";
  href?: string;
  /** Percentage change plus direction; null delta renders a neutral dash. */
  trend?: { delta: number | null; label?: string };
  className?: string;
}) {
  const toneRing: Record<string, string> = {
    default: "bg-navy-50 text-navy-800",
    success: "bg-fresh-50 text-fresh-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
    navy: "bg-navy-900 text-white",
  };

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-wide text-ink-mute uppercase">{label}</p>
        {Icon && (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", toneRing[tone])}>
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-3 text-2xl font-extrabold tracking-tight",
          tone === "warning" ? "text-amber-700" : tone === "danger" ? "text-red-600" : "text-navy-900"
        )}
      >
        {value}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {hint && <p className="text-xs text-ink-mute">{hint}</p>}
        {trend && <TrendPill delta={trend.delta} label={trend.label} />}
      </div>
    </>
  );

  const shell =
    "press-card block rounded-2xl border border-navy-900/8 bg-white p-5 hover:shadow-[0_22px_45px_-32px_rgba(11,31,58,0.55)]";

  if (href) {
    return (
      <Link href={href} className={cn(shell, className)}>
        {body}
      </Link>
    );
  }
  return <div className={cn(shell, className)}>{body}</div>;
}

function TrendPill({ delta, label }: { delta: number | null; label?: string }) {
  if (delta === null) {
    return <span className="text-[11px] font-semibold text-ink-mute">{label ?? "no prior data"}</span>;
  }
  const up = delta > 0;
  const flat = delta === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
        flat ? "bg-navy-50 text-ink-soft" : up ? "bg-fresh-50 text-fresh-700" : "bg-red-50 text-red-600"
      )}
    >
      <Icon className="size-3" aria-hidden />
      {Math.abs(delta)}%
      {label && <span className="ml-1 font-medium text-ink-mute">{label}</span>}
    </span>
  );
}
