import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, MessageSquare, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EnquiryStatusControl } from "@/components/admin/EnquiryStatusControl";

type SearchParams = Promise<{ q?: string; status?: string; type?: string }>;

export default function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Enquiries</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Contact, product, dealership and wholesale enquiries submitted from the website.
        </p>
      </div>
      <Suspense fallback={<EnquiriesSkeleton />}>
        <EnquiriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EnquiriesContent({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "", type = "" } = await searchParams;
  const term = q.trim();

  const where: Prisma.EnquiryWhereInput = {};
  if (term) {
    where.OR = [
      { name: { contains: term } },
      { mobile: { contains: term } },
      { businessName: { contains: term } },
      { message: { contains: term } },
      { city: { contains: term } },
    ];
  }
  if (status) where.status = status;
  if (type) where.type = type;

  const enquiries = await prisma.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <form method="get" action="/admin/enquiries" className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy-900/8 bg-white p-4">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-mute" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Search name, mobile, message…"
            className="w-full rounded-xl border border-navy-900/12 bg-white py-2.5 pl-10 pr-3.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
          />
        </div>
        <select
          name="type"
          defaultValue={type}
          className="rounded-xl border border-navy-900/12 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
        >
          <option value="">All types</option>
          {Object.entries(ENQUIRY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border border-navy-900/12 bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
        >
          <option value="">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="inline-flex h-10 items-center rounded-full bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800">
          Filter
        </button>
        {(term || status || type) && (
          <Link href="/admin/enquiries" className="text-sm font-semibold text-fresh-700 hover:underline">
            Clear
          </Link>
        )}
      </form>

      {enquiries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-navy-900/15 bg-white p-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-navy-50">
            <MessageSquare className="size-6 text-navy-600" aria-hidden />
          </span>
          <h2 className="text-lg font-bold text-navy-900">No enquiries found</h2>
          <p className="max-w-sm text-sm text-ink-mute">
            {term || status || type
              ? "Try a different search term or clear the filters."
              : "New enquiries from the contact form and product pages will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <article key={e.id} className="rounded-2xl border border-navy-900/8 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-navy-900">{e.name}</h2>
                    <Badge tone="navy">{ENQUIRY_TYPE_LABELS[e.type] ?? e.type}</Badge>
                    <Badge tone={e.status === "new" ? "warning" : e.status === "resolved" ? "success" : "navy"}>
                      {ENQUIRY_STATUS_LABELS[e.status] ?? e.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-mute">
                    {e.mobile}
                    {e.businessName ? ` · ${e.businessName}` : ""}
                    {e.city ? ` · ${e.city}` : ""}
                    {e.state ? `, ${e.state}` : ""}
                    {" · "}
                    {formatDate(e.createdAt)}
                  </p>
                  {(e.productName || e.productSku) && (
                    <p className="mt-1 text-xs font-semibold text-navy-800">
                      Product: {e.productName ?? "—"} {e.productSku ? `(${e.productSku})` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/${normalizeWhatsAppNumber(e.mobile)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-bold text-[#062b17] transition-colors hover:bg-[#1fbb59]"
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    WhatsApp
                  </a>
                  <EnquiryStatusControl enquiryId={e.id} status={e.status} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{e.message}</p>
              {e.email && (
                <p className="mt-2 text-xs text-ink-mute">
                  Email:{" "}
                  <a href={`mailto:${e.email}`} className="font-semibold text-navy-900 hover:underline">
                    {e.email}
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function EnquiriesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-2xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
