import Link from "next/link";
import {
  CircleAlert,
  MessageCircle,
  MessageSquare,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/utils";
import { whatsAppConfigured } from "@/lib/notify";
import { Badge } from "@/components/ui/Badge";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

// This page reads live order/product counts, so it blocks on the server instead
// of being validated during instant navigation.
export const instant = false;

export default async function AdminOverviewPage() {
  // Three grouped reads instead of eight parallel queries: every query in this
  // page grabs its own connection from a 13-slot pool, and the old shape could
  // exhaust it (P2024) when the dashboard, /api/admin/alerts and other admin
  // pages were opened together. groupBy returns the totals and the per-status
  // breakdowns in a single round trip each.
  const [productCounts, orderCounts, enquiryCounts, recentOrders, recentEnquiries, unalertedOrders] =
    await Promise.all([
      prisma.product.groupBy({ by: ["active"], _count: { _all: true } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      // Orders the shop was never automatically told about. Counted here rather
      // than derived from a page of results, so the number is the true total.
      prisma.order.count({ where: { adminNotifiedAt: null } }),
    ]);

  const sum = (rows: { _count: { _all: number } }[]) =>
    rows.reduce((total, row) => total + row._count._all, 0);

  const totalProducts = sum(productCounts);
  const activeProducts = sum(productCounts.filter((r) => r.active === true));
  const totalOrders = sum(orderCounts);
  const pendingOrders = sum(orderCounts.filter((r) => r.status === "pending"));
  const totalEnquiries = sum(enquiryCounts);
  const newEnquiries = sum(enquiryCounts.filter((r) => r.status === "new"));

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

      {!whatsAppConfigured() && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <MessageCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Automatic WhatsApp alerts are off</p>
            <p className="mt-1 leading-relaxed">
              No WhatsApp Business API credentials are configured, so new orders do not
              reach your phone by themselves. You can still send the full order details in
              one tap from any order page. To switch automatic alerts on, set{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                WHATSAPP_ACCESS_TOKEN
              </code>{" "}
              and{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                WHATSAPP_PHONE_NUMBER_ID
              </code>{" "}
              — see the README.
            </p>
          </div>
        </div>
      )}

      {unalertedOrders > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-navy-900/10 bg-navy-50 p-4 text-sm font-semibold text-navy-900">
          <CircleAlert className="size-5 shrink-0" aria-hidden />
          <span>
            {unalertedOrders} order{unalertedOrders === 1 ? "" : "s"} arrived without an
            automatic alert.{" "}
            <Link href="/admin/orders" className="underline underline-offset-2">
              Review them
            </Link>
            .
          </span>
        </div>
      )}

      {pendingOrders > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <CircleAlert className="size-5 shrink-0" aria-hidden />
          You have {pendingOrders} order request{pendingOrders === 1 ? "" : "s"} pending confirmation.
        </div>
      )}

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="press-card group rounded-2xl border border-navy-900/8 bg-white p-5 hover:shadow-[0_18px_40px_-30px_rgba(11,31,58,0.5)]"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-800">
                <s.icon className="size-5" aria-hidden />
              </span>
              <TrendingUp className="size-4 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-navy-900">
              <AnimatedNumber value={s.value} />
            </p>
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
