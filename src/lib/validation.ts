import { z } from "zod";

// --------------- shared bits ---------------

const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(?:\+?91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
  );

// Optional fields accept "", null or a missing key. `.nullish()` (and not just
// `.optional()`) matters: several forms parse with these schemas on the client
// first and post the *parsed* result, where an empty value has already been
// transformed to `null`. The server parses that payload a second time, so `null`
// must pass through untouched instead of failing `z.string()`.
const optionalEmail = z
  .string()
  .trim()
  .max(160, "Email is too long")
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address")
  .transform((v) => (v === "" ? null : v))
  .nullish();

const optionalShort = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullish();

// --------------- orders ---------------

export const orderItemSchema = z.object({
  productId: z.string().min(1).max(64),
  packSizeId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(10_000),
  /**
   * Set when the buyer chose carton (wholesale) quantities. `quantity` then
   * counts cartons. The server re-checks the product's units-per-carton and
   * wholesale rate itself — this flag only selects the pricing rule.
   */
  isCarton: z.boolean().optional(),
});

export const orderRequestSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Your cart is empty").max(100),
  customerName: z.string().trim().min(2, "Enter your name").max(80),
  businessName: optionalShort(120),
  mobile: mobileSchema,
  email: optionalEmail,
  gstin: optionalShort(20),
  address: z.string().trim().min(5, "Enter the delivery address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  notes: optionalShort(500),
  clientToken: optionalShort(64),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;

// --------------- enquiries ---------------

export const enquirySchema = z.object({
  type: z.enum(["contact", "product", "dealer", "wholesale"]).catch("contact"),
  name: z.string().trim().min(2, "Enter your name").max(80),
  businessName: optionalShort(120),
  mobile: mobileSchema,
  email: optionalEmail,
  city: optionalShort(80),
  state: optionalShort(80),
  productSku: optionalShort(40),
  productName: optionalShort(160),
  message: z.string().trim().min(5, "Tell us a little more").max(2000),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

// --------------- admin ---------------

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const packSizeInputSchema = z.object({
  id: z.string().trim().max(64).optional(), // existing id when editing; omitted for new packs
  label: z.string().trim().min(1, "Pack size label is required").max(40),
  mrp: z.coerce.number().min(0.01, "MRP must be greater than 0").max(1_000_000),
  wholesalePrice: z
    .union([z.coerce.number().min(0).max(1_000_000), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null || Number.isNaN(v) ? null : Number(v))),
  stock: z
    .union([z.coerce.number().int().min(0).max(1_000_000), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null || Number.isNaN(v) ? null : Number(v)))
    .default(null),
  active: z.union([z.boolean(), z.literal("true"), z.literal("false")]).transform((v) => v === true || v === "true"),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Product name is required").max(120),
  sku: z
    .string()
    .trim()
    .min(2, "SKU is required")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Use only letters, numbers, dots, dashes and underscores"),
  description: z.string().trim().max(2000).default(""),
  usage: z.string().trim().max(2000).default(""),
  images: z.array(z.string().trim().max(300)).max(6).default([]),
  minOrderQty: z.coerce.number().int().min(1).max(10_000).default(1),
  unitsPerCarton: z
    .union([z.coerce.number().int().min(1).max(100_000), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null || Number.isNaN(v) ? null : Number(v)))
    .default(null),
  availability: z.enum(["in_stock", "out_of_stock", "on_request"]).default("in_stock"),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  showPrice: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100_000).default(0),
  packSizes: z.array(packSizeInputSchema).min(1, "Add at least one pack size").max(12),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  internalNotes: z.string().trim().max(2000).optional(),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "resolved"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminSettingsSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required").max(80),
  manufacturerName: z.string().trim().min(1, "Manufacturer name is required").max(80),
  tagline: z.string().trim().max(200),
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .min(10, "Enter a valid WhatsApp number with country code")
        .max(15, "Enter a valid WhatsApp number with country code")
    ),
  contactEmail: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
  contactPhone: z.string().trim().max(40),
  addressLine: z.string().trim().max(200),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  pincode: z.string().trim().max(10),
  mapUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "Enter a full link starting with http:// or https://",
    ),
  gstin: z.string().trim().max(20),
  showMRP: z.boolean(),
  showWholesalePrice: z.boolean(),
  showStockBadge: z.boolean(),
  heroTitle: z.string().trim().max(120),
  heroSubtitle: z.string().trim().max(400),
  heroImages: z.array(z.string().trim().max(300)).max(8).default([]),
  brandIntro: z.string().trim().max(1000),
  aboutText: z.string().trim().max(2000),
  whyChooseItems: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Benefit title is required").max(60),
        text: z.string().trim().max(200),
      })
    )
    .max(8),
  socialInstagram: z.string().trim().max(200),
  socialFacebook: z.string().trim().max(200),
  socialYoutube: z.string().trim().max(200),
});

export type AdminSettingsInput = z.infer<typeof adminSettingsSchema>;
