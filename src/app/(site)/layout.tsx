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
      {/* The skip link lives in the root layout so it also covers the admin
          shell; nothing is rendered here so the tab order starts at the navbar. */}
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
      {/*
        The drawer closes itself when the route changes, which it detects with
        `usePathname()` — URL data. It is mounted here, in the layout shared by
        every site page, so the hook makes URL data a dependency of all of them
        unless it sits behind a boundary. Without this Suspense wrapper the
        static `/bill/[reference]` page failed to prerender with
        "usePathname() in a Client Component outside of <Suspense>".

        The fallback is `null` because the drawer is a hidden, fixed overlay:
        there is nothing visible to hold space for, and rendering a placeholder
        would flash a second panel during navigation.
      */}
      <Suspense fallback={null}>
        <CartDrawer brandName={settings.brandName} whatsappNumber={settings.whatsappNumber} />
      </Suspense>
    </CartProvider>
  );
}
