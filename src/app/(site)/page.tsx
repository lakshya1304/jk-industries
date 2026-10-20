import { getSettings } from "@/lib/settings";
import { getHeroImages } from "@/lib/products";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandIntro } from "@/components/home/BrandIntro";
import { WhyChoose } from "@/components/home/WhyChoose";
import { CtaBanner } from "@/components/home/CtaBanner";

export default async function HomePage() {
  const [settings, heroImages] = await Promise.all([getSettings(), getHeroImages()]);

  return (
    <>
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
      <CtaBanner />
    </>
  );
}
