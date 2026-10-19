import { cn } from "@/lib/utils";

/**
 * Text-based brand mark. Replace with the real logo by uploading it in the
 * admin dashboard later — or swap this component for next/image.
 */
export function BrandLogo({
  brandName,
  manufacturerName,
  tone = "dark",
  className,
}: {
  brandName: string;
  manufacturerName: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-fresh-600 shadow-[0_6px_16px_-8px_rgba(22,163,74,0.9)]">
        {/* water droplet */}
        <svg viewBox="0 0 24 24" className="size-5 text-white" aria-hidden fill="none">
          <path
            d="M12 3.2c3.6 4.2 6 7.3 6 10.4a6 6 0 1 1-12 0c0-3.1 2.4-6.2 6-10.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9.4 13.9a2.7 2.7 0 0 0 2.7 2.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[1.02rem] font-extrabold tracking-tight",
            light ? "text-white" : "text-navy-900"
          )}
        >
          {brandName}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-semibold tracking-[0.14em] uppercase",
            light ? "text-white/60" : "text-ink-mute"
          )}
        >
          by {manufacturerName}
        </span>
      </span>
    </span>
  );
}
