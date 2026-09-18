"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface JournalCategorySelectProps {
  categories: { id: string; name: string }[];
}

export default function JournalCategorySelect({ categories }: JournalCategorySelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("categoryId", e.target.value);
    } else {
      params.delete("categoryId");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={categoryId}
      onChange={handleChange}
      className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none bg-white"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
