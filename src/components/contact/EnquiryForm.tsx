"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ENQUIRY_TYPES, INDIAN_STATES } from "@/lib/constants";
import { enquirySchema } from "@/lib/validation";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";

type FieldErrors = Partial<Record<string, string>>;

export function EnquiryForm({
  initialType = "contact",
  brandName,
  whatsappNumber,
}: {
  initialType?: string;
  brandName: string;
  whatsappNumber: string;
}) {
  const [form, setForm] = useState({
    type: ENQUIRY_TYPES.some((t) => t.value === initialType) ? initialType : "contact",
    name: "",
    businessName: "",
    mobile: "",
    email: "",
    city: "",
    state: "",
    message: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "success">("idle");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const parsed = enquirySchema.safeParse({
      type: form.type,
      name: form.name,
      businessName: form.businessName,
      mobile: form.mobile,
      email: form.email,
      city: form.city,
      state: form.state,
      message: form.message,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website: form.website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.error || "We could not save your enquiry. Please try again.");
        setState("idle");
        return;
      }
      setState("success");
    } catch {
      setSubmitError("A network error occurred. Please try again or WhatsApp us.");
      setState("idle");
    }
  }

  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-5 md:p-7">
      <AnimatePresence mode="wait" initial={false}>
        {state === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <span className="grid size-16 place-items-center rounded-full bg-fresh-600 text-white shadow-[0_18px_40px_-18px_rgba(22,163,74,0.9)]">
              <Check className="size-7" strokeWidth={3} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-navy-900">Enquiry saved</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
                Thank you! Your enquiry has been recorded and our team will get back to you on
                the mobile number you shared.
              </p>
            </div>
            <a
              href={waLink(whatsappNumber, generalEnquiryMessage(brandName))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition hover:bg-[#1fbb59]"
            >
              <MessageCircle className="size-4" aria-hidden />
              Also message us on WhatsApp
            </a>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={false}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <Field label="Enquiry type" htmlFor="type" required>
              <Select id="type" name="type" value={form.type} onChange={set("type")}>
                {ENQUIRY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="name" required error={errors.name}>
                <Input id="name" name="name" autoComplete="name" value={form.name} onChange={set("name")} invalid={Boolean(errors.name)} />
              </Field>
              <Field label="Shop / business name" htmlFor="businessName" error={errors.businessName}>
                <Input id="businessName" name="businessName" autoComplete="organization" value={form.businessName} onChange={set("businessName")} invalid={Boolean(errors.businessName)} />
              </Field>
              <Field label="Mobile number" htmlFor="mobile" required error={errors.mobile}>
                <Input id="mobile" name="mobile" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" value={form.mobile} onChange={set("mobile")} invalid={Boolean(errors.mobile)} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email}>
                <Input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} invalid={Boolean(errors.email)} />
              </Field>
              <Field label="City" htmlFor="city" error={errors.city}>
                <Input id="city" name="city" autoComplete="address-level2" value={form.city} onChange={set("city")} invalid={Boolean(errors.city)} />
              </Field>
              <Field label="State" htmlFor="state" error={errors.state}>
                <Select id="state" name="state" value={form.state} onChange={set("state")} invalid={Boolean(errors.state)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Message" htmlFor="message" required error={errors.message}>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us what you need — products, quantities, delivery city…"
                value={form.message}
                onChange={set("message")}
                invalid={Boolean(errors.message)}
              />
            </Field>

            {/* honeypot */}
            <div className="sr-only" aria-hidden>
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {submitError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={state === "submitting"}>
              {state === "submitting" ? "Sending…" : "Submit Enquiry"}
              {state !== "submitting" && <Send className="size-4" aria-hidden />}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
