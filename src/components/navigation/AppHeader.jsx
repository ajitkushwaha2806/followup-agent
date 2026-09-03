"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { ClipboardList, UtensilsCrossed, Sparkles } from "lucide-react";
import { getUserAccess } from "@/lib/auth/access";

export default function AppHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const { hasOnboarding, hasRestaurant } = getUserAccess(user);

  const isOnboarding = pathname.startsWith("/onboarding");
  const isRestaurant = pathname === "/" || pathname.startsWith("/restaurant");
  const homeLink = hasOnboarding && !hasRestaurant ? "/onboarding" : "/";

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href={homeLink} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-black text-base shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              Z
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                <span>Zomato Ops Agent</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  v2.0
                </span>
              </span>
              <p className="text-[10px] text-zinc-400 -mt-0.5 hidden sm:block">
                Menu Pricing & Onboarding Management
              </p>
            </div>
          </Link>

          {/* Navigation Tabs (only shown when user has both or respective access) */}
          {(hasOnboarding || hasRestaurant) && (
            <nav className="flex items-center bg-zinc-100/90 dark:bg-zinc-800/90 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/50">
              {hasRestaurant && (
                <Link
                  href="/"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isRestaurant
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                  <span>Menu & Pricing</span>
                </Link>
              )}

              {hasOnboarding && (
                <Link
                  href="/onboarding"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isOnboarding
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                  <span>Onboarding Tracker</span>
                </Link>
              )}
            </nav>
          )}

          {/* User Button */}
          <div className="flex items-center gap-2">
            <UserButton fallback={null} />
          </div>
        </div>
      </div>
    </header>
  );
}
