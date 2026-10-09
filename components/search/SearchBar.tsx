"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchBarProps {
  categories?: Category[];
}

export default function SearchBar({ categories = [] }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";

  const [text, setText] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [debouncedText] = useDebounce(text, 300);

  const pushParams = useCallback(
    (newQuery: string, newCategory: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQuery.trim()) {
        params.set("q", newQuery.trim());
      } else {
        params.delete("q");
      }

      if (newCategory && newCategory !== "all") {
        params.set("category", newCategory);
      } else {
        params.delete("category");
      }

      params.delete("page");

      const queryString = params.toString();
      const targetPath = pathname === "/" ? "/discover" : pathname;
      const url = queryString ? `${targetPath}?${queryString}` : targetPath;
      router.push(url, { scroll: false });
    },
    [router, searchParams, pathname]
  );

  // Synchronize internal state when URL searchParams change externally (e.g. "Clear all filters")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(urlQuery);
    setCategory(urlCategory);
  }, [urlQuery, urlCategory]);

  // Handle debounced text search update to URL
  useEffect(() => {
    // Only push if debouncedText actually differs from current URL query AND matches current input text
    // (prevents pushing stale lagged debounced values when URL searchParams were cleared externally)
    if (debouncedText !== urlQuery && debouncedText === text) {
      pushParams(debouncedText, category);
    }
  }, [debouncedText, text, urlQuery, category, pushParams]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    pushParams(text, newCategory);
  };

  const handleClearText = () => {
    setText("");
    pushParams("", category);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto flex items-center bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-coral-500 focus-within:border-transparent transition-all">
      {categories.length > 0 && (
        <div className="relative flex-shrink-0 border-r border-gray-200 bg-gray-50/50">
          <label htmlFor="startup-category" className="sr-only">Filter by category</label>
          <select
            id="startup-category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="appearance-none bg-transparent pl-4 pr-8 py-4 text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim()} {/* Remove emojis for clean dropdown */}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      )}
      
      <div className="relative flex-1 flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <label htmlFor="startup-search" className="sr-only">Search startups</label>
        <input
          id="startup-search"
          name="q"
          type="text"
          autoComplete="off"
          className="block min-w-0 w-full pl-11 pr-10 py-4 bg-transparent text-gray-900 placeholder-gray-500 outline-none"
          placeholder="Search startups, founders, or locations..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClearText}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
