/**
 * Seed script: creates the default admin user, site settings, and an initial
 * product catalogue so the site works end-to-end immediately after setup.
 *
 * Run with: npm run db:seed
 * Safe to re-run: existing products/settings are updated, nothing is deleted.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type SeedPack = { label: string; mrp: number; wholesalePrice?: number };
type SeedProduct = {
  name: string;
  sku: string;
  description: string;
  usage: string;
  image: string;
  minOrderQty?: number;
  unitsPerCarton?: number;
  availability?: string;
  featured?: boolean;
  showPrice?: boolean;
  packSizes: SeedPack[];
};

const products: SeedProduct[] = [
  {
    name: "Super Cleaner Floor Cleaner",
    sku: "SC-FC-001",
    description:
      "Floor cleaning liquid for everyday use on tiles, marble and other hard floors. Supplied in retail and bulk pack sizes.",
    usage: "Dilute in water as directed on the label, mop the floor and allow to air dry.",
    image: "/products/floor-cleaner.svg",
    unitsPerCarton: 20,
    featured: true,
    packSizes: [
      { label: "500 ml", mrp: 99, wholesalePrice: 79 },
      { label: "1 litre", mrp: 189, wholesalePrice: 149 },
      { label: "5 litre", mrp: 749, wholesalePrice: 619 },
    ],
  },
  {
    name: "Super Cleaner Hand Wash",
    sku: "SC-HW-002",
    description:
      "Liquid hand wash in a pump pack. Available in multiple pack sizes for shops and bulk supply.",
    usage: "Pump onto wet hands, lather, rinse with water and dry.",
    image: "/products/hand-wash.svg",
    unitsPerCarton: 24,
    packSizes: [
      { label: "200 ml", mrp: 69, wholesalePrice: 54 },
      { label: "500 ml", mrp: 129, wholesalePrice: 102 },
    ],
  },
  {
    name: "Super Cleaner Dish Wash Liquid",
    sku: "SC-DW-003",
    description:
      "Dish washing liquid for kitchens and restaurants. Supplied in retail bottles and bulk packs.",
    usage: "Apply a small amount on a sponge or directly on utensils, scrub and rinse with water.",
    image: "/products/dish-wash.svg",
    unitsPerCarton: 20,
    featured: true,
    packSizes: [
      { label: "250 ml", mrp: 79, wholesalePrice: 62 },
      { label: "500 ml", mrp: 129, wholesalePrice: 102 },
      { label: "1 litre", mrp: 229, wholesalePrice: 182 },
    ],
  },
  {
    name: "Super Cleaner Glass Cleaner",
    sku: "SC-GC-004",
    description:
      "Spray cleaner for glass, mirrors and other smooth surfaces. Suitable for shops, offices and homes.",
    usage: "Spray onto the surface and wipe clean with a soft, lint-free cloth.",
    image: "/products/glass-cleaner.svg",
    unitsPerCarton: 12,
    packSizes: [
      { label: "500 ml", mrp: 149, wholesalePrice: 119 },
      { label: "1 litre", mrp: 259, wholesalePrice: 209 },
    ],
  },
  {
    name: "Super Cleaner Toilet Cleaner",
    sku: "SC-TC-005",
    description:
      "Thick liquid toilet cleaner in a neck bottle for controlled application.",
    usage: "Apply under the rim, leave for a few minutes, scrub with a brush and flush.",
    image: "/products/toilet-cleaner.svg",
    unitsPerCarton: 12,
    featured: true,
    packSizes: [
      { label: "500 ml", mrp: 119, wholesalePrice: 94 },
      { label: "1 litre", mrp: 209, wholesalePrice: 165 },
    ],
  },
  {
    name: "Super Cleaner Bathroom Cleaner",
    sku: "SC-BC-006",
    description:
      "Spray cleaner for bathroom tiles, wash basins and fittings.",
    usage: "Spray on the surface, leave briefly, scrub and rinse with water.",
    image: "/products/bathroom-cleaner.svg",
    unitsPerCarton: 12,
    packSizes: [
      { label: "500 ml", mrp: 159, wholesalePrice: 125 },
      { label: "1 litre", mrp: 279, wholesalePrice: 222 },
    ],
  },
  {
    name: "Super Cleaner Multipurpose Cleaner",
    sku: "SC-MC-007",
    description:
      "All-purpose spray cleaner for tables, counters, appliances and other washable surfaces.",
    usage: "Spray on the surface and wipe with a clean cloth. Test on a small area first.",
    image: "/products/multipurpose-cleaner.svg",
    unitsPerCarton: 12,
    featured: true,
    packSizes: [
      { label: "500 ml", mrp: 149, wholesalePrice: 118 },
      { label: "1 litre", mrp: 259, wholesalePrice: 205 },
    ],
  },
  {
    name: "Super Cleaner Kitchen Degreaser",
    sku: "SC-KD-008",
    description:
      "Spray degreaser for kitchen counters, chimneys, stovetops and exhaust filters.",
    usage: "Spray on the greasy surface, leave for a few minutes, wipe clean and rinse.",
    image: "/products/kitchen-degreaser.svg",
    unitsPerCarton: 12,
    packSizes: [
      { label: "500 ml", mrp: 179, wholesalePrice: 142 },
      { label: "1 litre", mrp: 299, wholesalePrice: 238 },
    ],
  },
  {
    name: "Super Cleaner Car Shampoo",
    sku: "SC-CS-009",
    description:
      "Car wash shampoo for exterior cleaning. Supplied in jug packs for retail and detailing supply.",
    usage: "Dilute in a bucket of water, wash the vehicle with a sponge or mitt, then rinse with clean water.",
    image: "/products/car-shampoo.svg",
    unitsPerCarton: 4,
    featured: true,
    packSizes: [
      { label: "500 ml", mrp: 199, wholesalePrice: 159 },
      { label: "1 litre", mrp: 349, wholesalePrice: 279 },
      { label: "5 litre", mrp: 1499, wholesalePrice: 1249 },
    ],
  },
  {
    name: "Super Cleaner Dashboard Polish",
    sku: "SC-DP-010",
    description:
      "Interior polish for car dashboards, door trims and plastic panels.",
    usage: "Apply a small amount on a soft cloth and wipe over the surface evenly.",
    image: "/products/dashboard-polish.svg",
    unitsPerCarton: 24,
    packSizes: [
      { label: "200 ml", mrp: 199, wholesalePrice: 159 },
      { label: "300 ml", mrp: 269, wholesalePrice: 215 },
    ],
  },
  {
    name: "Super Cleaner Tyre Polish",
    sku: "SC-TP-011",
    description:
      "Tyre dressing for a clean black finish on tyres and rubber trims.",
    usage: "Apply evenly on the tyre sidewall with a cloth or applicator and allow to dry.",
    image: "/products/tyre-polish.svg",
    unitsPerCarton: 12,
    packSizes: [
      { label: "300 ml", mrp: 229, wholesalePrice: 182 },
      { label: "500 ml", mrp: 349, wholesalePrice: 279 },
    ],
  },
  {
    name: "Super Cleaner Car Wax",
    sku: "SC-CW-012",
    description:
      "Paste car wax for paint protection and gloss on vehicle bodies.",
    usage: "Apply a thin layer on clean paint with an applicator, allow to haze, then buff with a microfibre cloth.",
    image: "/products/car-wax.svg",
    minOrderQty: 2,
    availability: "on_request",
    packSizes: [{ label: "200 g", mrp: 449, wholesalePrice: 359 }],
  },
];

const defaultSettings: Record<string, string> = {
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
  gstin: "",
  showMRP: "true",
  showWholesalePrice: "false",
  showStockBadge: "true",
  heroTitle: "A Cleaner World Starts Here.",
  heroSubtitle:
    "Explore the Super Cleaner range of cleaning and automotive care products from JK Industries — available for retail, wholesale and bulk supply.",
  brandIntro:
    "Super Cleaner is manufactured by JK Industries. Our team supplies cleaning and automotive care products to retailers, shops, wholesalers and distributors.",
  aboutText:
    "JK Industries manufactures the Super Cleaner range of home, professional and automotive care products. We work with retailers, wholesalers and distributors who want reliable products and direct manufacturer contact for their supply.",
  whyChooseItems: JSON.stringify([
    { title: "Product range", text: "Cleaning and automotive care products in one catalogue." },
    { title: "Wholesale supply", text: "Wholesale pricing available for stockists and distributors." },
    { title: "Bulk-order support", text: "Carton and bulk pack sizes for larger requirements." },
    { title: "Retailer enquiries", text: "Direct enquiry channel for shops and showrooms." },
    { title: "Direct manufacturer contact", text: "Talk to JK Industries without middlemen." },
  ]),
  socialInstagram: "",
  socialFacebook: "",
  socialYoutube: "",
};

async function main() {
  // 1. Admin user (idempotent)
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@supercleaner.example";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "changeme123";
  const passwordHash = await hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Administrator", passwordHash },
  });
  console.log(`Admin user ready: ${adminEmail}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log("  (default password used — set ADMIN_PASSWORD in .env and re-seed to change it)");
  }

  // 2. Settings (only fill missing keys)
  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) await prisma.setting.create({ data: { key, value } });
  }
  console.log("Settings initialised.");

  // 3. Products (upsert by SKU)
  for (const [index, p] of products.entries()) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        usage: p.usage,
        images: JSON.stringify([p.image]),
        availability: p.availability ?? "in_stock",
        featured: p.featured ?? false,
        minOrderQty: p.minOrderQty ?? 1,
        unitsPerCarton: p.unitsPerCarton ?? null,
        sortOrder: index,
        active: true,
      },
      create: {
        name: p.name,
        slug: slugify(p.name),
        sku: p.sku,
        description: p.description,
        usage: p.usage,
        images: JSON.stringify([p.image]),
        availability: p.availability ?? "in_stock",
        featured: p.featured ?? false,
        minOrderQty: p.minOrderQty ?? 1,
        unitsPerCarton: p.unitsPerCarton ?? null,
        sortOrder: index,
        active: true,
        packSizes: {
          create: p.packSizes.map((ps, i) => ({
            label: ps.label,
            mrp: ps.mrp,
            wholesalePrice: ps.wholesalePrice ?? null,
            sortOrder: i,
          })),
        },
      },
    });
  }
  console.log(`${products.length} products seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
