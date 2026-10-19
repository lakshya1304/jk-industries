import { cn } from "@/lib/utils";

type Tone = "stock" | "out" | "request" | "neutral" | "navy" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  stock: "bg-fresh-50 text-fresh-700 ring-fresh-600/20",
  out: "bg-red-50 text-red-700 ring-red-600/20",
  request: "bg-amber-50 text-amber-700 ring-amber-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  navy: "bg-navy-50 text-navy-800 ring-navy-600/20",
  success: "bg-fresh-50 text-fresh-700 ring-fresh-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: string;
  className?: string;
}) {
  if (availability === "in_stock") {
    return (
      <Badge tone="stock" className={className}>
        <span className="size-1.5 rounded-full bg-fresh-600" aria-hidden />
        In Stock
      </Badge>
    );
  }
  if (availability === "out_of_stock") {
    return (
      <Badge tone="out" className={className}>
        <span className="size-1.5 rounded-full bg-red-600" aria-hidden />
        Out of Stock
      </Badge>
    );
  }
  return (
    <Badge tone="request" className={className}>
      <span className="size-1.5 rounded-full bg-amber-600" aria-hidden />
      On Request
    </Badge>
  );
}
