// Shared data-transfer types used across server and client code.

export type PackSizeDTO = {
  id: string;
  label: string;
  mrp: number;
  wholesalePrice: number | null;
  active: boolean;
};

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  usage: string;
  images: string[];
  minOrderQty: number;
  unitsPerCarton: number | null;
  availability: "in_stock" | "out_of_stock" | "on_request";
  featured: boolean;
  showPrice: boolean;
  packSizes: PackSizeDTO[];
};

export type WhyChooseItem = { title: string; text: string };

export type SiteSettings = {
  brandName: string;
  manufacturerName: string;
  tagline: string;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  showMRP: boolean;
  showWholesalePrice: boolean;
  showStockBadge: boolean;
  heroTitle: string;
  heroSubtitle: string;
  brandIntro: string;
  aboutText: string;
  whyChooseItems: WhyChooseItem[];
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
};

// Cart lives in the browser (localStorage) and is re-priced on the server
// when an order request is submitted.
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string;
  packSizeId: string;
  packLabel: string;
  mrp: number;
  quantity: number;
  minOrderQty: number;
};
