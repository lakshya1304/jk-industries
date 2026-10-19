import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Cart & Order Request",
  description: "Review your selected Super Cleaner products and submit your order request.",
};

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-page pt-24 pb-20 md:pt-28">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 md:text-4xl">
          Cart & Order Request
        </h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Send your requirement to {settings.manufacturerName}. Our team confirms pricing,
          availability and delivery with you directly.
        </p>
      </header>
      <CheckoutClient settings={settings} />
    </div>
  );
}
