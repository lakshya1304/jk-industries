// Shared data-transfer types used across server and client code.

export type PackSizeDTO = {
  id: string;
  label: string;
  mrp: number;
  wholesalePrice: number | null;
  stock: number | null;
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
  /**
   * Optional "find us" link for the footer address. When set, the footer uses
   * it verbatim so staff can pin an exact point (e.g. a Google Maps share
   * link); when empty, a maps search is built from the address fields above.
   */
  mapUrl: string;
  gstin: string;
  showMRP: boolean;
  showWholesalePrice: boolean;
  showStockBadge: boolean;
  heroTitle: string;
  heroSubtitle: string;
  /** Photos shown in the homepage hero carousel. Empty = fall back to product photos. */
  heroImages: string[];
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
  /**
   * Cartons hold `unitsPerCarton` of the chosen pack and are billed at the
   * pack's wholesale rate rather than MRP. `quantity` counts cartons, not
   * units. The server re-derives everything from the product record.
   */
  isCarton?: boolean;
  unitsPerCarton?: number;
};
