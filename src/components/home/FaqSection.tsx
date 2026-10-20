import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";
import { homeFaqs } from "@/lib/faq";

/**
 * Homepage FAQ.
 *
 * Renders the questions visibly and uses native `<details>` accordions, which
 * means the answers are present in the HTML (not revealed only by JavaScript)
 * and are readable by crawlers. FAQPage structured data is emitted separately
 * from the same `homeFaqs()` source, so markup and page always agree.
 */
export async function FaqSection() {
  const settings = await getSettings();
  const faqs = homeFaqs(settings);

  return (
    <section className="section bg-white" aria-labelledby="faq-heading">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
            Questions
          </p>
          <h2
            id="faq-heading"
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
      </div>
    </section>
  );
}
