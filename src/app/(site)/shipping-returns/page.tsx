import type { Metadata } from "next";
import { LegalShell, PolicyList, PolicySection } from "@/components/layout/LegalShell";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy",
  description:
    "How Super Cleaner / JK Industries dispatches orders and handles shortages, damage and returns.",
};

export default async function ShippingReturnsPage() {
  const settings = await getSettings();
  return (
    <LegalShell
      title="Shipping & Returns Policy"
      updated="January 2026"
      intro={`This policy outlines how ${settings.brandName} (a brand of ${settings.manufacturerName}) dispatches confirmed orders and how we handle issues after delivery.`}
    >
      <PolicySection heading="Processing confirmed orders">
        <PolicyList
          items={[
            "After you submit an order request, our team contacts you to confirm availability, pricing, dispatch location and payment terms.",
            "Dispatch timelines are shared at confirmation and depend on order size, stock position and your location.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Shipping">
        <PolicyList
          items={[
            "Shipping or freight charges are quoted with your order confirmation and depend on quantity, destination and mode of transport.",
            "Goods are packed in standard cartons. Carton quantities and pack sizes are confirmed with your order.",
            "Delivery is made to the address you provide; please ensure someone is available to receive the consignment.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Shortages, damage or wrong items">
        <PolicyList
          items={[
            "Please check cartons at the time of delivery where possible and note any visible damage on the transporter's proof of delivery.",
            "Report shortages, damage or incorrect items within 48 hours of delivery with your order reference and photos of the affected goods.",
            "Verified claims are resolved by replacement, credit note or adjustment, as agreed with our team.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Returns">
        <PolicyList
          items={[
            "As these are cleaning and automotive care products, we cannot accept returns of opened or used goods.",
            "Sealed, unused cartons may be considered for return within 7 days of delivery, at our discretion and subject to freight costs, unless the return results from our error.",
            "Perishable, custom-pack or clearance items are not returnable.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Cancellations">
        <p>
          You can cancel an order request before it is confirmed for dispatch by contacting us on
          WhatsApp or by phone. Once goods have been dispatched, cancellation is subject to the
          returns conditions above.
        </p>
      </PolicySection>
    </LegalShell>
  );
}
