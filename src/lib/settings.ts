import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SiteSettings, WhyChooseItem } from "@/lib/types";

export const SETTINGS_TAG = "settings";

const DEFAULTS: SiteSettings = {
  brandName: "Super Cleaner",
  manufacturerName: "JK Industries",
  tagline: "Cleaning & automotive care products, made for everyday use.",
  whatsappNumber: "918770390350",
  contactEmail: "itee9910@gmail.com",
  contactPhone: "+91 87703 90350",
  addressLine: "Industrial Area, Your City, India",
  city: "Your City",
  state: "Your State",
  pincode: "000000",
  mapUrl: "",
  gstin: "",
  showMRP: true,
  showWholesalePrice: false,
  showStockBadge: true,
  heroTitle: "A Cleaner World Starts Here.",
  heroSubtitle:
    "Explore the Super Cleaner range of cleaning and automotive care products from JK Industries — available for retail, wholesale and bulk supply.",
  heroImages: [],
  brandIntro:
    "Super Cleaner is manufactured by JK Industries. Our team supplies cleaning and automotive care products to retailers, shops, wholesalers and distributors.",
  aboutText:
    "JK Industries manufactures the Super Cleaner range of home, professional and automotive care products.",
  whyChooseItems: [
    { title: "Product range", text: "Cleaning and automotive care products in one catalogue." },
    { title: "Wholesale supply", text: "Wholesale pricing available for stockists and distributors." },
    { title: "Bulk-order support", text: "Carton and bulk pack sizes for larger requirements." },
    { title: "Retailer enquiries", text: "Direct enquiry channel for shops and showrooms." },
    { title: "Direct manufacturer contact", text: "Talk to JK Industries without middlemen." },
  ],
  socialInstagram: "",
  socialFacebook: "",
  socialYoutube: "",
};

function toBool(v: string | undefined, fallback: boolean) {
  if (v === undefined) return fallback;
  return v === "true";
}

function parseWhyChoose(v: string | undefined): WhyChooseItem[] {
  if (!v) return DEFAULTS.whyChooseItems;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((i) => i && typeof i.title === "string")
        .map((i) => ({ title: String(i.title), text: String(i.text ?? "") }));
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULTS.whyChooseItems;
}

function parseHeroImages(v: string | undefined): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) {
      return parsed.filter((u) => typeof u === "string" && u.trim()).slice(0, 8);
    }
  } catch {
    /* fall through to no images */
  }
  return [];
}

/**
 * Read site settings. Cached with the Cache Components model and invalidated
 * from the admin settings screen via revalidateTag.
 */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag(SETTINGS_TAG);

  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    brandName: map.get("brandName") ?? DEFAULTS.brandName,
    manufacturerName: map.get("manufacturerName") ?? DEFAULTS.manufacturerName,
    tagline: map.get("tagline") ?? DEFAULTS.tagline,
    whatsappNumber: (map.get("whatsappNumber") ?? DEFAULTS.whatsappNumber).replace(/[^\d]/g, ""),
    contactEmail: map.get("contactEmail") ?? DEFAULTS.contactEmail,
    contactPhone: map.get("contactPhone") ?? DEFAULTS.contactPhone,
    addressLine: map.get("addressLine") ?? DEFAULTS.addressLine,
    city: map.get("city") ?? DEFAULTS.city,
    state: map.get("state") ?? DEFAULTS.state,
    pincode: map.get("pincode") ?? DEFAULTS.pincode,
    mapUrl: map.get("mapUrl") ?? DEFAULTS.mapUrl,
    gstin: map.get("gstin") ?? DEFAULTS.gstin,
    showMRP: toBool(map.get("showMRP"), DEFAULTS.showMRP),
    showWholesalePrice: toBool(map.get("showWholesalePrice"), DEFAULTS.showWholesalePrice),
    showStockBadge: toBool(map.get("showStockBadge"), DEFAULTS.showStockBadge),
    heroTitle: map.get("heroTitle") ?? DEFAULTS.heroTitle,
    heroSubtitle: map.get("heroSubtitle") ?? DEFAULTS.heroSubtitle,
    heroImages: parseHeroImages(map.get("heroImages")),
    brandIntro: map.get("brandIntro") ?? DEFAULTS.brandIntro,
    aboutText: map.get("aboutText") ?? DEFAULTS.aboutText,
    whyChooseItems: parseWhyChoose(map.get("whyChooseItems")),
    socialInstagram: map.get("socialInstagram") ?? "",
    socialFacebook: map.get("socialFacebook") ?? "",
    socialYoutube: map.get("socialYoutube") ?? "",
  };
}

/** Persist settings from the admin dashboard. */
export async function saveSettings(input: Record<string, string>) {
  const allowed = new Set(Object.keys(DEFAULTS));
  const entries = Object.entries(input).filter(([k]) => allowed.has(k));

  // One transaction instead of ~30 sequential round-trips: it holds a single
  // pooled connection and keeps the write atomic, so a failure part-way can't
  // leave the settings half-saved.
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  revalidateTag(SETTINGS_TAG, "max");
}
