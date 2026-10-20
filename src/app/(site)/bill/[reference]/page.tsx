import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getOrderForBill } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { BillView } from "@/components/order/BillView";

export const metadata: Metadata = {
  title: "Order Bill",
  robots: { index: false },
};

type Params = Promise<{ reference: string }>;

/**
 * Public bill view. The reference acts as the access key (it is only shown to
 * the customer who placed the request and on their confirmation screen).
 */
export default function BillPage({ params }: { params: Params }) {
  return (
    <div className="container-page pt-24 pb-16 md:pt-28">
      <Suspense
        fallback={<div className="skeleton mx-auto h-96 w-full max-w-3xl rounded-3xl" aria-hidden />}
      >
        <BillContent params={params} />
      </Suspense>
    </div>
  );
}

async function BillContent({ params }: { params: Params }) {
  const { reference } = await params;
  const [order, settings] = await Promise.all([getOrderForBill(reference), getSettings()]);
  if (!order) notFound();

  return (
    <>
      <Link
        href={`/order-confirmation/${order.reference}`}
        className="mx-auto mb-6 flex w-fit items-center gap-2 text-sm font-bold text-fresh-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to order summary
      </Link>
      <BillView order={order} settings={settings} />
    </>
  );
}
