export const PUBLIC_UPDATES_PAGE_SIZE = 3;

export function updatesPageHref(slug: string, page: number, journalPage = 1) {
  const params = new URLSearchParams();
  if (page > 1) params.set("updatesPage", String(page));
  if (journalPage > 1) params.set("journalPage", String(journalPage));
  const query = params.toString();
  return `/startups/${encodeURIComponent(slug)}${query ? `?${query}` : ""}#section-updates`;
}
