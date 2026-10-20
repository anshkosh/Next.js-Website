import Link from "next/link";
import Image from "next/image";
import { viewerSession } from "@/lib/viewer-session";
import MobileNav from "./MobileNav";
import FullSiteSearch from "./FullSiteSearch";
import NavigationLinks from "./NavigationLinks";

export default async function Header() {
  const session = await viewerSession();

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
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-4 text-sm xl:gap-6 xl:text-base">
          <NavigationLinks />
          <FullSiteSearch />
          {session ? (
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl bg-coral-600 px-4 py-2 font-medium text-white transition-colors hover:bg-coral-700">
              <span className="max-w-32 truncate" title={`Signed in as ${session.user.name}`}>Dashboard · {session.user.name}</span>
            </Link>
          ) : (
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800">
              Login
            </Link>
          )}
        </nav>
        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          {session && <Link href="/dashboard" className="max-w-28 truncate text-sm font-medium text-gray-700" aria-label={`Signed in as ${session.user.name}. Open dashboard.`}>{session.user.name}</Link>}
          <MobileNav authenticated={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
