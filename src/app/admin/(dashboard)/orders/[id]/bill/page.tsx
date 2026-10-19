import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderForBill } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { BillDocument } from "@/components/order/BillDocument";
import { PrintButton } from "@/components/order/PrintButton";

export const metadata: Metadata = { title: "Bill" };

export default async function AdminBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForBill(id);
  if (!order) notFound();
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-fresh-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to order
        </Link>
        <PrintButton label="Print / save PDF" />
      </div>
      <BillDocument order={order} settings={settings} />
    </div>
  );
}
