import { pageNumber } from "@/lib/pagination";

export type JournalSearchParams = {
  category?: string | string[];
  page?: string | string[];
  [key: string]: string | string[] | undefined;
};

export type JournalListParams = {
  categorySlug: string;
  page: number;
};

function categorySlug(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function journalListParams(searchParams?: JournalSearchParams): JournalListParams {
  return {
    categorySlug: categorySlug(searchParams?.category),
    page: pageNumber(searchParams?.page),
  };
}

export function journalListHref({ categorySlug: category, page }: JournalListParams): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/journal${query ? `?${query}` : ""}`;
}
