export function pageNumber(value: unknown, maximum = 10000): number {
  if (typeof value !== "string" || !/^[1-9]\d{0,8}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= maximum ? page : 1;
}

export function searchText(value: unknown, maximum = 200): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function pageHref(path: string, page: number, filters: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  query.set("page", String(page));
  return `${path}?${query}`;
}
