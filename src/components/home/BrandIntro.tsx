import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Handshake } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";

const POINTS = [
  {
    icon: Boxes,
    title: "Home, professional & automotive care",
    text: "One range covering everyday cleaning and vehicle care products.",
  },
  {
    icon: Handshake,
    title: "Built for trade partners",
    text: "Retailers, wholesalers and distributors deal directly with the manufacturer.",
  },
  {
    icon: BadgeCheck,
    title: "Clear, editable information",
    text: "Pack sizes, MRP and availability are maintained by JK Industries.",
  },
];

export async function BrandIntro() {
  const settings = await getSettings();

  return (
    <section className="section overflow-hidden bg-white" aria-labelledby="brand-intro-heading">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* brand collage */}
        <Reveal className="relative order-2 lg:order-1" y={36}>
          <div className="relative mx-auto max-w-lg" style={{ perspective: "1200px" }}>
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-navy-900/8 bg-[linear-gradient(140deg,var(--color-navy-900),var(--color-navy-800)_55%,var(--color-fresh-700))] p-8 text-center shadow-[0_40px_80px_-45px_rgba(11,31,58,0.6)]">
              <span className="grid size-16 place-items-center rounded-2xl bg-white/10 text-fresh-300 ring-1 ring-white/20 backdrop-blur">
                <Boxes className="size-8" aria-hidden />
              </span>
              <p className="text-lg font-extrabold text-white">{settings.brandName} range</p>
              <p className="max-w-xs text-sm text-white/70">
                Cleaning &amp; automotive care products from {settings.manufacturerName}. Product
                photographs are being prepared — real photos appear here once uploaded.
              </p>
            </div>
            <div className="absolute -top-5 -left-3 rounded-2xl border border-navy-900/8 bg-white px-4 py-3 shadow-[0_20px_40px_-24px_rgba(11,31,58,0.45)] sm:-left-6">
              <p className="text-[10px] font-bold tracking-[0.16em] text-fresh-700 uppercase">
                Manufacturer
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-navy-900">
                {settings.manufacturerName}
              </p>
            </div>
          </div>
        </Reveal>

        {/* copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
              The brand
            </p>
            <h2
              id="brand-intro-heading"
              className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl"
            >
              Behind {settings.brandName} is {settings.manufacturerName}.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">{settings.brandIntro}</p>
          </Reveal>

          <ul className="mt-8 space-y-5">
            {POINTS.map((point, i) => (
              <Reveal as="li" key={point.title} delay={0.1 + i * 0.08}>
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fresh-50 text-fresh-700 ring-1 ring-fresh-600/15">
                    <point.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-navy-900">{point.title}</h3>
                    <p className="mt-1 text-sm text-ink-mute">{point.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.3} className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-navy-800"
            >
              About us
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-full border border-navy-900/15 px-6 text-sm font-bold text-navy-900 transition-colors duration-200 hover:border-navy-900/40 hover:bg-navy-50"
            >
              Contact us
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
