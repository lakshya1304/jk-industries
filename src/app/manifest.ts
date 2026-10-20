import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Super Cleaner — Cleaning & Automotive Care Products | JK Industries",
    short_name: "Super Cleaner",
    description:
      "Browse the Super Cleaner range from JK Industries and send wholesale or retail order requests.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f8fb",
    theme_color: "#0b1f3a",
    lang: "en-IN",
    dir: "ltr",
    categories: ["shopping", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/jk-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    // Surfaces the catalogue in the app switcher / long-press menu on Android.
    shortcuts: [
      {
        name: "All Products",
        short_name: "Products",
        description: "Browse the full Super Cleaner catalogue",
        url: "/products",
      },
      {
        name: "Track Order",
        short_name: "Track",
        description: "Check the status of an order request",
        url: "/track",
      },
      {
        name: "Contact",
        short_name: "Contact",
        description: "Enquiries, wholesale pricing and dealership details",
        url: "/contact",
      },
      {
        name: "FAQs",
        short_name: "FAQs",
        description: "Ordering, wholesale supply, payment and order tracking",
        url: "/faq",
      },
    ],
  };
}
