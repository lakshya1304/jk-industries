import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";
import { homeFaqs } from "@/lib/faq";

/**
 * Homepage FAQ teaser.
 *
 * Shows the first three questions — enough to answer the most common doubts and
 * to signal the section exists — and links to /faq for the rest. The full list
 * lives on /faq, which is also the only page carrying FAQPage structured data.
 *
 * Answers are rendered in the HTML inside native `<details>` elements, so they
 * are readable by crawlers rather than only revealed by JavaScript.
 */
export async function FaqTeaser() {
  const settings = await getSettings();
  const faqs = homeFaqs(settings).slice(0, 3);

  return (
    <section className="section bg-white" aria-labelledby="faq-teaser-heading">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
            Questions
          </p>
          <h2
            id="faq-teaser-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-ink-soft">
            Common questions about ordering, wholesale supply and {settings.brandName}.
          </p>
        </Reveal>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={faq.question} delay={i * 0.05}>
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
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 text-center">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
          >
            Read all FAQs
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
