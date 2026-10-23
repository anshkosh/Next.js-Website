"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  Tags,
  Settings,
  Users,
  Menu,
  Star,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

export default function AdminSidebar({ role, pendingReviewCount, pendingCommentCount }: { role: string, pendingReviewCount: number, pendingCommentCount: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["admin", "reviewer"] },
    { name: "Startups", href: "/admin/startups", icon: Rocket, roles: ["admin", "reviewer"] },
    { name: "Featured", href: "/admin/featured", icon: Star, roles: ["admin"] },
    { name: "Moderation", href: "/admin/moderation", icon: ShieldCheck, roles: ["admin", "reviewer"], badge: pendingReviewCount },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare, roles: ["admin", "reviewer"], badge: pendingCommentCount },
    { name: "Content review", href: "/admin/content-review", icon: ShieldCheck, roles: ["admin", "reviewer"] },
    { name: "Categories", href: "/admin/categories", icon: Tags, roles: ["admin", "reviewer"] },
    { name: "Journal", href: "/admin/journal", icon: BookOpen, roles: ["admin"] },
    { name: "Founder Journal review", href: "/admin/founder-journal", icon: BookOpen, roles: ["admin", "reviewer"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
    { name: "Admins", href: "/admin/admins", icon: Users, roles: ["admin"] },
  ];

  return (
    <div className={`bg-gray-900 text-white transition-[width] duration-300 flex flex-col ${collapsed ? "w-16" : "w-64"} hidden md:flex`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && <span className="font-bold text-lg">Admin Panel</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-800 rounded">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.filter(item => item.roles.includes(role)).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive ? "bg-coral-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
