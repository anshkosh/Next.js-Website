import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export function revalidateSavedPath(path: string) {
  try { revalidatePath(path); }
  catch { logger.warn("Saved change committed; cache refresh delayed", { path }); }
}
