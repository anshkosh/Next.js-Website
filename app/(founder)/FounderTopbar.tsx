"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import AccountAvatar from "@/components/account/AccountAvatar";
import AccountMenu from "@/components/layout/AccountMenu";

export default function FounderTopbar({ user }: { user: { name?: string | null; image?: string | null; email?: string | null; founderMode: boolean } }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const name = user.name || "Your account";

  const links = [
    { label: "Dashboard", href: "/dashboard", current: pathname === "/dashboard" },
    ...(user.founderMode ? [{ label: "Founder Journal", href: "/dashboard/journal", current: pathname?.startsWith("/dashboard/journal") ?? false }] : []),
    { label: "Discover", href: "/discover", current: false },
    { label: "Free tools", href: "/launch-support", current: false },
  ];

  // Mount the phone menu closed, then open it on the next frame so it can grow in.
  useEffect(() => {
    if (!isMenuOpen) return;
    const frame = requestAnimationFrame(() => setMenuShown(true));
    return () => { cancelAnimationFrame(frame); setMenuShown(false); };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" aria-label="Anshkosh home" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" priority />
          <span className="font-heading text-xl font-bold tracking-tight">
            <span className="text-gray-900">ANSH</span>
            <span className="text-coral-500">KOSH</span>
          </span>
        </Link>

        <nav aria-label="Founder navigation" className="hidden items-center gap-6 lg:flex">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border-b-2 text-sm font-medium transition-colors ${link.current ? "border-coral-600 text-coral-700" : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"}`}
            >
              {link.label}
            </Link>
          ))}
          <AccountMenu name={name} email={user.email} image={user.image} />
        </nav>

        <button
          type="button"
          className="min-h-11 min-w-11 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
          aria-controls="founder-mobile-navigation"
          onClick={() => setIsMenuOpen(open => !open)}
        >
          <span className="t-icon-swap" data-state={isMenuOpen ? "b" : "a"} aria-hidden="true">
            <Menu size={24} className="t-icon" data-icon="a" />
            <X size={24} className="t-icon" data-icon="b" />
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <nav id="founder-mobile-navigation" aria-label="Founder navigation" className={`t-dropdown${menuShown ? " is-open" : ""} absolute w-full border-t border-gray-100 bg-white shadow-lg lg:hidden`}>
          <div className="space-y-1 px-4 py-4">
            <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-4">
              <AccountAvatar name={user.name || user.email} image={user.image} />
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{name}</p>
                {user.email && <p className="truncate text-sm text-gray-600">{user.email}</p>}
              </div>
            </div>
            {[...links, { label: "Profile settings", href: "/settings", current: pathname === "/settings" }].map(link => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.current ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={`flex min-h-11 items-center rounded-xl px-3 font-medium ${link.current ? "bg-coral-50 text-coral-700" : "text-gray-700 hover:bg-gray-100"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/logout" prefetch={false} onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-medium text-red-700 hover:bg-red-50">
              <LogOut size={18} aria-hidden="true" /> Logout
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
