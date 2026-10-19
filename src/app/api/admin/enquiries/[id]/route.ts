import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { enquiryStatusSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/enquiries/[id] — update enquiry status (admin only). */
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const parsed = enquiryStatusSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "Invalid status value." }, { status: 422 });
  }

  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return Response.json({ ok: true, status: enquiry.status });
  } catch {
    return Response.json({ error: "Could not update the enquiry." }, { status: 400 });
  }
}
