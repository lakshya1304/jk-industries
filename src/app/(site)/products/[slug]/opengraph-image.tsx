import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/products";
import { getSettings } from "@/lib/settings";

/**
 * Per-product Open Graph card.
 *
 * Sits in the `[slug]` segment, so Next generates one card per product URL
 * rather than every shared product link showing the generic site image. That
 * matters most on WhatsApp and Instagram, where this catalogue is actually
 * shared — a specific card gets more taps than a generic one.
 *
 * Satori quirk: every `<div>` with more than one child must declare an explicit
 * `display` (flex/contents/none) or the render throws. Every multi-child div
 * below therefore sets `display: flex` explicitly, including the root.
 */
export const alt = "Product from the Super Cleaner range by JK Industries";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = Promise<{ slug: string }>;

export default async function ProductOpengraphImage({ params }: { params: Params }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getSettings().catch(() => null),
  ]);

  const name = product?.name ?? "Super Cleaner";
  const brand = settings?.brandName ?? "Super Cleaner";
  const maker = settings?.manufacturerName ?? "JK Industries";
  const packs = product?.packSizes.map((p) => p.label).filter(Boolean).slice(0, 4) ?? [];
  const sku = product?.sku ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0b1f3a 0%, #12325c 60%, #0f7a52 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#9fe7c4",
            }}
          >
            {maker}
          </div>
          {sku ? (
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.72)" }}>
              SKU {sku}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 34 ? 64 : 78,
              fontWeight: 800,
              lineHeight: 1.08,
            }}
          >
            {name.length > 70 ? `${name.slice(0, 67).trimEnd()}…` : name}
          </div>
          {packs.length ? (
            <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: "#dbe6f5" }}>
              {packs.join("  •  ")}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(255,255,255,0.18)",
            paddingTop: 26,
            fontSize: 24,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          <div style={{ display: "flex" }}>{brand} range</div>
          <div style={{ display: "flex" }}>Retail • Wholesale • Bulk supply</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
