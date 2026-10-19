"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { NoImage } from "@/components/ui/NoImage";
import { INDIAN_STATES } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { orderRequestSchema } from "@/lib/validation";
import type { SiteSettings } from "@/lib/types";

type FieldErrors = Partial<Record<string, string>>;

export function CheckoutClient({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();

  const [form, setForm] = useState({
    customerName: "",
    businessName: "",
    mobile: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientTokenRef = useRef<string | null>(null);
  const getClientToken = () => {
    if (!clientTokenRef.current) {
      clientTokenRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return clientTokenRef.current;
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      map.set(item.productId, [...(map.get(item.productId) ?? []), item]);
    }
    return [...map.entries()];
  }, [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        packSizeId: i.packSizeId,
        quantity: i.quantity,
      })),
      customerName: form.customerName,
      businessName: form.businessName,
      mobile: form.mobile,
      email: form.email,
      gstin: form.gstin,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      notes: form.notes,
      clientToken: getClientToken(),
    };

    const parsed = orderRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website: form.website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          data?.error || "We could not submit your order request. Please try again."
        );
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/order-confirmation/${data.reference}`);
    } catch {
      setSubmitError(
        "A network error occurred. Your cart is safe — please try again."
      );
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-3xl border border-navy-900/8 bg-white px-8 py-16 text-center">
        <span className="grid size-18 place-items-center rounded-full bg-navy-50">
          <ShoppingCart className="size-7 text-navy-600" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-ink-mute">
            Add products from the catalogue, then come back here to send your order request.
          </p>
        </div>
        <Button href="/products">
          Browse Products
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
      {/* ---------------- form ---------------- */}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <section aria-labelledby="cart-items-heading" className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
          <h2 id="cart-items-heading" className="text-base font-extrabold text-navy-900">
            Your items{" "}
            <span className="font-semibold text-ink-mute">
              ({totalItems} total)
            </span>
          </h2>
          <ul className="mt-4 divide-y divide-navy-900/6">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={`${item.productId}::${item.packSizeId}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 py-4"
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-navy-50">
                    {item.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt="" className="size-full object-cover" />
                      </>
                    ) : (
                      <NoImage label={item.name} compact />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="block truncate text-sm font-bold text-navy-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-mute">
                      {item.packLabel} · {formatINR(item.mrp)} each
                    </p>
                  </div>
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.productId, item.packSizeId, q)}
                  />
                  <span className="w-20 text-right text-sm font-bold text-navy-900">
                    {formatINR(item.mrp * item.quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.productId, item.packSizeId)}
                    className="rounded-full p-2 text-ink-mute transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <Link
            href="/products"
            className="mt-3 inline-block text-sm font-semibold text-fresh-700 underline-offset-4 hover:underline"
          >
            + Add more products
          </Link>
        </section>

        <section aria-labelledby="customer-details-heading" className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
          <h2 id="customer-details-heading" className="text-base font-extrabold text-navy-900">
            Your details
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="customerName" required error={errors.customerName}>
              <Input
                id="customerName"
                name="customerName"
                autoComplete="name"
                value={form.customerName}
                onChange={set("customerName")}
                invalid={Boolean(errors.customerName)}
              />
            </Field>
            <Field label="Shop / business name" htmlFor="businessName" error={errors.businessName}>
              <Input
                id="businessName"
                name="businessName"
                autoComplete="organization"
                value={form.businessName}
                onChange={set("businessName")}
                invalid={Boolean(errors.businessName)}
              />
            </Field>
            <Field label="Mobile number" htmlFor="mobile" required error={errors.mobile}>
              <Input
                id="mobile"
                name="mobile"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98XXXXXXXX"
                value={form.mobile}
                onChange={set("mobile")}
                invalid={Boolean(errors.mobile)}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                invalid={Boolean(errors.email)}
              />
            </Field>
            <Field label="GSTIN" htmlFor="gstin" error={errors.gstin} hint="Add it if you need a GST invoice.">
              <Input
                id="gstin"
                name="gstin"
                value={form.gstin}
                onChange={set("gstin")}
                invalid={Boolean(errors.gstin)}
              />
            </Field>
            <Field label="PIN code" htmlFor="pincode" required error={errors.pincode}>
              <Input
                id="pincode"
                name="pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={form.pincode}
                onChange={set("pincode")}
                invalid={Boolean(errors.pincode)}
              />
            </Field>
            <Field label="Delivery address" htmlFor="address" required error={errors.address} className="sm:col-span-2">
              <Textarea
                id="address"
                name="address"
                autoComplete="street-address"
                value={form.address}
                onChange={set("address")}
                invalid={Boolean(errors.address)}
              />
            </Field>
            <Field label="City" htmlFor="city" required error={errors.city}>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={form.city}
                onChange={set("city")}
                invalid={Boolean(errors.city)}
              />
            </Field>
            <Field label="State" htmlFor="state" required error={errors.state}>
              <Select
                id="state"
                name="state"
                value={form.state}
                onChange={set("state")}
                invalid={Boolean(errors.state)}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
              <Textarea
                id="notes"
                name="notes"
                placeholder="Delivery instructions, preferred pack mix, invoice needs…"
                value={form.notes}
                onChange={set("notes")}
                invalid={Boolean(errors.notes)}
              />
            </Field>
          </div>

          {/* honeypot */}
          <div className="sr-only" aria-hidden>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={set("website")}
            />
          </div>
        </section>

        {submitError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Order Request"}
          {!submitting && <ArrowRight className="size-4.5" aria-hidden />}
        </Button>
      </form>

      {/* ---------------- summary ---------------- */}
      <aside aria-label="Order summary" className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
          <h2 className="text-base font-extrabold text-navy-900">Order summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            {grouped.map(([productId, group]) => (
              <div key={productId} className="flex items-start justify-between gap-3">
                <dt className="text-ink-soft">
                  {group[0].name}
                  <span className="block text-xs text-ink-mute">
                    {group.map((g) => `${g.packLabel} × ${g.quantity}`).join(", ")}
                  </span>
                </dt>
                <dd className="shrink-0 font-semibold text-navy-900">
                  {formatINR(group.reduce((s, g) => s + g.mrp * g.quantity, 0))}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-navy-900/8 pt-4">
            <span className="text-sm font-bold text-navy-900">Estimated subtotal</span>
            <span className="text-xl font-extrabold text-navy-900">{formatINR(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-mute">
            This is an order <strong>request</strong>, not a confirmed invoice. Wholesale
            pricing, taxes, shipping and payment terms are confirmed by{" "}
            {settings.manufacturerName} before dispatch. No online payment is collected.
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-mute">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-fresh-700" aria-hidden />
            Your details are used only to process this enquiry. See our{" "}
            <Link href="/privacy" className="font-semibold text-fresh-700 underline-offset-2 hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}
