import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Neutral stand-in shown while a product has no photo yet.
 * It deliberately does not pretend to be a product picture — the admin uploads
 * real photos from the dashboard.
 *
 * The wash is built from theme variables only: the mid stop used to be a
 * hardcoded white, which left a bright band the caption could not be read
 * against (and looked wrong in dark mode).
 */
export function NoImage({
  className,
  label = "Photo coming soon",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-1.5 bg-[linear-gradient(135deg,var(--color-navy-50),var(--color-white)_55%,var(--color-fresh-50))] text-ink-soft",
        className
      )}
      role="img"
      aria-label={label}
    >
      <ImageOff className={cn("text-navy-500/60", compact ? "size-5" : "size-8")} aria-hidden />
      {!compact && (
        <span className="max-w-[85%] px-3 text-center text-[11px] font-bold tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
