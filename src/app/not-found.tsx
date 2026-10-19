import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-navy-50">
        <PackageX className="size-9 text-navy-600" aria-hidden />
      </span>
      <p className="mt-6 text-xs font-bold tracking-[0.2em] text-fresh-700 uppercase">
        404 — Not found
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The page or product you are looking for may have been moved or is no longer available.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex h-12 items-center rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800"
        >
          Browse all products
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center rounded-full border border-navy-900/15 px-6 text-sm font-bold text-navy-900 transition-colors hover:border-navy-900/40 hover:bg-navy-50"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
