import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { adminSettingsSchema } from "@/lib/validation";
import { saveSettings } from "@/lib/settings";

/** PUT /api/admin/settings — persist branding, contact and visibility settings (admin only). */
export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const parsed = adminSettingsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check the settings values.",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 }
    );
  }

  const d = parsed.data;
  const stringMap: Record<string, string> = {
    brandName: d.brandName,
    manufacturerName: d.manufacturerName,
    tagline: d.tagline,
    whatsappNumber: d.whatsappNumber,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    addressLine: d.addressLine,
    city: d.city,
    state: d.state,
    pincode: d.pincode,
    gstin: d.gstin,
    showMRP: String(d.showMRP),
    showWholesalePrice: String(d.showWholesalePrice),
    showStockBadge: String(d.showStockBadge),
    heroTitle: d.heroTitle,
    heroSubtitle: d.heroSubtitle,
    heroImages: JSON.stringify(d.heroImages),
    brandIntro: d.brandIntro,
    aboutText: d.aboutText,
    whyChooseItems: JSON.stringify(d.whyChooseItems),
    socialInstagram: d.socialInstagram,
    socialFacebook: d.socialFacebook,
    socialYoutube: d.socialYoutube,
  };

  try {
    await saveSettings(stringMap);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/settings] failed to save settings:", err);
    return Response.json({ error: "Could not save settings. Please try again." }, { status: 500 });
  }
}
