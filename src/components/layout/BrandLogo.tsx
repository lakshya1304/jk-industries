import { cn } from "@/lib/utils";

/**
 * Brand lockup: the JK Industries monogram + the current brand/product name.
 * The mark is a real SVG asset (`/brand/jk-mark.svg`) so it stays crisp at any
 * size and can be reused for the favicon and printed bills.
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
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl shadow-[0_8px_20px_-10px_rgba(11,31,58,0.85)] ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/jk-mark.svg"
          alt={`${manufacturerName} logo`}
          className="size-full"
        />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block text-[1.02rem] font-extrabold tracking-tight",
            light ? "text-white" : "text-navy-900",
          )}
        >
          {brandName}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-semibold tracking-[0.14em] uppercase",
            light ? "text-white/60" : "text-ink-mute",
          )}
        >
          by {manufacturerName}
        </span>
      </span>
    </span>
  );
}
