import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { productInputSchema } from "@/lib/validation";
import { deleteProduct, ProductInUseError, updateProduct } from "@/lib/product-writes";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/products/[id] — full update from the edit form (admin only). */
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
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
    const result = await updateProduct(id, parsed.data);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update the product.";
    return Response.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/admin/products/[id] — permanent delete (admin only, blocked if used in orders). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    await deleteProduct(id);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof ProductInUseError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Could not delete the product.";
    return Response.json({ error: message }, { status: 400 });
  }
}
