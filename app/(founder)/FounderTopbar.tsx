"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Settings, Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function FounderTopbar({ user }: { user: { name?: string | null; email?: string | null; founderMode: boolean } }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Anshkosh Logo" width={32} height={32} className="w-8 h-8" priority />
          <span className="text-xl font-bold font-heading tracking-tight">
            <span className="text-gray-900">ANSH</span>
            <span className="text-coral-500">KOSH</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Feed
          </Link>
          {user.founderMode && <Link href="/dashboard/journal" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Founder Journal</Link>}
          <Link href="/launch-support" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Free tools</Link>
          
          <div className="relative" onKeyDown={event => { if (event.key === "Escape") { setIsDropdownOpen(false); (event.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus(); } }}>
            <button 
              aria-label={`Account options for ${user.name || "your account"}`}
              aria-expanded={isDropdownOpen}
              aria-controls="account-options"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center text-xs font-bold uppercase">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              <span className="text-sm font-medium truncate max-w-[100px]">{user.name || "User"}</span>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div id="account-options" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link href="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings size={16} /> Profile settings
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden min-h-11 min-w-11 p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
          aria-controls="founder-mobile-navigation"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div id="founder-mobile-navigation" className="lg:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg">
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-bold uppercase">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name || "User"}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md">
              <LayoutDashboard size={20} className="text-gray-400" /> Dashboard
            </Link>
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-2 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Public Feed
            </Link>
            
            {user.founderMode && <Link href="/dashboard/journal" onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center px-2 text-gray-700 font-medium">Founder Journal</Link>}
            <Link href="/launch-support" onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center px-2 text-gray-700 font-medium">Free tools</Link>
            <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex min-h-11 items-center gap-2 px-2 text-gray-700 font-medium"><Settings size={20} /> Profile settings</Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-2 text-red-600 font-medium hover:bg-red-50 rounded-md text-left">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
