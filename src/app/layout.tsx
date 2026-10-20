import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { ThemeProvider, themeBootScript } from "@/components/theme/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, siteDescription, siteUrl, websiteSchema } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/**
 * `metadataBase` makes every relative URL in metadata (canonicals, OG images)
 * absolute. It must be the live origin: if this resolves to localhost, the
 * canonical tags tell Google to index a host that does not exist, which
 * de-indexes the whole site. `siteUrl()` falls back to Vercel's own host rather
 * than localhost so a missing env var degrades instead of breaking.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const url = siteUrl();
  const description = siteDescription(settings);

  return {
    metadataBase: new URL(url),
    title: {
      default: `${settings.brandName} — Cleaning & Automotive Care Products | ${settings.manufacturerName}`,
      template: `%s | ${settings.brandName}`,
    },
    description,
    applicationName: settings.brandName,
    generator: "Next.js",
    keywords: [
      settings.brandName,
      settings.manufacturerName,
      `${settings.brandName} products`,
      `${settings.brandName} wholesale`,
      "cleaning products",
      "car care products",
      "automotive care products",
      "floor cleaner",
      "dish wash liquid",
      "car shampoo",
      "dashboard polish",
      "tyre polish",
      "wholesale cleaning products India",
      "bulk cleaning supplies",
      "cleaning products distributor",
    ],
    authors: [{ name: settings.manufacturerName, url }],
    creator: settings.manufacturerName,
    publisher: settings.manufacturerName,
    category: "Shopping",
    // Canonical for the site root. Child pages set their own.
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      title: `${settings.brandName} — Cleaning & Automotive Care Products`,
      description,
      url,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.brandName} — Cleaning & Automotive Care Products`,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // Search Console / Bing verification, injected only when the env vars are
    // set so no empty meta tag is emitted before the properties exist.
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.BING_SITE_VERIFICATION
        ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
        : {}),
    },
    formatDetection: { telephone: true, address: true, email: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f3a" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <html lang="en-IN" className={jakarta.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint so dark mode never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {/*
          Site-wide identity graph. Organization/WebSite are emitted once here so
          every page can reference them by `@id` (product, breadcrumb and
          ContactPage nodes all point back to these) instead of repeating the
          business details on every route.
        */}
        <JsonLd data={[organizationSchema(settings), websiteSchema(settings)]} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
