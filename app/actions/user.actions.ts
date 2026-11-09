"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStaffSession } from "@/lib/staff-session";
import { isStaffRole } from "@/lib/staff-access";
import { resetTwoFactor, validResetReason } from "@/lib/two-factor-reset";

export async function setAdminRole(formData: FormData) {
  const session = await getStaffSession({ adminOnly: true });

  if (!session) {
    return { error: "Unauthorized. Admin role required." };
  }

  const email = formData.get("email") as string;
  const role = formData.get("role") as string; // 'admin' | 'reviewer'

  if (!email || !role || !["admin", "reviewer"].includes(role)) {
    return { error: "Invalid email or role" };
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "User not found with that email" };
    }

    await db.user.update({
      where: { email },
      data: { role },
    });

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (error) {
    console.error("Set admin role error:", error);
    return { error: "Internal server error" };
  }
}

export async function removeAdminRole(id: string) {
  const session = await getStaffSession({ adminOnly: true });

  if (!session) {
    return { error: "Unauthorized. Admin role required." };
  }

  if (session.user.id === id) {
    return { error: "You cannot remove your own admin access." };
  }

  try {
    await db.user.update({
      where: { id },
      data: { role: "user" },
    });

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (error) {
    console.error("Remove admin role error:", error);
    return { error: "Internal server error" };
  }
}

export async function resetStaffTwoFactor(id: string, reason: string) {
  const session = await getStaffSession({ adminOnly: true });
  if (!session) return { error: "Unauthorized. Admin role required." };
  if (typeof id !== "string" || !id || id.length > 128) return { error: "Invalid account." };
  if (session.user.id === id) return { error: "You cannot reset your own two-factor authentication. Ask another admin." };
  if (!validResetReason(reason)) return { error: "Give a reason of 5 to 500 characters." };

  try {
    const result = await db.$transaction(async tx => {
      const target = await tx.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
      if (!target || !isStaffRole(target.role)) return null;
      return resetTwoFactor(tx, {
        operatorId: session.user.id,
        operatorName: session.user.name || session.user.email,
        targetUserId: target.id,
        targetEmail: target.email,
        reason,
      });
    });
    if (!result) return { error: "Only admin and reviewer accounts can be reset here." };
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (error) {
    console.error("Reset two-factor error:", error);
    return { error: "Internal server error" };
  }
}
