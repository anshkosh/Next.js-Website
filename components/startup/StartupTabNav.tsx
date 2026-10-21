"use client";

import { useEffect, useRef, useState } from "react";
import { preferredScrollBehavior } from "@/lib/scroll-behavior";

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
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const barPlaced = useRef(false);

  // Transitions.dev tabs sliding: the underline glides to the active tab. It is
  // placed without a transition on first paint and on resize so it never slides in.
  useEffect(() => {
    const bar = barRef.current;
    const place = (animate: boolean) => {
      const tab = listRef.current?.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
      if (!bar || !tab) return;
      if (!animate) bar.style.transition = "none";
      bar.style.transform = `translateX(${tab.offsetLeft}px)`;
      bar.style.width = `${tab.offsetWidth}px`;
      if (!animate) { void bar.offsetWidth; bar.style.removeProperty("transition"); }
    };
    place(barPlaced.current);
    barPlaced.current = true;
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeTab]);

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

  const handleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    setActiveTab(id);
    isClickScrolling.current = true;
    // Each section's scroll-margin-top clears the sticky header and this nav.
    el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
    window.history.replaceState(null, "", `#${id}`);

    // Re-enable scroll-spy once the scroll settles; the timer covers browsers without scrollend.
    const release = () => { isClickScrolling.current = false; };
    window.addEventListener("scrollend", release, { once: true });
    setTimeout(release, 900);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Startup page sections"
      className="sticky top-16 z-40 w-full bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div
          ref={listRef}
          className="relative flex items-end gap-0 overflow-x-auto scrollbar-hide"
        >
          <span ref={barRef} aria-hidden="true" className="t-tabs-bar bg-coral-500" />
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                data-tab={tab.id}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => handleTabClick(event, tab.id)}
                className={[
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap",
                  "transition-colors duration-(--tabs-dur) border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-1",
                  isActive
                    ? "border-transparent text-coral-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
                ].join(" ")}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={[
                      "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                      isActive
                        ? "bg-coral-100 text-coral-700"
                        : tab.count === 0
                        ? "bg-gray-100 text-gray-600"
                        : "bg-coral-50 text-coral-700",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
