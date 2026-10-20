import type { Metadata } from "next";
import { LegalShell, PolicyList, PolicySection } from "@/components/layout/LegalShell";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Super Cleaner / JK Industries collects, uses and protects the information you submit through this website.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <LegalShell
      title="Privacy Policy"
      updated="January 2026"
      intro={`This policy explains what information ${settings.brandName} (a brand of ${settings.manufacturerName}) collects through this website, why we collect it, and how it is handled. This website does not use customer accounts and does not process online payments.`}
    >
      <PolicySection heading="Information we collect">
        <p>We collect only the information you choose to submit through our forms:</p>
        <PolicyList
          items={[
            "Order requests: your name, business name (optional), mobile number, email (optional), GSTIN (optional), delivery address, city, state, PIN code and order notes.",
            "Enquiries: your name, business name (optional), mobile number, email (optional), city, state, enquiry type and message.",
            "Basic technical data (such as your IP address) is processed transiently to protect the forms against spam and abuse.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="How we use your information">
        <PolicyList
          items={[
            "To respond to your order request or enquiry and confirm pricing, stock and delivery terms.",
            "To contact you on the mobile number or email you provide, including sending order status updates (by email or by WhatsApp/SMS) to the contact details you supplied with your order.",
            "To meet accounting and statutory requirements where an invoice is issued.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="What we do not do">
        <PolicyList
          items={[
            "We do not sell or rent your information to third parties.",
            "We do not store card, UPI or banking credentials — no online payments are collected on this website.",
            "We do not use your information for automated profiling or advertising.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Cart storage">
        <p>
          Your cart is stored locally in your own browser so it is not lost while you browse. It
          is not visible to us until you submit an order request.
        </p>
      </PolicySection>

      <PolicySection heading="Data retention and security">
        <p>
          Order requests and enquiries are stored in our business database and kept as long as
          needed for supply, support and accounting purposes. Access is restricted to authorised
          staff through a password-protected admin dashboard. Please avoid sharing sensitive
          personal information in the notes fields.
        </p>
      </PolicySection>

      <PolicySection heading="Your choices">
        <p>
          You can ask us to correct or delete the contact details we hold for you by writing to{" "}
          {settings.contactEmail || "the contact email listed on the Contact page"}. We may need
          to retain records required for tax and accounting purposes.
        </p>
      </PolicySection>

      <PolicySection heading="Contact">
        <p>
          {settings.manufacturerName}, {settings.addressLine}, {settings.city}, {settings.state}{" "}
          {settings.pincode}.
        </p>
      </PolicySection>
    </LegalShell>
  );
}
