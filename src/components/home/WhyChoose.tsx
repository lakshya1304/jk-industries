import { Boxes, LayoutGrid, PhoneCall, Store, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Reveal } from "@/components/ui/Reveal";

const ICONS = [LayoutGrid, Boxes, Truck, Store, PhoneCall];

export async function WhyChoose() {
  const settings = await getSettings();
  const items = settings.whyChooseItems;

  return (
    <section className="section bg-navy-50/60" aria-labelledby="why-choose-heading">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">
            Why choose {settings.brandName}
          </p>
          <h2
            id="why-choose-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl"
          >
            Supply that fits how you buy
          </h2>
          <p className="mt-3 text-ink-soft">
            Business benefits maintained by {settings.manufacturerName} — shown exactly as
            verified.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal
                as="li"
                key={`${item.title}-${i}`}
                delay={i * 0.07}
                className="h-full rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.04)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-navy-900/14 hover:shadow-[0_24px_48px_-28px_rgba(11,31,58,0.35)]"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-navy-900 text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-mute">{item.text}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
