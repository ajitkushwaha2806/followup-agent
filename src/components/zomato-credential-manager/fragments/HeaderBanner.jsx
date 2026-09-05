"use client";

import Link from "next/link";
import { Plus, UtensilsCrossed, ArrowRight } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { getUserAccess } from "@/lib/auth/access";

export default function HeaderBanner({ onOpenAddModal }) {
  const { user } = useUser();
  const { hasRestaurant } = getUserAccess(user);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Zomato Credentials
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage and verify merchant session cookies
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {hasRestaurant && (
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-400" />
            <span>Manage Restaurants</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        )}

        <button
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-md shadow-red-600/20 hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Credential</span>
        </button>

        <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <UserButton fallback={null} />
        </div>
      </div>
    </div>
  );
}
