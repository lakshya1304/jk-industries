import Link from "next/link";
import { ArrowRight, BookOpen, HelpCircle, Info, PackageSearch, Truck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Homepage "explore more" strip.
 *
 * The homepage is an overview, so the sections that used to be full blocks
 * (policy, catalogue depth, company detail) are represented here as a short
 * card grid that links into the dedicated page for each. This keeps the front
 * page scannable while leaving every route one click away — and gives the
 * deeper pages a real internal link from the highest-authority URL on the site.
 */
const ENTRIES = [
  {
    href: "/products",
    icon: PackageSearch,
    title: "Full product catalogue",
    text: "Every product with pack sizes, MRP and wholesale options in one place.",
  },
  {
    href: "/about",
    icon: Info,
    title: "About JK Industries",
    text: "Who manufactures the range and how we work with trade partners.",
  },
  {
    href: "/faq",
    icon: HelpCircle,
    title: "FAQs",
    text: "Ordering, wholesale supply, payments and order tracking.",
  },
  {
    href: "/shipping-returns",
    icon: Truck,
    title: "Shipping & returns",
    text: "How order requests are confirmed, dispatched and handled.",
  },
  {
    href: "/track",
    icon: BookOpen,
    title: "Track an order",
    text: "Check the current status of an order request with your reference.",
  },
  {
    href: "/contact",
    icon: ArrowRight,
    title: "Contact us",
    text: "Send an enquiry, request a quote or reach us on WhatsApp.",
  },
];

export function ExploreMore() {
  return (
    <section className="section" aria-labelledby="explore-heading">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
            Explore
          </p>
          <h2
            id="explore-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl"
          >
            Everything else, one click away
          </h2>
          <p className="mt-3 text-ink-soft">
            The detail lives on its own page — pick where you want to go next.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTRIES.map((entry, i) => (
            <Reveal as="li" key={entry.href} delay={i * 0.05} className="h-full">
              <Link
                href={entry.href}
                className="group flex h-full flex-col rounded-2xl border border-navy-900/8 bg-white p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-navy-900/16 hover:shadow-[0_24px_50px_-30px_rgba(11,31,58,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-600"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-fresh-50 text-fresh-700 ring-1 ring-fresh-600/15">
                  <entry.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy-900">{entry.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">{entry.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-fresh-700">
                  Open
                  <ArrowRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
