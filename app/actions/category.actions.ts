"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/validators/category.schema";

function generateCategorySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createCategory(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    iconName: formData.get("iconName") as string,
  };

  const validated = categorySchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const slug = generateCategorySlug(validated.data.name);
    
    // Check if exists
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return { error: "Category with this name/slug already exists" };
    }

    // Get max sort order
    const maxSort = await db.category.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    
    const sortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

    await db.category.create({
      data: {
        ...validated.data,
        slug,
        sortOrder,
      }
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Internal server error" };
  }
}

export async function updateCategory(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    iconName: formData.get("iconName") as string,
  };

  const validated = categorySchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const slug = generateCategorySlug(validated.data.name);
    
    // Check if another category has this slug
    const existing = await db.category.findFirst({ 
      where: { slug, id: { not: id } } 
    });
    
    if (existing) {
      return { error: "Category with this name/slug already exists" };
    }

    await db.category.update({
      where: { id },
      data: {
        ...validated.data,
        slug,
      }
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { error: "Internal server error" };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    const count = await db.startup.count({ where: { categoryId: id } });
    if (count > 0) {
      return { error: `Cannot delete category. There are ${count} startups in this category.` };
    }

    await db.category.delete({
      where: { id }
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Internal server error" };
  }
}
