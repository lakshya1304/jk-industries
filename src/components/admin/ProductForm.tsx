"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import { productInputSchema } from "@/lib/validation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { AdminProduct } from "@/components/admin/types";

type PackDraft = {
  id?: string;
  label: string;
  mrp: string;
  wholesalePrice: string;
  active: boolean;
};

type FieldErrors = Record<string, string>;

const emptyPack: PackDraft = { label: "", mrp: "", wholesalePrice: "", active: true };

export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    usage: product?.usage ?? "",
    minOrderQty: String(product?.minOrderQty ?? 1),
    unitsPerCarton: product?.unitsPerCarton != null ? String(product.unitsPerCarton) : "",
    availability: product?.availability ?? "in_stock",
    sortOrder: String(product?.sortOrder ?? 0),
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    showPrice: product?.showPrice ?? true,
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [packSizes, setPackSizes] = useState<PackDraft[]>(
    product && product.packSizes.length > 0
      ? product.packSizes.map((p) => ({
          id: p.id,
          label: p.label,
          mrp: String(p.mrp),
          wholesalePrice: p.wholesalePrice != null ? String(p.wholesalePrice) : "",
          active: p.active,
        }))
      : [{ ...emptyPack }]
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setPack = (index: number, patch: Partial<PackDraft>) =>
    setPackSizes((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      usage: form.usage,
      images,
      minOrderQty: form.minOrderQty === "" ? 1 : Number(form.minOrderQty),
      unitsPerCarton: form.unitsPerCarton === "" ? null : Number(form.unitsPerCarton),
      availability: form.availability,
      featured: form.featured,
      active: form.active,
      showPrice: form.showPrice,
      sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
      packSizes: packSizes.map((p) => ({
        id: p.id,
        label: p.label,
        mrp: p.mrp === "" ? 0 : Number(p.mrp),
        wholesalePrice: p.wholesalePrice === "" ? null : Number(p.wholesalePrice),
        active: p.active,
      })),
    };

    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const [head, index, field] = issue.path;
        if (head === "packSizes" && typeof index === "number") {
          const key = `packSizes.${index}.${String(field)}`;
          if (!next[key]) next[key] = issue.message;
        } else {
          const key = String(head);
          if (!next[key]) next[key] = issue.message;
        }
      }
      setErrors(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.error || "Could not save the product. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setSubmitError("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
          {isEdit ? "Edit product" : "Add product"}
        </h1>
        <Link href="/admin/products" className="text-sm font-bold text-fresh-700 hover:underline">
          ← Back to products
        </Link>
      </div>

      {submitError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Product details</h2>
            <Field label="Product name" htmlFor="name" required error={errors.name}>
              <Input id="name" value={form.name} onChange={set("name")} invalid={Boolean(errors.name)} />
            </Field>
            <Field label="SKU / product code" htmlFor="sku" required error={errors.sku} hint="Unique code, e.g. SC-FC-001.">
              <Input id="sku" value={form.sku} onChange={set("sku")} invalid={Boolean(errors.sku)} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description}>
              <Textarea id="description" value={form.description} onChange={set("description")} invalid={Boolean(errors.description)} />
            </Field>
            <Field label="How to use" htmlFor="usage" error={errors.usage} hint="Shown on the product page as instructions.">
              <Textarea id="usage" value={form.usage} onChange={set("usage")} invalid={Boolean(errors.usage)} />
            </Field>
          </section>

          <section className="space-y-4 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-navy-900">Pack sizes &amp; pricing</h2>
              <button
                type="button"
                onClick={() => setPackSizes((prev) => [...prev, { ...emptyPack }])}
                disabled={packSizes.length >= 12}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-50"
              >
                <Plus className="size-3.5" aria-hidden />
                Add pack size
              </button>
            </div>

            {errors.packSizes && <p className="text-xs font-semibold text-red-600">{errors.packSizes}</p>}

            <AnimatePresence initial={false}>
              {packSizes.map((pack, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-navy-900/8 bg-navy-50/40 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
                    <Field label="Pack size" htmlFor={`pack-label-${index}`} required error={errors[`packSizes.${index}.label`]}>
                      <Input id={`pack-label-${index}`} value={pack.label} onChange={(e) => setPack(index, { label: e.target.value })} placeholder="500 ml" />
                    </Field>
                    <Field label="MRP (₹)" htmlFor={`pack-mrp-${index}`} required error={errors[`packSizes.${index}.mrp`]}>
                      <Input id={`pack-mrp-${index}`} inputMode="decimal" value={pack.mrp} onChange={(e) => setPack(index, { mrp: e.target.value })} placeholder="99" />
                    </Field>
                    <Field label="Wholesale (₹)" htmlFor={`pack-wholesale-${index}`} error={errors[`packSizes.${index}.wholesalePrice`]}>
                      <Input id={`pack-wholesale-${index}`} inputMode="decimal" value={pack.wholesalePrice} onChange={(e) => setPack(index, { wholesalePrice: e.target.value })} placeholder="optional" />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setPackSizes((prev) => prev.filter((_, i) => i !== index))}
                      disabled={packSizes.length <= 1}
                      aria-label="Remove pack size"
                      className="mb-1.5 rounded-lg p-2.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-2 pl-1">
                    <Checkbox
                      label="Available"
                      checked={pack.active}
                      onChange={(e) => setPack(index, { active: e.target.checked })}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Images</h2>
            <ImageUploader images={images} onChange={setImages} />
          </section>

          <section className="space-y-4 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
            <h2 className="text-base font-extrabold text-navy-900">Availability &amp; visibility</h2>
            <Field label="Availability" htmlFor="availability">
              <Select id="availability" value={form.availability} onChange={set("availability")}>
                {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Min. order qty" htmlFor="minOrderQty" error={errors.minOrderQty}>
                <Input id="minOrderQty" inputMode="numeric" value={form.minOrderQty} onChange={set("minOrderQty")} />
              </Field>
              <Field label="Units / carton" htmlFor="unitsPerCarton" error={errors.unitsPerCarton}>
                <Input id="unitsPerCarton" inputMode="numeric" value={form.unitsPerCarton} onChange={set("unitsPerCarton")} placeholder="optional" />
              </Field>
            </div>
            <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder} hint="Lower numbers appear first.">
              <Input id="sortOrder" inputMode="numeric" value={form.sortOrder} onChange={set("sortOrder")} />
            </Field>
            <div className="space-y-3 pt-1">
              <Checkbox label="Active — visible on the website" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              <Checkbox label="Featured on the homepage" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              <Checkbox label="Show prices to customers" checked={form.showPrice} onChange={(e) => setForm((f) => ({ ...f, showPrice: e.target.checked }))} />
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-navy-900/8 bg-white/90 p-4 backdrop-blur">
        <Link
          href="/admin/products"
          className="inline-flex h-11 items-center rounded-full border border-navy-900/15 px-5 text-sm font-bold text-navy-900 transition-colors hover:bg-navy-50"
        >
          Cancel
        </Link>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
