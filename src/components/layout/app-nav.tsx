"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Trophy, Zap, History, LogOut, BookOpen, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400"
        >
          <Leaf className="h-6 w-6" aria-hidden="true" />
          <span className="tracking-tight text-lg">EcoScore</span>
        </Link>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {APP_NAV_ITEMS.slice(1).map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-1.5")}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          {userName ? (
            <span className="ml-1 hidden text-sm font-semibold text-slate-700 dark:text-slate-300 md:inline">
              {userName}
            </span>
          ) : null}

          {onSignOut ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
