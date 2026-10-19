import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/**
 * Static placeholder for the navbar while the interactive version (which reads
 * the current path) streams in. Matches the real navbar's height and layout so
 * there is no cumulative layout shift.
 */
export function NavbarFallback({
  brandName,
  manufacturerName,
}: {
  brandName: string;
  manufacturerName: string;
}) {
  return (
    <header className="glass fixed inset-x-0 top-0 z-50 shadow-[0_1px_0_rgba(11,31,58,0.08)]">
      <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-4 md:h-18">
        <Link href="/" className="rounded-lg" aria-label={`${brandName} home`}>
          <BrandLogo brandName={brandName} manufacturerName={manufacturerName} tone="dark" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900/70 transition-colors duration-200 hover:text-navy-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex size-10 items-center justify-center text-navy-900/60" aria-hidden>
          <MessageCircle className="size-5" />
        </div>
      </nav>
    </header>
  );
}
