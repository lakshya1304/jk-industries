import type { Metadata } from "next";
import { LegalShell, PolicyList, PolicySection } from "@/components/layout/LegalShell";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms for using the Super Cleaner website and submitting order requests to JK Industries.",
};

export default async function TermsPage() {
  const settings = await getSettings();
  return (
    <LegalShell
      title="Terms & Conditions"
      updated="January 2026"
      intro={`These terms apply to your use of this website and to the order requests and enquiries you submit to ${settings.brandName}, a brand of ${settings.manufacturerName}.`}
    >
      <PolicySection heading="Product information">
        <PolicyList
          items={[
            "Product names, descriptions, pack sizes and MRP are maintained by our team and may be updated without notice.",
            "Product images shown on this website may be placeholders or indicative representations until replaced with actual product photography.",
            "Availability shown online is indicative and is confirmed when your order is processed.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Order requests are not confirmed orders">
        <PolicyList
          items={[
            "Submitting a request through this website records your requirement and gives you an order reference. It does not create a binding sale.",
            "Wholesale pricing, taxes, shipping charges, delivery timelines and payment terms are confirmed separately by our team before dispatch.",
            "Estimated totals shown online use listed MRP and may change if prices are updated or the confirmed quantity differs.",
            "We may decline or revise a request if a product is unavailable or if the details provided cannot be verified.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Pricing and payment">
        <PolicyList
          items={[
            "No online payment is collected on this website. Payment terms are agreed directly with our team.",
            "MRP is inclusive of applicable taxes unless stated otherwise. Other statutory levies, if applicable, are confirmed with your order.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Acceptable use">
        <PolicyList
          items={[
            "Provide accurate contact and delivery details when submitting a request.",
            "Do not use this website to submit false, abusive or automated enquiries.",
            "Content on this website (text, layout, images) belongs to us and may not be reproduced for commercial use without permission.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Limitation">
        <p>
          This website is provided on an &quot;as is&quot; basis for the purpose of product
          discovery and order requests. To the extent permitted by law, we are not liable for
          indirect losses arising from use of the website. Nothing in these terms limits rights
          that cannot be limited under applicable law.
        </p>
      </PolicySection>

      <PolicySection heading="Governing law">
        <p>
          These terms are governed by the laws of India, and disputes are subject to the
          jurisdiction of the courts where {settings.manufacturerName} is registered.
        </p>
      </PolicySection>
    </LegalShell>
  );
}
