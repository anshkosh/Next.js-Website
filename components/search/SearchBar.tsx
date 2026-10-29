"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useRef, type FormEvent } from "react";
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
  const searchId = "discover-search";
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLFormElement>(null);

  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [debouncedText] = useDebounce(text, 300);

  const pushParams = useCallback(
    (newQuery: string, newCategory: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newQuery.trim()) params.set("q", newQuery.trim());
      else params.delete("q");

      if (newCategory && newCategory !== "all") params.set("category", newCategory);
      else params.delete("category");

      params.delete("page");

      const queryString = params.toString();
      const targetPath = pathname === "/" ? "/discover" : pathname;
      router.push(queryString ? `${targetPath}?${queryString}` : targetPath, { scroll: false });
    },
    [router, searchParams, pathname]
  );

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => trigger.current?.focus());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(urlQuery);
    setCategory(urlCategory);
  }, [urlQuery, urlCategory]);

  useEffect(() => {
    if (debouncedText !== urlQuery && debouncedText === text) {
      pushParams(debouncedText, category);
    }
  }, [debouncedText, text, urlQuery, category, pushParams]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialog.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outsideDialog = !dialog.current?.contains(active);

      if (event.shiftKey && (active === first || outsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    pushParams(text, newCategory);
  };

  const handleClearText = () => {
    setText("");
    pushParams("", category);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushParams(text, category);
    close();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={`${searchId}-dialog`}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-coral-400 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search startups
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-gray-950/45 px-4 py-[12vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <form
            ref={dialog}
            id={`${searchId}-dialog`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${searchId}-title`}
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={`${searchId}-title`} className="font-heading text-xl font-bold text-gray-900">Search startups</h2>
                <p className="mt-1 text-sm text-gray-600">Filter the directory by name or category.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close startup search"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 sm:flex-row">
              {categories.length > 0 && (
                <div className="relative border-b bg-gray-50/50 sm:w-56 sm:shrink-0 sm:border-b-0 sm:border-r">
                  <label htmlFor={`${searchId}-category`} className="sr-only">Filter by category</label>
                  <select
                    id={`${searchId}-category`}
                    value={category}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    className="h-full min-h-12 w-full appearance-none bg-transparent py-3 pl-4 pr-9 text-sm font-medium text-gray-700 outline-none hover:bg-gray-100"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim()}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="relative flex min-w-0 flex-1 items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <label htmlFor={`${searchId}-input`} className="sr-only">Search startups</label>
                <input
                  id={`${searchId}-input`}
                  autoFocus
                  name="q"
                  type="text"
                  autoComplete="off"
                  className="block min-h-12 min-w-0 w-full bg-transparent py-3 pl-11 pr-10 text-gray-900 outline-none placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                  placeholder="Search startups…"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                {text && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={handleClearText}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-coral-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
                Show results
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
