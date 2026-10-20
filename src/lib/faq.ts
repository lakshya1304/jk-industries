/**
 * Homepage FAQ content.
 *
 * Kept as data so the visible section and the FAQPage structured data are
 * generated from one source and can never drift apart — Google requires FAQ
 * markup to match what a visitor can actually read on the page, and penalises
 * markup that only exists for crawlers.
 *
 * Every answer here is limited to what the site actually does (no online
 * payment, WhatsApp/order-request flow, wholesale on request). No delivery
 * times, certifications or minimums are claimed, because those are not
 * confirmed anywhere in the catalogue.
 */
export type FaqItem = { question: string; answer: string };

export function homeFaqs(settings: {
  brandName: string;
  manufacturerName: string;
}): FaqItem[] {
  const { brandName, manufacturerName } = settings;

  return [
    {
      question: `Who manufactures ${brandName} products?`,
      answer: `${brandName} is manufactured by ${manufacturerName}. ${manufacturerName} supplies the range to retailers, shops, wholesalers and distributors.`,
    },
    {
      question: `What products are in the ${brandName} range?`,
      answer: `The ${brandName} range covers home cleaning, professional cleaning and automotive care products. The full catalogue, with pack sizes and MRP, is listed on the All Products page.`,
    },
    {
      question: `Can I buy ${brandName} products in wholesale or bulk quantities?`,
      answer: `Yes. Packs are listed at retail MRP, and wholesale pricing is available on request for stockists, distributors and bulk buyers. Send an enquiry with your city and expected volumes.`,
    },
    {
      question: "How do I place an order?",
      answer: `Add the products and pack sizes you need to your cart, then send an order request. Our team confirms availability and pricing on the contact details you provide. You can also send the requirement directly on WhatsApp.`,
    },
    {
      question: "Do I need to pay online?",
      answer: "No. Orders placed through this website are order requests only — there is no online payment. Our team confirms your order and the payment method with you directly.",
    },
    {
      question: "Can I track an order request I have sent?",
      answer: "Yes. Use the Track Order page with the order reference you received after submitting your request to see its current status.",
    },
    {
      question: `How do I contact ${manufacturerName}?`,
      answer: `Use the Contact page to send an enquiry, or reach the team on WhatsApp or by phone. Contact details are listed in the footer of every page.`,
    },
  ];
}
