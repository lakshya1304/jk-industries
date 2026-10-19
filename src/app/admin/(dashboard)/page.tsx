import Link from "next/link";
import { CircleAlert, MessageSquare, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";

export default async function AdminOverviewPage() {
  const [
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    totalEnquiries,
    newEnquiries,
    recentOrders,
    recentEnquiries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "new" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    {
      label: "Products",
      value: totalProducts,
      hint: `${activeProducts} live on the website`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Order requests",
      value: totalOrders,
      hint: `${pendingOrders} awaiting confirmation`,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      label: "Enquiries",
      value: totalEnquiries,
      hint: `${newEnquiries} new`,
      icon: MessageSquare,
      href: "/admin/enquiries",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Overview</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Manage the Super Cleaner catalogue, order requests and customer enquiries.
        </p>
      </div>

      {pendingOrders > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <CircleAlert className="size-5 shrink-0" aria-hidden />
          You have {pendingOrders} order request{pendingOrders === 1 ? "" : "s"} pending confirmation.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-navy-900/8 bg-white p-5 transition-shadow hover:shadow-[0_18px_40px_-30px_rgba(11,31,58,0.5)]"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-800">
                <s.icon className="size-5" aria-hidden />
              </span>
              <TrendingUp className="size-4 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-navy-900">{s.value}</p>
            <p className="text-sm font-semibold text-navy-900">{s.label}</p>
            <p className="text-xs text-ink-mute">{s.hint}</p>
          </Link>
        ))}
      </div>

      <AnalyticsPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-navy-900">Recent order requests</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-fresh-700 hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">No order requests yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy-900/6">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="block truncate text-sm font-bold text-navy-900 hover:text-fresh-700"
                    >
                      {o.reference}
                    </Link>
                    <p className="truncate text-xs text-ink-mute">
                      {o.customerName} · {o.mobile}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-navy-900">{formatINR(o.subtotal)}</p>
                    <p className="text-[11px] text-ink-mute">{formatDate(o.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-navy-900/8 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-navy-900">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="text-xs font-bold text-fresh-700 hover:underline">
              View all
            </Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="mt-4 text-sm text-ink-mute">No enquiries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy-900/6">
              {recentEnquiries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy-900">{e.name}</p>
                    <p className="truncate text-xs text-ink-mute">
                      {ENQUIRY_TYPE_LABELS[e.type] ?? e.type} · {e.mobile}
                    </p>
                  </div>
                  <Badge tone={e.status === "new" ? "warning" : e.status === "resolved" ? "success" : "navy"}>
                    {e.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
