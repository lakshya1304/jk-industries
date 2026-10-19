import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="container-page pt-28 pb-16">
      <div className="skeleton h-10 w-56 rounded-xl" aria-hidden />
      <div className="skeleton mt-4 h-4 w-96 max-w-full rounded-lg" aria-hidden />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
