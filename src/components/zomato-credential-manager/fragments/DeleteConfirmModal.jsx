import { Trash2, RefreshCw } from "lucide-react";

export default function DeleteConfirmModal({
  item,
  isPending,
  onClose,
  onConfirm,
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Delete Credential?
          </h3>
          <p className="text-xs text-zinc-500">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              "{item.name}"
            </span>
            ? This will stop automated followup syncing for this account.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
