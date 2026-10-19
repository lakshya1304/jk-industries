import { z } from "zod";
import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { setProductActive } from "@/lib/product-writes";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ active: z.boolean() });

/** POST /api/admin/products/[id]/status — show/hide toggle (admin only). */
export async function POST(request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "Invalid status value." }, { status: 422 });
  }

  try {
    const product = await setProductActive(id, parsed.data.active);
    return Response.json({ ok: true, active: product.active });
  } catch {
    return Response.json({ error: "Could not update the product status." }, { status: 400 });
  }
}
