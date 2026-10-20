import { getSettings } from "@/lib/settings";
import { getHeroImages } from "@/lib/products";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandIntro } from "@/components/home/BrandIntro";
import { WhyChoose } from "@/components/home/WhyChoose";
import { FaqTeaser } from "@/components/home/FaqTeaser";
import { ExploreMore } from "@/components/home/ExploreMore";
import { CtaBanner } from "@/components/home/CtaBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { absolute, brandTitle, siteDescription, siteUrl } from "@/lib/seo";

export default async function HomePage() {
  const [settings, heroImages] = await Promise.all([getSettings(), getHeroImages()]);

  return (
    <>
      <JsonLd
        data={{
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
        }}
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
      <FaqTeaser />
      <ExploreMore />
      <CtaBanner />
    </>
  );
}
