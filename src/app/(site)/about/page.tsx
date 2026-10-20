import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, MessageCircle, Store, Truck } from "lucide-react";
import { getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";
import { NoImage } from "@/components/ui/NoImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutPageSchema } from "@/lib/seo";
import { generalEnquiryMessage, waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About Us — Manufacturer of Super Cleaner Products",
  description:
    "Super Cleaner is a cleaning and automotive care product range manufactured by JK Industries, supplied to retailers, wholesalers and distributors across India.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Super Cleaner | JK Industries",
    description:
      "Super Cleaner is a cleaning and automotive care product range manufactured by JK Industries and supplied directly to trade partners.",
    url: "/about",
  },
};

const APPROACH = [
  {
    icon: Boxes,
    title: "A practical product range",
    text: "Home cleaning, professional cleaning and automotive care products — all in one catalogue for easy ordering.",
  },
  {
    icon: Truck,
    title: "Wholesale & bulk supply",
    text: "Retailers, shops and distributors can request wholesale pricing, carton quantities and bulk pack sizes.",
  },
  {
    icon: Store,
    title: "Direct manufacturer contact",
    text: "Enquiries reach JK Industries directly, so communication stays clear and quick.",
  },
];

export default async function AboutPage() {
  const [settings, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const waHref = waLink(settings.whatsappNumber, generalEnquiryMessage(settings.brandName));
  const collage = products.slice(0, 4);

  return (
    <div className="pt-24 md:pt-28">
      <JsonLd data={aboutPageSchema(settings)} />
      {/* intro */}
      <section className="section pb-10">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
                About us
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-5xl">
                {settings.brandName}, made by {settings.manufacturerName}.
              </h1>
              <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">{settings.aboutText}</p>
              <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
                This website brings the full range together in one place so trade customers can
                check pack sizes and pricing, build a cart and send order requests in minutes —
                or reach us directly on WhatsApp.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-navy-800"
              >
                Browse products
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-[#062b17] transition-[background-color,transform] duration-200 hover:bg-[#1fbb59] active:scale-[0.97]"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp us
              </a>
            </Reveal>
          </div>

          {/* product collage */}
          <Reveal delay={0.1} className="relative">
            <div className="grid grid-cols-2 gap-4">
              {collage.map((product, i) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-navy-900/8 bg-navy-50 shadow-[0_24px_50px_-30px_rgba(11,31,58,0.45)]"
                >
                  {product.images[0] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full object-cover ${i % 2 === 0 ? "aspect-3/4" : "aspect-3/4 mt-6"}`}
                      />
                    </>
                  ) : (
                    <div className={`w-full ${i % 2 === 0 ? "aspect-3/4" : "aspect-3/4 mt-6"}`}>
                      <NoImage label={product.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* approach */}
      <section className="section bg-white" aria-labelledby="approach-heading">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <h2 id="approach-heading" className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
              How we work with trade partners
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {APPROACH.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 0.08} className="rounded-2xl border border-navy-900/8 bg-surface p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-fresh-50 text-fresh-700 ring-1 ring-fresh-600/15">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">{item.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* range strip */}
      <section className="section" aria-labelledby="range-heading">
        <div className="container-page text-center">
          <Reveal>
            <h2 id="range-heading" className="text-2xl font-extrabold tracking-tight text-navy-900 md:text-3xl">
              The range at a glance
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              {products.length} products currently listed — from floor and dish care to car
              shampoo, dashboard polish and tyre polish.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-navy-900 px-7 text-sm font-bold text-white transition-colors duration-200 hover:bg-navy-800"
            >
              View all products
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
