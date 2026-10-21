"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemClass = "min-h-10 px-3 text-gray-700 focus:bg-coral-50 focus:text-coral-700";

// One signed-in entry point instead of three separate header links.
export default function AccountMenu({ name }: { name: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-coral-600 px-4 py-2 font-medium text-white transition-colors hover:bg-coral-700"
      >
        <span className="max-w-32 truncate">{name}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem className={itemClass} render={<Link href="/dashboard" />}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem className={itemClass} render={<Link href="/settings" />}>Profile settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} render={<Link href="/logout" />}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
