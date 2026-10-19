import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.brandName} — Cleaning & Automotive Care Products | ${settings.manufacturerName}`,
      template: `%s | ${settings.brandName}`,
    },
    description: settings.tagline,
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      title: `${settings.brandName} — Cleaning & Automotive Care Products`,
      description: settings.tagline,
      url: siteUrl,
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
