"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

export default function AdminTopbar({ user }: { user: { name?: string | null; role?: string | null } }) {

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <h1 className="font-semibold text-gray-800 md:hidden">Admin</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
          {user.name} ({user.role})
        </span>
        <Link href="/settings" className="inline-flex min-h-11 items-center text-sm font-medium text-gray-700 hover:text-coral-700">Profile settings</Link>
        <Link href="/logout" prefetch={false} className="flex min-h-11 items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <LogOut size={16} /><span className="hidden sm:inline-block">Logout</span>
        </Link>
      </div>
    </header>
  );
}
