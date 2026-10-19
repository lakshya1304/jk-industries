import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackClient } from "@/components/order/TrackClient";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Track the status of your Super Cleaner order request with the mobile number you used.",
};

type SearchParams = Promise<{ mobile?: string }>;

export default function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">Order tracking</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
          Track your order request
        </h1>
        <p className="mt-3 text-ink-soft">
          Enter the mobile number you used when submitting your request and we will show its current
          status.
        </p>
      </header>
      <div className="max-w-3xl">
        <Suspense fallback={<div className="skeleton h-32 w-full rounded-3xl" aria-hidden />}>
          <TrackContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function TrackContent({ searchParams }: { searchParams: SearchParams }) {
  const { mobile = "" } = await searchParams;
  // Touching settings keeps the copy in sync with the configured brand name
  // while the client component handles the actual lookup.
  const settings = await getSettings();
  return <TrackClient initialMobile={mobile} brandName={settings.brandName} />;
}
