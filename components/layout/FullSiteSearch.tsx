"use client";

import { Search, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function FullSiteSearch({ align = "right" }: { align?: "left" | "right" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className={`relative ${align === "left" ? "w-full" : ""}`} onKeyDown={event => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button ref={toggle} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="site-search-panel" aria-label="Search the site" className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
        {open ? <X size={19} aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}
      </button>
      {open && (
        <form id="site-search-panel" onSubmit={submit} className={`${align === "left" ? "relative w-full" : "absolute right-0 top-full w-[min(20rem,calc(100vw-2rem))]"} z-50 mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-soft`}>
          <label htmlFor="site-search-input" className="sr-only">Search the site</label>
          <Search size={18} className="ml-2 shrink-0 text-gray-400" aria-hidden="true" />
          <input id="site-search-input" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search startups, journal, pages…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-500" />
          <button type="submit" className="min-h-11 rounded-xl bg-coral-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-700">Search</button>
        </form>
      )}
    </div>
  );
}
