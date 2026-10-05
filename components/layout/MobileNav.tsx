"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import FullSiteSearch from "./FullSiteSearch";

const links = [
  ["Discover", "/discover"],
  ["Launch Support", "/launch-support"],
  ["Journal", "/journal"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
] as const;

export default function MobileNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none dark:text-gray-200 dark:hover:bg-gray-800"
      >
        {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-16 border-b border-gray-200 bg-[#FAF8F5] px-4 py-4 shadow-lg dark:border-gray-700 dark:bg-gray-950">
          <div className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                {label}
              </Link>
            ))}
            <Link href={authenticated ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="mt-2 rounded-md bg-gray-900 px-3 py-3 text-center font-medium text-white hover:bg-gray-800">
              {authenticated ? "Dashboard" : "Login"}
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
              <FullSiteSearch />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
