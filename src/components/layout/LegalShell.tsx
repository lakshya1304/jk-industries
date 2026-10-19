import { Reveal } from "@/components/ui/Reveal";

/**
 * Consistent shell for legal/policy pages.
 * Policy wording is intentionally general and must be reviewed by JK Industries
 * before publishing — it makes no certification or compliance claims.
 */
export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <Reveal className="mx-auto max-w-3xl">
        <p className="text-xs font-bold tracking-[0.18em] text-fresh-700 uppercase">Policies</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs font-semibold text-ink-mute">Last updated: {updated}</p>
        <p className="mt-5 leading-relaxed text-ink-soft">{intro}</p>
        <div className="prose-policy mt-8 space-y-8">{children}</div>
      </Reveal>
    </div>
  );
}

export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-navy-900">{heading}</h2>
      <div className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
