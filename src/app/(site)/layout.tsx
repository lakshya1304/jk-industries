import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarFallback } from "@/components/layout/NavbarFallback";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <CartProvider>
      <ScrollProgress />
      <a
        href="#main-content"
        className="sr-only z-100 rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      {/* The navbar reads the current path (URL data), so it streams in behind a
          boundary while the static fallback keeps the layout stable. */}
      <Suspense
        fallback={
          <NavbarFallback
            brandName={settings.brandName}
            manufacturerName={settings.manufacturerName}
          />
        }
      >
        <Navbar
          brandName={settings.brandName}
          manufacturerName={settings.manufacturerName}
          whatsappNumber={settings.whatsappNumber}
        />
      </Suspense>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <CartDrawer brandName={settings.brandName} whatsappNumber={settings.whatsappNumber} />
    </CartProvider>
  );
}
