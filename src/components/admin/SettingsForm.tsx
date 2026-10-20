"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { adminSettingsSchema } from "@/lib/validation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { SiteSettings, WhyChooseItem } from "@/lib/types";

type Errors = Record<string, string>;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    brandName: settings.brandName,
    manufacturerName: settings.manufacturerName,
    tagline: settings.tagline,
    whatsappNumber: settings.whatsappNumber,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    addressLine: settings.addressLine,
    city: settings.city,
    state: settings.state,
    pincode: settings.pincode,
    mapUrl: settings.mapUrl,
    gstin: settings.gstin,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    brandIntro: settings.brandIntro,
    aboutText: settings.aboutText,
    showMRP: settings.showMRP,
    showWholesalePrice: settings.showWholesalePrice,
    showStockBadge: settings.showStockBadge,
    socialInstagram: settings.socialInstagram,
    socialFacebook: settings.socialFacebook,
    socialYoutube: settings.socialYoutube,
  });
  const [benefits, setBenefits] = useState<WhyChooseItem[]>(
    settings.whyChooseItems.length > 0 ? settings.whyChooseItems : [{ title: "", text: "" }]
  );
  const [heroImages, setHeroImages] = useState<string[]>(settings.heroImages);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);
    setSaved(false);

    const payload = {
      ...form,
      heroImages,
      whyChooseItems: benefits.filter((b) => b.title.trim() !== ""),
    };
    const parsed = adminSettingsSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join(".");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.error || "Could not save settings.");
        setSubmitting(false);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSubmitError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Settings</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-fresh-700">Saved ✓</span>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </p>
      )}

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Brand &amp; manufacturer</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand name" htmlFor="brandName" required error={errors.brandName}>
            <Input id="brandName" value={form.brandName} onChange={set("brandName")} invalid={Boolean(errors.brandName)} />
          </Field>
          <Field label="Manufacturer name" htmlFor="manufacturerName" required error={errors.manufacturerName}>
            <Input id="manufacturerName" value={form.manufacturerName} onChange={set("manufacturerName")} invalid={Boolean(errors.manufacturerName)} />
          </Field>
          <Field label="Tagline" htmlFor="tagline" error={errors.tagline} className="sm:col-span-2">
            <Input id="tagline" value={form.tagline} onChange={set("tagline")} invalid={Boolean(errors.tagline)} />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Contact details</h2>
        <p className="-mt-2 text-xs text-ink-mute">
          Shown on the website, WhatsApp links and customer emails.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="whatsappNumber" required error={errors.whatsappNumber} hint="With country code, e.g. 919812345678.">
            <Input id="whatsappNumber" inputMode="tel" value={form.whatsappNumber} onChange={set("whatsappNumber")} invalid={Boolean(errors.whatsappNumber)} />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone}>
            <Input id="contactPhone" inputMode="tel" value={form.contactPhone} onChange={set("contactPhone")} invalid={Boolean(errors.contactPhone)} />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail} className="sm:col-span-2">
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={set("contactEmail")} invalid={Boolean(errors.contactEmail)} />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">Business address</h2>
          <p className="mt-1 text-xs text-ink-mute">
            Used as the manufacturer address on the website contact page and on printed order bills.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line" htmlFor="addressLine" error={errors.addressLine} className="sm:col-span-2">
            <Textarea id="addressLine" value={form.addressLine} onChange={set("addressLine")} invalid={Boolean(errors.addressLine)} rows={2} placeholder="Building / street / area" />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <Input id="city" value={form.city} onChange={set("city")} invalid={Boolean(errors.city)} />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state}>
            <Input id="state" value={form.state} onChange={set("state")} invalid={Boolean(errors.state)} />
          </Field>
          <Field label="PIN code" htmlFor="pincode" error={errors.pincode}>
            <Input id="pincode" inputMode="numeric" value={form.pincode} onChange={set("pincode")} invalid={Boolean(errors.pincode)} />
          </Field>
          <Field
            label="Map link"
            htmlFor="mapUrl"
            error={errors.mapUrl}
            className="sm:col-span-2"
            hint="Optional. Paste a Google Maps share link to pin your exact location. Leave blank to search the address above."
          >
            <Input
              id="mapUrl"
              value={form.mapUrl}
              onChange={set("mapUrl")}
              invalid={Boolean(errors.mapUrl)}
              placeholder="https://maps.app.goo.gl/..."
            />
          </Field>
          <Field label="GSTIN" htmlFor="gstin" error={errors.gstin} hint="Shown on bills when filled.">
            <Input id="gstin" value={form.gstin} onChange={set("gstin")} invalid={Boolean(errors.gstin)} />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Homepage &amp; copy</h2>
        <div className="grid gap-5">
          <Field label="Hero title" htmlFor="heroTitle" error={errors.heroTitle}>
            <Input id="heroTitle" value={form.heroTitle} onChange={set("heroTitle")} invalid={Boolean(errors.heroTitle)} />
          </Field>
          <Field label="Hero subtitle" htmlFor="heroSubtitle" error={errors.heroSubtitle}>
            <Textarea id="heroSubtitle" value={form.heroSubtitle} onChange={set("heroSubtitle")} invalid={Boolean(errors.heroSubtitle)} />
          </Field>
          <Field label="Brand intro (homepage)" htmlFor="brandIntro" error={errors.brandIntro}>
            <Textarea id="brandIntro" value={form.brandIntro} onChange={set("brandIntro")} invalid={Boolean(errors.brandIntro)} />
          </Field>
          <Field label="About text" htmlFor="aboutText" error={errors.aboutText}>
            <Textarea id="aboutText" value={form.aboutText} onChange={set("aboutText")} invalid={Boolean(errors.aboutText)} />
          </Field>
        </div>

        <div className="space-y-3 border-t border-navy-900/8 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-navy-900">“Why choose” benefits</h3>
            <button
              type="button"
              onClick={() => setBenefits((prev) => [...prev, { title: "", text: "" }])}
              disabled={benefits.length >= 8}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-50"
            >
              <Plus className="size-3.5" aria-hidden />
              Add benefit
            </button>
          </div>
          <AnimatePresence initial={false}>
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid gap-3 rounded-xl border border-navy-900/8 bg-navy-50/40 p-3 sm:grid-cols-[1fr_1.6fr_auto] sm:items-end"
              >
                <Field label="Title" htmlFor={`benefit-title-${index}`} error={errors[`whyChooseItems.${index}.title`]}>
                  <Input
                    id={`benefit-title-${index}`}
                    value={benefit.title}
                    onChange={(e) => setBenefits((prev) => prev.map((b, i) => (i === index ? { ...b, title: e.target.value } : b)))}
                  />
                </Field>
                <Field label="Description" htmlFor={`benefit-text-${index}`}>
                  <Input
                    id={`benefit-text-${index}`}
                    value={benefit.text}
                    onChange={(e) => setBenefits((prev) => prev.map((b, i) => (i === index ? { ...b, text: e.target.value } : b)))}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => setBenefits((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove benefit"
                  className="mb-1.5 rounded-lg p-2.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">Homepage hero photos</h2>
          <p className="mt-1 text-xs text-ink-mute">
            These photos rotate automatically on the homepage with a 3D flip. Leave empty to use
            your product photos instead. Up to 8 images.
          </p>
        </div>
        <ImageUploader images={heroImages} onChange={setHeroImages} max={8} />
        {errors.heroImages && (
          <p className="text-xs font-semibold text-red-600">{errors.heroImages}</p>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Price &amp; stock visibility</h2>
        <div className="space-y-3">
          <Checkbox label="Show MRP to customers" checked={form.showMRP} onChange={(e) => setForm((f) => ({ ...f, showMRP: e.target.checked }))} />
          <Checkbox label="Show wholesale prices publicly" checked={form.showWholesalePrice} onChange={(e) => setForm((f) => ({ ...f, showWholesalePrice: e.target.checked }))} />
          <Checkbox label="Show stock availability badges" checked={form.showStockBadge} onChange={(e) => setForm((f) => ({ ...f, showStockBadge: e.target.checked }))} />
        </div>
        <p className="text-xs text-ink-mute">
          Wholesale pricing is advisory and confirmed by your team. Taxes and shipping are agreed
          at order confirmation — there is no fixed tax or shipping configuration in this MVP.
        </p>
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-extrabold text-navy-900">Appearance</h2>
          <p className="mt-1 text-xs text-ink-mute">
            Choose how the site looks. This is saved in your browser and applies to the storefront
            and this dashboard.
          </p>
        </div>
        <ThemeToggle variant="inline" />
      </section>

      <section className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-5 md:p-6">
        <h2 className="text-base font-extrabold text-navy-900">Social links</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Instagram URL" htmlFor="socialInstagram" error={errors.socialInstagram}>
            <Input id="socialInstagram" type="url" value={form.socialInstagram} onChange={set("socialInstagram")} placeholder="https://" />
          </Field>
          <Field label="Facebook URL" htmlFor="socialFacebook" error={errors.socialFacebook}>
            <Input id="socialFacebook" type="url" value={form.socialFacebook} onChange={set("socialFacebook")} placeholder="https://" />
          </Field>
          <Field label="YouTube URL" htmlFor="socialYoutube" error={errors.socialYoutube}>
            <Input id="socialYoutube" type="url" value={form.socialYoutube} onChange={set("socialYoutube")} placeholder="https://" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
