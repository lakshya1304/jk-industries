import { cn } from "@/lib/utils";

/** Animated skeleton block (shimmer). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}

/** Product-card shaped skeleton for catalogue loading states. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-navy-900/6 bg-white">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
