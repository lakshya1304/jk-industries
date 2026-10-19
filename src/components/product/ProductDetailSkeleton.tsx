import { Skeleton } from "@/components/ui/Skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14" aria-busy="true" aria-label="Loading product">
      <div>
        <Skeleton className="aspect-4/5 w-full rounded-3xl" />
        <div className="mt-3 flex gap-2.5">
          <Skeleton className="size-18 rounded-xl sm:size-20" />
          <Skeleton className="size-18 rounded-xl sm:size-20" />
        </div>
      </div>
      <div className="space-y-4 pt-2">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-4/5 rounded-xl" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-12 rounded-full" />
          <Skeleton className="h-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
