import Link from "next/link";
import Image from "next/image";
import { viewerSession } from "@/lib/viewer-session";
import MobileNav from "./MobileNav";
import FullSiteSearch from "./FullSiteSearch";
import NavigationLinks from "./NavigationLinks";
import AccountMenu from "./AccountMenu";

export default async function Header() {
  const session = await viewerSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-[#FAF8F5]/90 backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-950/90">
      <div className="container mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" aria-label="Anshkosh home" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.svg" alt="Anshkosh Logo" width={32} height={32} className="w-8 h-8" priority />
          <span className="text-2xl font-bold font-heading tracking-tight">
            <span className="text-gray-900">ANSH</span>
            <span className="text-coral-500">KOSH</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-end gap-2 whitespace-nowrap text-sm lg:flex 2xl:gap-5 2xl:text-base">
          <NavigationLinks />
          <FullSiteSearch />
          {session ? (
            <AccountMenu name={session.user.name} email={session.user.email} image={session.user.image} />
          ) : (
            <><Link href="/register" className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 font-medium text-coral-700 hover:bg-coral-50">Sign up</Link><Link href="/login" className="inline-flex min-h-11 items-center rounded-xl bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800">
              Login
            </Link></>
          )}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2 lg:hidden">
          {session && <Link href="/dashboard" className="max-w-28 truncate text-sm font-medium text-gray-700" aria-label={`Signed in as ${session.user.name}. Open dashboard.`}>{session.user.name}</Link>}
          <MobileNav authenticated={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
