/** Pure synchronous slug generator. No DB calls — safe to use in tests and shared utilities. */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Async slug generator with DB uniqueness check.
 * Use this in server actions when creating a startup to avoid slug collisions.
 * Falls back to appending an incrementing suffix (my-app-2, my-app-3, …).
 */
export async function generateUniqueSlug(
  name: string,
  checkUnique: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;

  while (await checkUnique(slug)) {
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}
