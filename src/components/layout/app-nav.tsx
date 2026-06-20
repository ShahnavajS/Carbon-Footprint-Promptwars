"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Trophy, Zap, History, LogOut, BookOpen, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primary navigation for authenticated pages.
 *
 * The active link is derived from the pathname so every authenticated surface
 * (dashboard, journey, simulator, history, learn, community) shares one
 * consistent header instead of each page rolling its own.
 */

export interface AppNavItem {
  href: string;
  label: string;
  icon: typeof Trophy;
  /** Match a different prefix as active (e.g. /dashboard active on home). */
  activePrefix?: string;
}

/**
 * All authenticated nav destinations.
 */
export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/dashboard", label: "Home", icon: Leaf, activePrefix: "/dashboard" },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/twin", label: "Twin", icon: Sparkles },
  { href: "/journey", label: "Journey", icon: Trophy },
  { href: "/simulator", label: "Simulator", icon: Zap },
  { href: "/community", label: "Community", icon: Users },
  { href: "/history", label: "History", icon: History },
] as const;

interface AppNavProps {
  userName?: string;
  onSignOut?: () => void;
}

export function AppNav({ userName, onSignOut }: AppNavProps) {
  const pathname = usePathname() ?? "";

  const isActive = (item: AppNavItem) =>
    pathname === item.href ||
    pathname.startsWith((item.activePrefix ?? item.href) + "/") ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md dark:border-forest-800 dark:bg-forest-950/80"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-medium tracking-tight text-forest-700 dark:text-forest-200"
        >
          <Leaf className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">EcoScore</span>
        </Link>

        {/* Horizontal-scroll icon rail — scrolls on mobile, never wraps */}
        <div
          className="flex flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1"
          role="menubar"
          aria-label="Section navigation"
          style={{ scrollbarWidth: "none" }}
        >
          {APP_NAV_ITEMS.slice(1).map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-forest-700 text-paper dark:bg-forest-600"
                    : "text-ink-soft hover:bg-canvas-soft hover:text-forest-700 dark:text-forest-200/70 dark:hover:bg-forest-900/50"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right zone: user + sign out */}
        <div className="flex shrink-0 items-center gap-2">
          {userName ? (
            <span className="hidden text-xs font-medium text-ink-muted dark:text-forest-200/60 lg:inline">
              {userName}
            </span>
          ) : null}
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-canvas-soft hover:text-forest-700 dark:text-forest-200/60 dark:hover:bg-forest-900/50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
