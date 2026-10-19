import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Neutral stand-in shown while a product has no photo yet.
 * It deliberately does not pretend to be a product picture — the admin uploads
 * real photos from the dashboard.
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
        "flex size-full flex-col items-center justify-center gap-1.5 bg-[linear-gradient(135deg,var(--color-navy-50),#ffffff_60%,var(--color-fresh-50))] text-ink-mute",
        className
      )}
      role="img"
      aria-label={label}
    >
      <ImageOff className={cn("text-navy-500/50", compact ? "size-5" : "size-8")} aria-hidden />
      {!compact && (
        <span className="px-3 text-center text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
