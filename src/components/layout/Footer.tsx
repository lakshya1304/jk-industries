import Link from "next/link";
import { cacheLife } from "next/cache";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { waLink } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
];

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

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-14">
        <div>
          <BrandLogo
            brandName={settings.brandName}
            manufacturerName={settings.manufacturerName}
            tone="light"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            {settings.tagline}
          </p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-white/40 uppercase">
            Manufactured by {settings.manufacturerName}
          </p>
          {settings.gstin ? (
            <p className="mt-1 text-xs text-white/40">GSTIN: {settings.gstin}</p>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-bold tracking-wide text-white/90 uppercase">Quick links</h2>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold tracking-wide text-white/90 uppercase">Contact</h2>
          <address className="mt-4 space-y-2.5 text-sm not-italic text-white/60">
            <p>
              {settings.addressLine}
              <br />
              {settings.city}, {settings.state} {settings.pincode}
            </p>
            {settings.contactPhone ? (
              <p>
                <a
                  className="transition-colors hover:text-white"
                  href={`tel:${settings.contactPhone.replace(/[^\d+]/g, "")}`}
                >
                  {settings.contactPhone}
                </a>
              </p>
            ) : null}
            {settings.contactEmail ? (
              <p>
                <a className="transition-colors hover:text-white" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </p>
            ) : null}
          </address>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-[#062b17] transition hover:bg-[#1fbb59]"
          >
            Chat on WhatsApp
          </a>
          {(settings.socialInstagram || settings.socialFacebook || settings.socialYoutube) && (
            <div className="mt-5 flex gap-3">
              {settings.socialInstagram ? (
                <a
                  href={settings.socialInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-white/50 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Instagram
                </a>
              ) : null}
              {settings.socialFacebook ? (
                <a
                  href={settings.socialFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-white/50 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Facebook
                </a>
              ) : null}
              {settings.socialYoutube ? (
                <a
                  href={settings.socialYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-white/50 underline-offset-4 transition hover:text-white hover:underline"
                >
                  YouTube
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/40 sm:flex-row">
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
