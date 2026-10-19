import Link from "next/link";
import { Suspense } from "react";
import { Search, ShoppingBag } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Order requests</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Search requests by reference, customer or mobile, and update their status.
        </p>
      </div>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersContent({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "" } = await searchParams;
  const term = q.trim();

  const where: Prisma.OrderWhereInput = {};
  if (term) {
    where.OR = [
      { reference: { contains: term } },
      { customerName: { contains: term } },
      { mobile: { contains: term } },
      { businessName: { contains: term } },
    ];
  }
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <form method="get" action="/admin/orders" className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy-900/8 bg-white p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-mute" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search reference, name, mobile…"
            className="w-full rounded-xl border border-navy-900/12 bg-white py-2.5 pl-10 pr-3.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-navy-900/12 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-full bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
        >
          Filter
        </button>
        {(term || status) && (
          <Link href="/admin/orders" className="text-sm font-semibold text-fresh-700 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-navy-900/15 bg-white p-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-navy-50">
            <ShoppingBag className="size-6 text-navy-600" aria-hidden />
          </span>
          <h2 className="text-lg font-bold text-navy-900">No order requests found</h2>
          <p className="max-w-sm text-sm text-ink-mute">
            {term || status
              ? "Try a different search term or clear the filters."
              : "Order requests submitted from the website will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy-900/8 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Est. total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-navy-900/6 last:border-0 hover:bg-navy-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy-900 hover:text-fresh-700">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-900">{o.customerName}</p>
                      <p className="text-xs text-ink-mute">
                        {o.mobile}
                        {o.businessName ? ` · ${o.businessName}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{o.itemCount}</td>
                    <td className="px-4 py-3 font-semibold text-navy-900">{formatINR(o.subtotal)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={o.status === "pending" ? "warning" : o.status === "cancelled" ? "danger" : o.status === "delivered" ? "success" : "navy"}>
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-mute">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-2xl" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
