import type { ProductDTO, SiteSettings } from "@/lib/types";
import type { FaqItem } from "@/lib/faq";
import { mapsHref } from "@/lib/utils";

/**
 * Absolute site origin, without a trailing slash.
 *
 * Everything search engines consume (canonicals, sitemap entries, JSON-LD `@id`
 * values, Open Graph image URLs) must be absolute. A missing or wrong
 * `NEXT_PUBLIC_SITE_URL` would emit `http://localhost:3000` into production,
 * which tells Google to index a host nobody can reach — so the deployed Vercel
 * host is used as a fallback rather than localhost.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Join a path onto the site origin. `absolute("/products")` -> "https://…/products". */
export function absolute(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Marketing name used in titles and structured data.
 *
 * Search engines match on the *brand* as people actually type it, so the
 * manufacturer is folded into the brand string ("Super Cleaner by JK
 * Industries") rather than left to the tagline. Returns e.g.
 * "Super Cleaner by JK Industries".
 */
export function brandTitle(settings: Pick<SiteSettings, "brandName" | "manufacturerName">): string {
  if (!settings.manufacturerName) return settings.brandName;
  if (settings.brandName.toLowerCase().includes(settings.manufacturerName.toLowerCase())) {
    return settings.brandName;
  }
  return `${settings.brandName} by ${settings.manufacturerName}`;
}

/**
 * The one description string used consistently by the meta tag, Open Graph,
 * Twitter card and JSON-LD, so the three never disagree (they are compared
 * against each other during rich-result review).
 */
export function siteDescription(settings: SiteSettings): string {
  const base = settings.tagline?.trim();
  if (base) return base;
  return `${brandTitle(settings)} — cleaning and automotive care products available for retail, wholesale and bulk supply.`;
}

/**
 * Normalise a product image URL for structured data and the sitemap.
 *
 * Google requires an absolute URL, so relative paths are made absolute and
 * base64 data URIs are dropped (they are invalid in structured data).
 *
 * Third-party hosts are rejected as well. The catalogue can end up holding a
 * Google Images thumbnail (`encrypted-tbn0.gstatic.com`), which is a cached
 * copy of someone else's asset — publishing it as the product's own image
 * risks a copyright complaint and produces a URL that can vanish at any time.
 * Only images served from this site or the project's own Blob storage are
 * treated as real product photography.
 */
export function imageForSchema(image: string | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("data:")) return null;

  const selfHosted =
    image.startsWith("/") ||
    image.includes("blob.vercel-storage.com") ||
    image.includes(siteUrl()) ||
    (!/^https?:\/\//i.test(image) && !image.startsWith("//"));

  if (!selfHosted) return null;

  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return absolute(image);
  return absolute(`/${image}`);
}

/** Cheapest and most expensive MRP across a product's active pack sizes. */
function priceRange(product: ProductDTO): { low: number; high: number } | null {
  const prices = product.packSizes.map((p) => p.mrp).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return null;
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** Schema.org availability value matching the stored availability enum. */
function schemaAvailability(availability: ProductDTO["availability"]): string {
  switch (availability) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    default:
      return "https://schema.org/PreOrder";
  }
}

/**
 * Product structured data.
 *
 * Emitted only for real, published values: the offer block appears only when
 * the product is actually priced *and* the catalogue is configured to show
 * prices. Claiming `price` on a product whose price is withheld would be a
 * mismatch against the rendered page, which Google treats as spam, so those
 * products get the `Product` node without an `offers` block instead.
 *
 * `sku` is included (rather than only `mpn`) because trade buyers search by SKU.
 */
export function productSchema(product: ProductDTO, settings: SiteSettings) {
  const url = absolute(`/products/${product.slug}`);
  const images = product.images.map(imageForSchema).filter((v): v is string => Boolean(v));

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    sku: product.sku,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.usage ? { additionalProperty: { "@type": "PropertyValue", name: "Usage", value: product.usage } } : {}),
    brand: { "@type": "Brand", name: settings.brandName },
    manufacturer: {
      "@type": "Organization",
      name: settings.manufacturerName,
      url: siteUrl(),
    },
    category: "Cleaning & Automotive Care Products",
  };

  // `offers` only when a real price is both present and publicly displayed.
  const range = priceRange(product);
  if (settings.showMRP && product.showPrice && range) {
    schema.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: range.low,
      highPrice: range.high,
      offerCount: product.packSizes.length,
      availability: schemaAvailability(product.availability),
      url,
      seller: { "@type": "Organization", name: settings.manufacturerName },
    };
  } else {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      availability: schemaAvailability(product.availability),
      url,
      seller: { "@type": "Organization", name: settings.manufacturerName },
    };
  }

  // Individual purchasable pack sizes, each with its own price where known.
  if (settings.showMRP && product.showPrice) {
    const variants = product.packSizes
      .filter((p) => Number.isFinite(p.mrp) && p.mrp > 0)
      .map((p) => ({
        "@type": "Product",
        name: `${product.name} — ${p.label}`,
        sku: `${product.sku}-${p.label}`,
        ...(images.length ? { image: images[0] } : {}),
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: p.mrp,
          availability:
            p.stock === null
              ? schemaAvailability(product.availability)
              : p.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          url,
        },
      }));
    if (variants.length) schema.hasVariant = variants;
  }

  return schema;
}

/** Breadcrumb structured data, so the SERP shows a path instead of a bare URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/**
 * Organization + LocalBusiness in a single `@graph`.
 *
 * `Organization` carries the brand identity (logo, contact, social profiles)
 * that Google uses for the knowledge panel. `LocalBusiness` is added only when
 * a real address is configured — publishing a business with the seeded
 * placeholder address ("Your City", "000000") would be false information, so
 * the node is omitted until staff enter the real details.
 */
export function organizationSchema(settings: SiteSettings) {
  const url = siteUrl();
  const sameAs = [settings.socialInstagram, settings.socialFacebook, settings.socialYoutube]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));

  const hasRealAddress = Boolean(
    settings.city &&
      settings.pincode &&
      !/your\s+city|your\s+state|^0+$/i.test(settings.city.trim()) &&
      !/^0+$/.test(settings.pincode.trim())
  );

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${url}/#organization`,
      name: settings.brandName,
      legalName: settings.manufacturerName,
      url,
      description: siteDescription(settings),
      logo: {
        "@type": "ImageObject",
        url: absolute("/brand/jk-logo.svg"),
        caption: settings.brandName,
      },
      image: absolute("/brand/jk-logo.svg"),
      ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
      ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(settings.gstin ? { vatID: settings.gstin } : {}),
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
          ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
      ],
    },
  ];

  if (hasRealAddress) {
    graph.push({
      "@type": "LocalBusiness",
      "@id": `${url}/#localbusiness`,
      name: settings.brandName,
      parentOrganization: { "@id": `${url}/#organization` },
      url,
      image: absolute("/brand/jk-logo.svg"),
      ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
      ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.addressLine,
        addressLocality: settings.city,
        addressRegion: settings.state,
        postalCode: settings.pincode,
        addressCountry: "IN",
      },
      // Ties the business to the exact map pin staff configured, which is what
      // Google uses to match the entity to a place on Maps.
      hasMap: settings.mapUrl?.trim() || mapsHref(settings) || undefined,
      ...(settings.gstin ? { vatID: settings.gstin } : {}),
      // Opening hours are deliberately omitted rather than guessed.
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * WebSite node with a `SearchAction`.
 *
 * The action points at the catalogue search endpoint, which is what makes a
 * sitelinks searchbox eligible to appear under the site in results.
 */
export function websiteSchema(settings: SiteSettings) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url,
    name: brandTitle(settings),
    description: siteDescription(settings),
    inLanguage: "en-IN",
    publisher: { "@id": `${url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * ItemList for a product listing page, so Google can understand the catalogue
 * as an ordered set of products rather than an undifferentiated page of links.
 */
export function itemListSchema(products: ProductDTO[], settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brandTitle(settings)} — product catalogue`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}

/** ContactPage node, attached to the Contact page for a clearer SERP result. */
export function contactPageSchema(settings: SiteSettings) {
  const url = absolute("/contact");
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${url}#contact`,
    url,
    name: `Contact ${brandTitle(settings)}`,
    description: `Contact ${settings.manufacturerName} for product enquiries, wholesale pricing, bulk orders and dealership details.`,
    isPartOf: { "@id": `${siteUrl()}/#website` },
    about: { "@id": `${siteUrl()}/#organization` },
  };
}

/** AboutPage node. */
export function aboutPageSchema(settings: SiteSettings) {
  const url = absolute("/about");
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    url,
    name: `About ${brandTitle(settings)}`,
    description: siteDescription(settings),
    isPartOf: { "@id": `${siteUrl()}/#website` },
    about: { "@id": `${siteUrl()}/#organization` },
  };
}

/**
 * FAQPage node for /faq.
 *
 * `items` must be the exact questions and answers rendered on that page —
 * Google requires FAQ markup to match visible content, and this is the only
 * URL on the site that emits FAQPage (a second copy on the homepage would
 * compete with it and risk both being ignored).
 */
export function faqPageSchema(settings: SiteSettings, items: FaqItem[]) {
  const url = absolute("/faq");
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      name: `Frequently asked questions — ${brandTitle(settings)}`,
      description: `Answers to common questions about ordering, wholesale supply, payment and order tracking for ${settings.brandName} products.`,
      isPartOf: { "@id": `${siteUrl()}/#website` },
      about: { "@id": `${siteUrl()}/#organization` },
      mainEntity: items.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `Frequently asked questions — ${brandTitle(settings)}`,
      isPartOf: { "@id": `${siteUrl()}/#website` },
      about: { "@id": `${siteUrl()}/#organization` },
      inLanguage: "en-IN",
    },
  ];
}

