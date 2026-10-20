import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

/**
 * Site-wide Open Graph / Twitter card image.
 *
 * Built with `ImageResponse` from `next/og` (Satori + Resvg) rather than a
 * hand-rolled rasteriser: it is the supported API for this Next version, and it
 * is statically optimised at build time.
 *
 * Content comes from live settings, so the brand name in a shared card always
 * matches the site.
 *
 * Satori quirk: a `<div>` with more than one child must declare an explicit
 * `display`, or the render throws "Expected <div> to have explicit display".
 * Every multi-child div here sets `display: flex` for that reason.
 */
export const alt = "Super Cleaner by JK Industries — cleaning and automotive care products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getSettings().catch(() => null);
  const brand = settings?.brandName ?? "Super Cleaner";
  const maker = settings?.manufacturerName ?? "JK Industries";
  const tagline =
    settings?.tagline?.trim() ||
    "Cleaning & automotive care products — retail, wholesale and bulk supply.";

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
          background: "linear-gradient(135deg, #0b1f3a 0%, #12325c 55%, #0f7a52 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.24)",
              fontSize: 30,
              fontWeight: 800,
              color: "#9fe7c4",
              marginRight: 18,
            }}
          >
            SC
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.86)",
            }}
          >
            {maker}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 800, lineHeight: 1.05 }}>
            {brand}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 32,
              lineHeight: 1.35,
              color: "#dbe6f5",
              maxWidth: 900,
            }}
          >
            {tagline.length > 96 ? `${tagline.slice(0, 93).trimEnd()}…` : tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "2px solid rgba(255,255,255,0.18)",
            paddingTop: 26,
            fontSize: 24,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          <div style={{ display: "flex", marginRight: 28 }}>Retail</div>
          <div style={{ display: "flex", marginRight: 28 }}>Wholesale</div>
          <div style={{ display: "flex", marginRight: 28 }}>Bulk supply</div>
          <div style={{ display: "flex" }}>Carton quantities</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
