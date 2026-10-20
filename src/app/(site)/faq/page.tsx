import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo";
import { faqSections } from "@/lib/faq";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQs — Ordering, Wholesale & Support",
  description:
    "Answers to common questions about Super Cleaner products: how to place an order request, wholesale and bulk pricing, payment, order tracking and contacting JK Industries.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions | Super Cleaner",
    description:
      "How to order, wholesale and bulk supply, payment and order tracking — answered by JK Industries.",
    url: "/faq",
  },
};

export default async function FaqPage() {
  const settings = await getSettings();
  const groups = faqSections(settings);
  // Flattened back to a single list for the structured data, so the markup
  // covers exactly the questions and answers rendered below — the section
  // headings are presentational and must not appear in the Question nodes.
  const allItems = groups.flatMap((g) => g.items);
  const waHref = waLink(settings.whatsappNumber, generalEnquiryMessage(settings.brandName));

  return (
    <div className="pt-24 md:pt-28">
      <JsonLd data={faqPageSchema(settings, allItems)} />

      <section className="section pb-10" aria-labelledby="faq-page-heading">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
              Help centre
            </p>
            <h1
              id="faq-page-heading"
              className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-5xl"
            >
              Frequently asked questions
            </h1>
            <p className="mt-4 text-ink-soft">
              Ordering, wholesale supply, payment and support for {settings.brandName} products
              from {settings.manufacturerName}.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="container-page mx-auto max-w-3xl space-y-12">
          {groups.map((group, gi) => {
            const headingId = `faq-group-${gi}`;
            return (
              <div key={group.title} aria-labelledby={headingId}>
                <Reveal>
                  <h2
                    id={headingId}
                    className="text-lg font-extrabold tracking-tight text-navy-900"
                  >
                    {group.title}
                  </h2>
                </Reveal>
                <div className="mt-4 space-y-3">
                  {group.items.map((faq, i) => (
                    <Reveal key={faq.question} delay={i * 0.04}>
                      <details className="group rounded-2xl border border-navy-900/8 bg-surface px-5 py-4 transition-colors open:border-navy-900/16">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-bold text-navy-900 marker:hidden [&::-webkit-details-marker]:hidden">
                          {faq.question}
                          <span
                            aria-hidden
                            className="grid size-6 shrink-0 place-items-center rounded-full bg-navy-900/6 text-navy-900 transition-transform duration-300 group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          {faq.answer}
                        </p>
                      </details>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}

          <Reveal>
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6 text-center md:p-8">
              <h2 className="text-lg font-extrabold tracking-tight text-navy-900">
                Still have a question?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                Send your requirement to {settings.manufacturerName} and the team will get back to
                you with pricing and availability.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp us
                </a>
                <Link
                  href="/contact"
                  className="inline-flex h-11 items-center rounded-full border border-navy-900/15 bg-white px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
                >
                  Contact page
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
