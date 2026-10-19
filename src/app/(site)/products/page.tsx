import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { ProductCatalogue } from "@/components/product/ProductCatalogue";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse the complete Super Cleaner catalogue — home, professional and cleaning products with pack sizes, MRP and wholesale supply options.",
};

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);

  return (
    <div className="pt-24 md:pt-28">
      <header className="container-page pb-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-5xl">
          All Products
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          The complete Super Cleaner range in one place. Search by product name or SKU, then add
          items to your cart to send an order request to {settings.manufacturerName}.
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
  );
}
