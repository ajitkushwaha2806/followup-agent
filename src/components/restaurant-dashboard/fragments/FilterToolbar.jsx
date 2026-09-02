import { Search } from "lucide-react";
import { OUTLET_STATUS_FILTERS } from "../constants";

export default function FilterToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="relative w-full sm:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search outlet by name, ID, address, kitchen type..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {OUTLET_STATUS_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onStatusFilterChange(id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === id
                ? "bg-red-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
