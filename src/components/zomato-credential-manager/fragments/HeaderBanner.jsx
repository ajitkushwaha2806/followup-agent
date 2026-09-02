import { Plus } from "lucide-react";

export default function HeaderBanner({ onOpenAddModal }) {
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

      <div>
        <button
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-md shadow-red-600/20 hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Credential</span>
        </button>
      </div>
    </div>
  );
}
