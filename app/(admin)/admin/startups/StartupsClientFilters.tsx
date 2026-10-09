"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";

export default function StartupsClientFilters({ categories }: { categories: { id: string, name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page"); // reset to page 1 on filter
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (debouncedSearch !== searchParams.get("q")) {
      router.push(pathname + "?" + createQueryString("q", debouncedSearch));
    }
  }, [debouncedSearch, pathname, router, createQueryString, searchParams]);

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search startups by name..."
          className="pl-10 w-full border-gray-300 rounded-md p-2 border focus:ring-coral-500 focus:border-coral-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        <select 
          className="border-gray-300 rounded-md p-2 border bg-white flex-1 md:flex-none min-w-[140px]"
          value={searchParams.get("status") || ""}
          onChange={(e) => router.push(pathname + "?" + createQueryString("status", e.target.value))}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="LIVE">Live</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select 
          className="border-gray-300 rounded-md p-2 border bg-white flex-1 md:flex-none min-w-[140px]"
          value={searchParams.get("categoryId") || ""}
          onChange={(e) => router.push(pathname + "?" + createQueryString("categoryId", e.target.value))}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select 
          className="border-gray-300 rounded-md p-2 border bg-white flex-1 md:flex-none min-w-[140px]"
          value={searchParams.get("sort") || ""}
          onChange={(e) => router.push(pathname + "?" + createQueryString("sort", e.target.value))}
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="signals_desc">Most Signals</option>
          <option value="signals_asc">Least Signals</option>
          <option value="upvotes_desc">Most Upvotes</option>
          <option value="upvotes_asc">Least Upvotes</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>
    </div>
  );
}
