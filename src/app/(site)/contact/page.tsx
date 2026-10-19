import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { Reveal } from "@/components/ui/Reveal";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact & Dealership Enquiries",
  description:
    "Contact JK Industries for Super Cleaner product enquiries, wholesale pricing, bulk orders and dealership details.",
};

type SearchParams = Promise<{ type?: string }>;

export default function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">Contact</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-5xl">
          Talk to us about your requirement
        </h1>
        <p className="mt-4 text-ink-soft">
          Product enquiries, wholesale pricing, bulk orders or dealership details — send us a
          message and our team will respond on the number you provide.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12">
        <Suspense fallback={<div className="skeleton h-40 rounded-2xl" aria-hidden />}>
          <ContactDetails />
        </Suspense>
        <Suspense fallback={<div className="skeleton h-[34rem] rounded-2xl" aria-hidden />}>
          <ContactForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ContactDetails() {
  const settings = await getSettings();
  const waHref = waLink(settings.whatsappNumber, generalEnquiryMessage(settings.brandName));

  return (
    <Reveal className="space-y-4">
      <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
        <h2 className="text-base font-extrabold text-navy-900">Reach {settings.manufacturerName}</h2>
        <ul className="mt-5 space-y-4 text-sm">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 size-4.5 shrink-0 text-fresh-700" aria-hidden />
            <span className="text-ink-soft">
              {settings.addressLine}
              <br />
              {settings.city}, {settings.state} {settings.pincode}
              {settings.gstin ? (
                <>
                  <br />
                  <span className="text-xs text-ink-mute">GSTIN: {settings.gstin}</span>
                </>
              ) : null}
            </span>
          </li>
          {settings.contactPhone ? (
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4.5 shrink-0 text-fresh-700" aria-hidden />
              <a
                href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`}
                className="font-semibold text-navy-900 transition-colors hover:text-fresh-700"
              >
                {settings.contactPhone}
              </a>
            </li>
          ) : null}
          {settings.contactEmail ? (
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4.5 shrink-0 text-fresh-700" aria-hidden />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="font-semibold break-all text-navy-900 transition-colors hover:text-fresh-700"
              >
                {settings.contactEmail}
              </a>
            </li>
          ) : null}
          <li className="flex gap-3">
            <Clock className="mt-0.5 size-4.5 shrink-0 text-fresh-700" aria-hidden />
            <span className="text-ink-soft">Enquiries answered on working days.</span>
          </li>
        </ul>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
        >
          <MessageCircle className="size-4.5" aria-hidden />
          Chat on WhatsApp
        </a>
      </div>

      <div className="rounded-2xl border border-navy-900/8 bg-navy-50/70 p-6">
        <h2 className="text-sm font-extrabold text-navy-900">Looking to stock Super Cleaner?</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Choose <strong>Dealership Enquiry</strong> or <strong>Wholesale / Bulk Supply</strong>{" "}
          in the form and tell us your city and expected volumes.
        </p>
      </div>
    </Reveal>
  );
}

async function ContactForm({ searchParams }: { searchParams: SearchParams }) {
  const [{ type }, settings] = await Promise.all([searchParams, getSettings()]);
  return (
    <Reveal delay={0.1}>
      <EnquiryForm
        initialType={type}
        brandName={settings.brandName}
        whatsappNumber={settings.whatsappNumber}
      />
    </Reveal>
  );
}
