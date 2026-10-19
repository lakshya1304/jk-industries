import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/product-writes";
import { parseImages, formatINR } from "@/lib/utils";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import { Badge, AvailabilityBadge } from "@/components/ui/Badge";
import { NoImage } from "@/components/ui/NoImage";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { BestSellersChart } from "@/components/admin/BestSellersChart";

export const metadata = { title: "Products" };

// The best-sellers chart reads live order data, so this route blocks instead of
// prerendering (it cannot be turned into an instant navigation).
export const instant = false;

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Add, edit, hide or remove products. Only products you mark as active appear on the
            website.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
        >
          <Plus className="size-4" aria-hidden />
          Add product
        </Link>
      </div>

      <BestSellersChart />

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-900/15 bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-navy-900">No products yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
            Add your first product to make it visible on the website catalogue.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-fresh-600 px-5 text-sm font-bold text-white transition-colors hover:bg-fresh-700"
          >
            <Plus className="size-4" aria-hidden />
            Add product
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-navy-900/8 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy-900/8 text-left text-xs font-bold tracking-wide text-ink-mute uppercase">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Pack sizes</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Visible</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const images = parseImages(p.images);
                    const activePacks = p.packSizes.filter((ps) => ps.active);
                    const prices = activePacks.map((ps) => ps.mrp);
                    const range =
                      prices.length === 0
                        ? "—"
                        : Math.min(...prices) === Math.max(...prices)
                          ? formatINR(Math.min(...prices))
                          : `${formatINR(Math.min(...prices))} – ${formatINR(Math.max(...prices))}`;
                    const tracked = activePacks.filter((ps) => ps.stock != null);
                    const totalStock = tracked.reduce((s, ps) => s + (ps.stock ?? 0), 0);
                    return (
                      <tr key={p.id} className="border-b border-navy-900/6 last:border-0 hover:bg-navy-50/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-navy-50">
                              {images[0] ? (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={images[0]}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                </>
                              ) : (
                                <NoImage label={p.name} compact />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-navy-900">{p.name}</p>
                              <p className="truncate text-xs text-ink-mute">
                                {p.sku}
                                {p.featured ? " · Featured" : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {activePacks.length === 0
                            ? "—"
                            : activePacks.map((ps) => ps.label).join(", ")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-navy-900">{range}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {tracked.length === 0 ? (
                            <span className="text-ink-mute">—</span>
                          ) : (
                            <span className="font-semibold text-navy-900">{totalStock}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <AvailabilityBadge availability={p.availability} />
                        </td>
                        <td className="px-4 py-3">
                          {p.active ? (
                            <Badge tone="success">Live</Badge>
                          ) : (
                            <Badge tone="neutral">Hidden</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-100"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              Edit
                            </Link>
                            <ProductRowActions id={p.id} name={p.name} active={p.active} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {products.map((p) => {
              const images = parseImages(p.images);
              const activePacks = p.packSizes.filter((ps) => ps.active);
              const prices = activePacks.map((ps) => ps.mrp);
              const range =
                prices.length === 0
                  ? "—"
                  : Math.min(...prices) === Math.max(...prices)
                    ? formatINR(Math.min(...prices))
                    : `${formatINR(Math.min(...prices))} – ${formatINR(Math.max(...prices))}`;
              const tracked = activePacks.filter((ps) => ps.stock != null);
              const totalStock = tracked.reduce((s, ps) => s + (ps.stock ?? 0), 0);
              return (
                <li key={p.id} className="rounded-2xl border border-navy-900/8 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-navy-50">
                      {images[0] ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={images[0]} alt="" className="size-full object-cover" />
                        </>
                      ) : (
                        <NoImage label={p.name} compact />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-navy-900">{p.name}</p>
                      <p className="text-xs text-ink-mute">
                        {p.sku}
                        {p.featured ? " · Featured" : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <AvailabilityBadge availability={p.availability} />
                        {p.active ? (
                          <Badge tone="success">Live</Badge>
                        ) : (
                          <Badge tone="neutral">Hidden</Badge>
                        )}
                        {tracked.length > 0 && (
                          <Badge tone="navy">Stock {totalStock}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-navy-900/8 pt-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-ink-mute">Pack sizes</dt>
                      <dd className="text-ink-soft">
                        {activePacks.length === 0
                          ? "—"
                          : activePacks.map((ps) => ps.label).join(", ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-ink-mute">Price</dt>
                      <dd className="font-semibold text-navy-900">{range}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-100"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Link>
                    <ProductRowActions id={p.id} name={p.name} active={p.active} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="text-xs text-ink-mute">
        Availability labels: {Object.values(AVAILABILITY_LABELS).join(" · ")}
      </p>
    </div>
  );
}
