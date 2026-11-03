"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidateSavedPath } from "@/lib/cache-after-save";
import { startupIdSchema } from "@/lib/validators/id.schema";
import { Prisma } from "@prisma/client";
export async function withdrawFromWall(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned) return { error: "Unauthorized" };
  if (!startupIdSchema.safeParse(id).success) return { error: "Invalid startup" };
  try {
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${id} FOR UPDATE`;
      const startup = await tx.startup.findUniqueOrThrow({ where: { id } });
      if (startup.founderId !== session.user.id) throw new Error("Unauthorized");
      await tx.startup.update({ where: { id }, data: { wallOptIn: false } });
      const revision = await tx.startupRevision.findUnique({ where: { startupId: id } });
      if (revision) await tx.startupRevision.update({ where: { id: revision.id }, data: {
        data: { ...(revision.data as Prisma.InputJsonObject), wallOptIn: false },
      } });
    });
    for (const path of ["/startup-wall", "/admin/featured", "/dashboard", `/startup/${id}/edit`]) revalidateSavedPath(path);
    return { success: true };
  } catch { return { error: "Withdrawal could not be saved. Please try again." }; }
}
