import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession, unauthorizedResponse, readJson } from "@/lib/api-auth";
import { changePasswordSchema } from "@/lib/validation";

/** POST /api/admin/password — change the signed-in admin's password. */
export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const parsed = changePasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Please check the password fields.",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 }
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: session.email } });
  if (!admin) return unauthorizedResponse();

  const currentOk = await compare(parsed.data.currentPassword, admin.passwordHash);
  if (!currentOk) {
    return Response.json({ error: "Your current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });

  return Response.json({ ok: true });
}
