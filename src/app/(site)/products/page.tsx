import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductCatalogue } from "@/components/product/ProductCatalogue";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "All Products — Cleaning & Car Care Range",
  description:
    "Browse the complete Super Cleaner catalogue — home, professional and automotive care products with pack sizes, MRP and wholesale supply options. Enquire for bulk and carton pricing.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "All Products | Super Cleaner",
    description:
      "Browse the complete Super Cleaner catalogue — home, professional and automotive care products with pack sizes, MRP and wholesale supply options.",
    url: "/products",
  },
};

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "All Products", path: "/products" },
          ]),
          itemListSchema(products, settings),
        ]}
      />
      <div className="pt-24 md:pt-28">
        <header className="container-page pb-2">
          {/* "All Products" is the visible H1; the wider phrasing lives in the
              supporting copy so the page reads naturally for humans while still
              covering how buyers search ("cleaning and car care products"). */}
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-5xl">
            All Products
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            The complete {settings.brandName} range of cleaning and car care products in one place.
            Search by product name or SKU, compare pack sizes and MRP, then add items to your cart
            to send an order request to {settings.manufacturerName}.
          </p>
        </header>

        <div className="container-page pb-16">
          <ProductCatalogue
            products={products}
            options={{
              showMRP: settings.showMRP,
              showWholesale: settings.showWholesalePrice,
              showStockBadge: settings.showStockBadge,
              whatsappNumber: settings.whatsappNumber,
              brandName: settings.brandName,
            }}
          />
        </div>
      </div>
    </>
  );
}
