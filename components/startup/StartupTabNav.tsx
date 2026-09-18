"use client";

import { useEffect, useRef, useState } from "react";

type Tab = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
};

export default function StartupTabNav({ tabs }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const isClickScrolling = useRef(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    const sectionIds = tabs.map((t) => t.id);
    const observers: IntersectionObserver[] = [];

    // Track which sections are currently intersecting, pick the topmost
    const intersecting = new Map<string, boolean>();

    const pickActive = () => {
      if (isClickScrolling.current) return;
      for (const id of sectionIds) {
        if (intersecting.get(id)) {
          setActiveTab(id);
          return;
        }
      }
    };

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            intersecting.set(id, entry.isIntersecting);
          });
          pickActive();
        },
        {
          // Highlights a tab when the section enters the top portion of the viewport
          rootMargin: "-10% 0px -70% 0px",
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [tabs]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    isClickScrolling.current = true;

    const el = document.getElementById(id);
    if (el) {
      // Offset: sticky header (64px) + sticky tab nav (49px) + small gap (8px)
      const offset = 64 + 49 + 8;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }

    // Re-enable scroll-spy after the scroll animation (~900ms)
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 900);
  };

  return (
    <div
      ref={navRef}
      className="sticky top-16 z-40 w-full bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div
          role="tablist"
          aria-label="Startup page sections"
          className="flex items-end gap-0 overflow-x-auto scrollbar-hide"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={[
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap",
                  "transition-all duration-200 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-1",
                  isActive
                    ? "border-coral-500 text-coral-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
                ].join(" ")}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={[
                      "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                      isActive
                        ? "bg-coral-100 text-coral-600"
                        : tab.count === 0
                        ? "bg-gray-100 text-gray-400"
                        : "bg-coral-50 text-coral-500",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
