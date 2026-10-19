import Link from "next/link";
import { Boxes, CircleAlert, PackageX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Inventory" };

const LOW_STOCK_THRESHOLD = 15;

/**
 * Inventory view: every pack size with its tracked stock. Stock is decremented
 * automatically when an order request is submitted and restored when an order
 * is cancelled. Blank stock = not tracked for that pack.
 */
export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    include: { packSizes: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const rows = products.flatMap((p) =>
    p.packSizes.map((ps) => ({
      key: ps.id,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      active: p.active && ps.active,
      label: ps.label,
      mrp: ps.mrp,
      stock: ps.stock,
    }))
  );

  const tracked = rows.filter((r) => r.stock != null);
  const lowStock = tracked.filter((r) => (r.stock as number) <= LOW_STOCK_THRESHOLD);
  const outOfStock = tracked.filter((r) => (r.stock as number) === 0);
  const untracked = rows.length - tracked.length;
  const stockValue = tracked.reduce((sum, r) => sum + (r.stock as number) * r.mrp, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Inventory</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Stock per pack size. Orders reserve stock automatically; cancelling an order returns
            it. Edit stock on the product page.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-navy-900/15 px-5 text-sm font-bold text-navy-900 transition-colors hover:bg-navy-50"
        >
          <Boxes className="size-4" aria-hidden />
          Manage products
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tracked pack sizes" value={String(tracked.length)} hint={`${untracked} not tracked`} />
        <Stat label="Units in stock" value={String(tracked.reduce((s, r) => s + (r.stock as number), 0))} hint="Across all packs" />
        <Stat label="Stock value (MRP)" value={formatINR(Math.round(stockValue))} hint="Approximate" />
        <Stat
          label="Low / out of stock"
          value={`${lowStock.length} / ${outOfStock.length}`}
          hint={`Threshold ≤ ${LOW_STOCK_THRESHOLD} units`}
          tone={lowStock.length > 0 ? "warn" : undefined}
        />
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p>
              {lowStock.length} pack size{lowStock.length === 1 ? "" : "s"} at or below{" "}
              {LOW_STOCK_THRESHOLD} units:
            </p>
            <p className="mt-1 font-normal">
              {lowStock
                .slice(0, 6)
                .map((r) => `${r.productName} (${r.label}) — ${r.stock}`)
                .join(" · ")}
              {lowStock.length > 6 ? ` · +${lowStock.length - 6} more` : ""}
            </p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-900/15 bg-white p-12 text-center">
          <PackageX className="mx-auto size-8 text-ink-mute" aria-hidden />
          <h2 className="mt-3 text-lg font-bold text-navy-900">No pack sizes yet</h2>
          <p className="mt-1 text-sm text-ink-mute">Add products to start tracking inventory.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-navy-900/8 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Pack</th>
                  <th className="px-4 py-3 text-right">MRP</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-navy-900/6 last:border-0 hover:bg-navy-50/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-navy-900">{r.productName}</p>
                      <p className="text-xs text-ink-mute">{r.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-navy-900">{formatINR(r.mrp)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-navy-900">
                      {r.stock ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {!r.active ? (
                        <Badge tone="neutral">Inactive</Badge>
                      ) : r.stock == null ? (
                        <Badge tone="neutral">Not tracked</Badge>
                      ) : r.stock === 0 ? (
                        <Badge tone="danger">Out of stock</Badge>
                      ) : r.stock <= LOW_STOCK_THRESHOLD ? (
                        <Badge tone="warning">Low stock</Badge>
                      ) : (
                        <Badge tone="success">In stock</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${r.productId}`}
                        className="text-xs font-bold text-fresh-700 hover:underline"
                      >
                        Edit product
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "warn";
}) {
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-5">
      <p className="text-xs font-bold tracking-wide text-ink-mute uppercase">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone === "warn" ? "text-amber-700" : "text-navy-900"}`}>
        {value}
      </p>
      <p className="text-xs text-ink-mute">{hint}</p>
    </div>
  );
}
