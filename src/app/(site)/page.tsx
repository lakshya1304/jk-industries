import { getSettings } from "@/lib/settings";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandIntro } from "@/components/home/BrandIntro";
import { WhyChoose } from "@/components/home/WhyChoose";
import { CtaBanner } from "@/components/home/CtaBanner";

export default async function HomePage() {
  const settings = await getSettings();

  return (
    <>
      <Hero
        brandName={settings.brandName}
        whatsappNumber={settings.whatsappNumber}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
      />
      <FeaturedProducts />
      <BrandIntro />
      <WhyChoose />
      <CtaBanner />
    </>
  );
}
