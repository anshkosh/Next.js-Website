"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Discover", href: "/discover", routes: ["/discover", "/categories", "/category", "/startups"] },
  { label: "Leaderboard", href: "/leaderboard", routes: ["/leaderboard"] },
  { label: "Launch Support", href: "/launch-support", routes: ["/launch-support"] },
  { label: "Journal", href: "/journal", routes: ["/journal"] },
  { label: "FAQ", href: "/faq", routes: ["/faq"] },
  { label: "Contact", href: "/contact", routes: ["/contact"] },
];

export default function NavigationLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return links.map(({ label, href, routes }) => {
    const current = routes.some(route => pathname === route || pathname?.startsWith(`${route}/`));
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        onClick={onNavigate}
        className={mobile
          ? `rounded-xl px-3 py-3 font-medium transition-colors ${current ? "bg-coral-50 text-coral-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
          : `inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 font-medium transition-colors ${current ? "border-coral-600 text-coral-700" : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"}`}
      >
        {label}
      </Link>
    );
  });
}
