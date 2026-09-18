"use client";

import { LogOut, Menu } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AdminTopbar({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/admin/login");
  };

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
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline-block">Logout</span>
        </button>
      </div>
    </header>
  );
}
