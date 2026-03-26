"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, Eye, LogOut, Settings, User } from "lucide-react";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

export function AppTopNavUserMenu({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5 hover:border-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      >
        <ProfileAvatar
          src={image}
          alt={name ?? "User"}
          fallback={(name ?? email ?? "U").charAt(0).toUpperCase()}
          className="h-7 w-7 rounded-full"
          fallbackClassName="bg-cyan-500/20 text-cyan-200 text-xs"
        />
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border/70 bg-background/95 p-2 shadow-xl backdrop-blur">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{name ?? "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? ""}</p>
          </div>
          <Link href="/app/profile" className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground">
            <User className="h-4 w-4" />
            View Profile
          </Link>
          <Link href="/app/settings" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link href="/app/profile" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground">
            <Eye className="h-4 w-4" />
            Visibility
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
