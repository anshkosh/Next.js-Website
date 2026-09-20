"use client";

import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function FullSiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="site-search-panel" aria-label="Search the site" className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
        {open ? <X size={19} aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}
      </button>
      {open && (
        <form id="site-search-panel" onSubmit={submit} className="absolute right-0 top-12 z-50 flex w-[min(20rem,calc(100vw-2rem))] items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <label htmlFor="site-search-input" className="sr-only">Search the site</label>
          <Search size={18} className="ml-2 shrink-0 text-gray-400" aria-hidden="true" />
          <input id="site-search-input" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search startups, journal, pages…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white" />
          <button type="submit" className="rounded-lg bg-coral-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-600">Search</button>
        </form>
      )}
    </div>
  );
}
