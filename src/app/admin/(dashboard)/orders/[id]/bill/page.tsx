import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderForBillById } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { BillView } from "@/components/order/BillView";

export const metadata: Metadata = { title: "Bill" };

// This page reads the database and the session on every request, so there is
// nothing to prerender. Without this the route logs a blocking-prerender
// warning on every visit. Matches the other admin pages.
export const instant = false;

export default async function AdminBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The URL carries the order id, not the reference — they are different
  // columns, and looking up by the wrong one 404s every time.
  const order = await getOrderForBillById(id);
  if (!order) notFound();
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      {/* The print stylesheet hides everything outside `.print-area`, so this
          back-link never reaches paper even though it sits inside the shell. */}
      <Link
        href={`/admin/orders/${order.id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-fresh-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to order
      </Link>
      <BillView order={order} settings={settings} />
    </div>
  );
}
