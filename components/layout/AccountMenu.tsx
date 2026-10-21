"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import AccountAvatar from "@/components/account/AccountAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemClass = "min-h-11 px-3 text-gray-700 focus:bg-coral-50 focus:text-coral-700";

// The one account menu, shared by the public header and the founder top bar.
export default function AccountMenu({ name, email, image }: { name: string; email?: string | null; image?: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pr-3 pl-1.5 text-sm font-medium text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <AccountAvatar name={name || email} image={image} />
        <span className="max-w-32 truncate">{name}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2">
            <span className="block truncate text-sm font-semibold text-gray-900">{name}</span>
            {email && <span className="block truncate text-xs font-normal text-gray-600">{email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} render={<Link href="/dashboard" />}><LayoutDashboard aria-hidden="true" /> Dashboard</DropdownMenuItem>
        <DropdownMenuItem className={itemClass} render={<Link href="/settings" />}><Settings aria-hidden="true" /> Profile settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} render={<Link href="/logout" prefetch={false} />}><LogOut aria-hidden="true" /> Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
