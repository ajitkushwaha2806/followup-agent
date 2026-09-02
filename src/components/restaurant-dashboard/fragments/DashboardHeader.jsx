"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function DashboardHeader({
  credential,
  isFetching,
  onRefresh,
}) {
  const isCredentialActive = credential?.status === "ACTIVE";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors group cursor-pointer shadow-xs"
          title="Back to Credentials"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {credential?.name || "Merchant Outlets"}
            </h1>
            {isCredentialActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                EXPIRED
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Zomato merchant outlet tracking & onboarding pipeline
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          title="Refresh outlet listing"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-red-500" : ""}`} />
          <span>Refresh</span>
        </button>

        <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <UserButton fallback={null} />
        </div>
      </div>
    </div>
  );
}
