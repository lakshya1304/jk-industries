import { getSettings } from "@/lib/settings";
import { getHeroImages } from "@/lib/products";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandIntro } from "@/components/home/BrandIntro";
import { WhyChoose } from "@/components/home/WhyChoose";
import { FaqSection } from "@/components/home/FaqSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeFaqs } from "@/lib/faq";
import { absolute, brandTitle, siteDescription, siteUrl } from "@/lib/seo";

export default async function HomePage() {
  const [settings, heroImages] = await Promise.all([getSettings(), getHeroImages()]);
  const faqs = homeFaqs(settings);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${siteUrl()}/#webpage`,
            url: siteUrl(),
            name: `${brandTitle(settings)} — Cleaning & Automotive Care Products`,
            description: siteDescription(settings),
            isPartOf: { "@id": `${siteUrl()}/#website` },
            about: { "@id": `${siteUrl()}/#organization` },
            primaryImageOfPage: absolute("/brand/jk-logo.svg"),
            inLanguage: "en-IN",
          },
          // FAQPage mirrors the visible FAQ section further down this page,
          // generated from the same source so the two cannot disagree.
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${siteUrl()}/#faq`,
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]}
      />
      <Hero
        brandName={settings.brandName}
        whatsappNumber={settings.whatsappNumber}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        images={heroImages}
      />
      <TrustStrip />
      <FeaturedProducts />
      <BrandIntro />
      <WhyChoose />
      <FaqSection />
      <CtaBanner />
    </>
  );
}
