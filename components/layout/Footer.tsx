import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Discover", href: "/discover" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Categories", href: "/categories" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    title: "For founders",
    links: [
      { label: "List your startup", href: "/startup/new" },
      { label: "Free Launch Support", href: "/launch-support" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Anshkosh", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "Trust & Safety", href: "/trust-safety" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Notice", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Beta Tester Consent", href: "/beta-consent" },
    ],
  },
];

// Tall enough to tap on phones, tighter on desktop where a pointer is precise.
const linkClass = "inline-flex min-h-10 items-center text-gray-700 transition-colors hover:text-coral-700 lg:min-h-8";

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:gap-8">
          <div className="space-y-4">
            <Link href="/" aria-label="Anshkosh home" className="inline-flex items-center gap-2">
              <Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="font-heading text-2xl font-bold tracking-tight">
                <span className="text-gray-900">ANSH</span>
                <span className="text-coral-500">KOSH</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-600">
              Discover Indian startups before launch.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:contents">
            {columns.map(column => (
              <nav key={column.title} aria-labelledby={`footer-${column.title.toLowerCase().replace(/\s+/g, "-")}`} className="min-w-0">
                <h2 id={`footer-${column.title.toLowerCase().replace(/\s+/g, "-")}`} className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-gray-900">
                  {column.title}
                </h2>
                <ul className="mt-3 text-sm">
                  {column.links.map(link => (
                    <li key={link.href}><Link href={link.href} className={linkClass}>{link.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Right padding keeps this text clear of the floating Contact and back-to-top buttons. */}
        <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between md:pr-40">
          <p>© 2026 Anshkosh. All rights reserved. · <a href="mailto:hello@anshkosh.com" className="underline-offset-2 hover:text-coral-700 hover:underline">hello@anshkosh.com</a> · India</p>
          <p>This platform is an early-access pilot. Payments and preorders are not open during the pilot.</p>
        </div>
      </div>
    </footer>
  );
}
