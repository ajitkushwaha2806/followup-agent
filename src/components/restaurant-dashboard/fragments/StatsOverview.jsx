import { Store, Clock, Activity, CheckCircle2 } from "lucide-react";

export default function StatsOverview({ stats, currentType, onSelectType }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total in View</p>
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">{stats.totalOutlets}</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">Registered in current view</span>
      </div>

      <button
        onClick={() => onSelectType && onSelectType("active-requests")}
        className={`text-left rounded-2xl p-5 border transition-all cursor-pointer shadow-sm ${
          currentType === "active-requests"
            ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Requests</p>
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-amber-600 dark:text-amber-400">{stats.activeRequestsCount}</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">In onboarding review &rarr;</span>
      </button>

      <button
        onClick={() => onSelectType && onSelectType("live")}
        className={`text-left rounded-2xl p-5 border transition-all cursor-pointer shadow-sm ${
          currentType === "live"
            ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Live Outlets</p>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{stats.liveRestaurantsCount}</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">Live on Zomato platform &rarr;</span>
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Under Review</p>
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">{stats.underReviewCount}</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">Awaiting partner verification</span>
      </div>
    </div>
  );
}
