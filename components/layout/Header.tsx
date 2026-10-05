import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import MobileNav from "./MobileNav";
import FullSiteSearch from "./FullSiteSearch";

export default async function Header() {
  const session = process.env.DATABASE_URL
    ? await auth.api.getSession({
        headers: await headers(),
      })
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-[#FAF8F5]/90 backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-950/90">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Anshkosh home" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Anshkosh Logo" width={32} height={32} className="w-8 h-8" priority />
          <span className="text-2xl font-bold font-heading tracking-tight">
            <span className="text-gray-900">ANSH</span>
            <span className="text-coral-500">KOSH</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
          <Link href="/discover" className="text-gray-600 hover:text-gray-900 font-medium">Discover</Link>
          <Link href="/launch-support" className="text-gray-600 hover:text-gray-900 font-medium">Startup Support</Link>
          <Link href="/journal" className="text-gray-600 hover:text-gray-900 font-medium">Journal</Link>
          <Link href="/faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
          <FullSiteSearch />
          {session ? (
            <Link href="/dashboard" className="px-4 py-2 bg-coral-500 text-white rounded-md font-medium hover:bg-coral-600 transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors">
              Login
            </Link>
          )}
        </nav>
        <MobileNav authenticated={Boolean(session)} />
      </div>
    </header>
  );
}
