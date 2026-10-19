"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-3xl border border-navy-900/8 bg-white p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <CircleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-navy-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">
          An unexpected error occurred. Please try again — if it keeps happening, contact us on
          WhatsApp.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
