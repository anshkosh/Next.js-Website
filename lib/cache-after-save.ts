import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export function revalidateSavedPath(path: string, type?: "page" | "layout") {
  try { if (type) revalidatePath(path, type); else revalidatePath(path); }
  catch { logger.warn("Saved change committed; cache refresh delayed", { path }); }
}
