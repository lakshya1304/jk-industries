import Link from "next/link";
import { cacheLife } from "next/cache";
import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { waLink } from "@/lib/whatsapp";
import { mapsHref } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

const SHOP_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/track", label: "Track Order" },
  { href: "/cart", label: "Your Cart" },
  { href: "/faq", label: "FAQs" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

/** `/admin` redirects to the login page. */
const ADMIN_LINK = { href: "/admin/login", label: "Admin Login" };

/** Support hours. Static by design — there is no backend field for them. */
const SUPPORT_HOURS = "Mon–Sat, 9:00 am – 7:00 pm IST";

type LinkItem = { href: string; label: string };

/**
 * One footer link. Kept local so every column shares identical hover,
 * focus-visible and contrast behaviour instead of repeating class strings.
 */
function FooterLink({ href, label }: LinkItem) {
  return (
    <li>
      <Link
        href={href}
        className="inline-flex rounded-sm text-sm leading-6 text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
      >
        {label}
      </Link>
    </li>
  );
}

/** A titled link column. The wrapper is a `nav` so screen readers can jump to it. */
function LinkColumn({ title, links }: { title: string; links: LinkItem[] }) {
  const headingId = `footer-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <nav aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xs font-bold tracking-[0.14em] text-white/90 uppercase"
      >
        {title}
      </h2>
      <ul className="mt-4 space-y-1.5">
        {links.map((l) => (
          <FooterLink key={l.href} {...l} />
        ))}
      </ul>
    </nav>
  );
}

/**
 * Current year, cached so the footer can be part of the static shell without
 * reading an unstable value (current time) during prerendering.
 */
async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({ settings }: { settings: SiteSettings }) {
  const year = await copyrightYear();
  const whatsappHref = waLink(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like more information about your products.`
  );
  const mapsUrl = mapsHref(settings);
  const telHref = settings.contactPhone
    ? `tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`
    : null;
  const hasSocial = Boolean(
    settings.socialInstagram || settings.socialFacebook || settings.socialYoutube
  );

  return (
    <footer className="bg-navy-950 text-white">
      {/*
        Mobile-first: one column, then two at `sm`, then a 12-column grid at
        `lg` where the brand block takes a third and the three link columns and
        contact block share the rest. Padding and the divider spacing scale with
        the breakpoint so the footer does not feel cramped on a phone.
      */}
      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <BrandLogo
              brandName={settings.brandName}
              manufacturerName={settings.manufacturerName}
              tone="light"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
              {settings.tagline}
            </p>
            <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-white/45 uppercase">
              Manufactured by {settings.manufacturerName}
            </p>
            {settings.gstin ? (
              <p className="mt-1 text-xs text-white/45">GSTIN: {settings.gstin}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-[#062b17] transition-colors hover:bg-[#1fbb59] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
              >
                <MessageCircle className="size-4" aria-hidden />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <LinkColumn title="Shop" links={SHOP_LINKS} />
          </div>

          <div className="lg:col-span-2">
            <LinkColumn
              title="Company"
              links={[...COMPANY_LINKS, ADMIN_LINK]}
            />
          </div>

          <div className="lg:col-span-2">
            <LinkColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          {/* Contact — replaces the old `<address>` soup with labelled rows so
              each detail is scannable and each one is its own tap target. */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h2
              id="footer-contact"
              className="text-xs font-bold tracking-[0.14em] text-white/90 uppercase"
            >
              Contact
            </h2>
            <ul aria-labelledby="footer-contact" className="mt-4 space-y-3 text-sm">
              {/*
                The address opens Google Maps. It is an external link, so it
                gets target/rel and a screen-reader cue that it leaves the site.
                With no usable address or map link configured, plain text is
                rendered instead so visitors never land on an empty map search.
              */}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    /*
                      No `aria-label` or `title` here on purpose. The link has two
                      sources of text content (the address and the "opens in
                      Google Maps" screen-reader span), and axe flags any
                      `title` that does not literally contain the visible label
                      as a "label-content-name-mismatch" — which is exactly what
                      happened with title="Open in Google Maps". The visible
                      address is already the accessible name, and the trailing
                      sr-only text explains the new tab, so the cue is present
                      without contradicting the label.
                    */
                    className="rounded-sm text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                  >
                    <address className="not-italic">
                      {settings.addressLine}
                      <br />
                      {settings.city}, {settings.state} {settings.pincode}
                    </address>
                    <span className="sr-only">— opens in Google Maps</span>
                  </a>
                ) : (
                  <address className="text-white/65 not-italic">
                    {settings.addressLine}
                    <br />
                    {settings.city}, {settings.state} {settings.pincode}
                  </address>
                )}
              </li>

              {settings.contactPhone && telHref ? (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
                  <a
                    href={telHref}
                    className="rounded-sm text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
              ) : null}

              {settings.contactEmail ? (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="rounded-sm break-all text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                  >
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}

              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-white/45" aria-hidden />
                <span className="text-white/65">{SUPPORT_HOURS}</span>
              </li>
            </ul>

            {hasSocial ? (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {settings.socialInstagram ? (
                  <li>
                    <a
                      href={settings.socialInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm text-xs font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                    >
                      Instagram
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
                {settings.socialFacebook ? (
                  <li>
                    <a
                      href={settings.socialFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm text-xs font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                    >
                      Facebook
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
                {settings.socialYoutube ? (
                  <li>
                    <a
                      href={settings.socialYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm text-xs font-semibold text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fresh-400"
                    >
                      YouTube
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center gap-2 py-5 text-center text-xs text-white/50 sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {year} {settings.brandName} — a brand of {settings.manufacturerName}. All rights
            reserved.
          </p>
          <p>Prices and availability are confirmed at the time of order confirmation.</p>
        </div>
      </div>
    </footer>
  );
}
