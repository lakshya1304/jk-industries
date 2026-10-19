import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { productInputSchema } from "@/lib/validation";
import { createProduct } from "@/lib/product-writes";

/** POST /api/admin/products — create a product (admin only). */
export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const body = await readJson(request);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check the product details.",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 }
    );
  }

  try {
    const product = await createProduct(parsed.data);
    return Response.json({ ok: true, id: product.id, slug: product.slug }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create the product.";
    return Response.json({ error: message }, { status: 400 });
  }
}
