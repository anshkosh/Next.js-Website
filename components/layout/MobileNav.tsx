"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FullSiteSearch from "./FullSiteSearch";
import NavigationLinks from "./NavigationLinks";

export default function MobileNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Mount closed, then open on the next frame so the panel can grow from the header.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setShown(true));
    return () => { cancelAnimationFrame(frame); setShown(false); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  return (
    <div ref={container} className="lg:hidden" onKeyDown={event => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100"
      >
        <span className="t-icon-swap" data-state={open ? "b" : "a"} aria-hidden="true">
          <Menu size={24} className="t-icon" data-icon="a" />
          <X size={24} className="t-icon" data-icon="b" />
        </span>
      </button>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className={`t-dropdown${shown ? " is-open" : ""} absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-gray-200 bg-[#FAF8F5] px-4 py-4 shadow-soft`}>
          <div className="flex flex-col gap-1">
            <NavigationLinks mobile onNavigate={() => setOpen(false)} />
            <Link href={authenticated ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-gray-900 px-3 py-3 text-center font-medium text-white hover:bg-gray-800">
              {authenticated ? "Dashboard" : "Login"}
            </Link>
            {authenticated && <><Link href="/settings" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-3 font-medium text-gray-700">Profile settings</Link><Link href="/logout" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-3 font-medium text-red-700">Logout</Link></>}
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
              <FullSiteSearch align="left" />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
