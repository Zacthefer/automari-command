"use client";

import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between border-b border-[#e5eaef] bg-white/90 px-4 md:px-10 backdrop-blur-sm">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#7c8fac]">
        Command
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-[#e5eaef] hover:bg-[#f6f9fc]"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#2a3547]">
              {user?.name}
            </p>
            <p className="text-xs text-[#7c8fac]">
              {user?.tenant_name || "Admin"}
            </p>
          </div>
          <Avatar className="h-8 w-8 bg-[#5d87ff] text-white ring-2 ring-[#5d87ff]/25">
            <AvatarFallback className="bg-[#5d87ff] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-[#e5eaef] bg-white">
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#e5eaef]" />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
