import { KeyRound, Plus } from "lucide-react";

export default function EmptyState({
  hasSearchOrFilter,
  onResetFilters,
  onOpenAddModal,
}) {
  return (
    <div className="text-center py-16 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
        <KeyRound className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          {hasSearchOrFilter
            ? "No matching credentials found"
            : "No Zomato credentials configured"}
        </h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          {hasSearchOrFilter
            ? "Try clearing your search query or changing filter settings."
            : "Add your Zomato merchant cookie to start syncing restaurant orders, reviews, and customer followups."}
        </p>
      </div>
      {hasSearchOrFilter ? (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
        >
          Reset Filters
        </button>
      ) : (
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Your First Credential</span>
        </button>
      )}
    </div>
  );
}
