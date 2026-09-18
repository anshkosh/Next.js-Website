"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setAdminRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
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
