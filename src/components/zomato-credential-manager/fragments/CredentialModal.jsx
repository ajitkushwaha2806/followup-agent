import { KeyRound, X, AlertCircle, RefreshCw } from "lucide-react";

export default function CredentialModal({
  isOpen,
  editingItem,
  formData,
  formError,
  isSubmitting,
  onClose,
  onChangeFormData,
  onSubmit,
  onOpenGuide,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingItem ? "Edit Zomato Credential" : "Add Zomato Credential"}
              </h2>
              <p className="text-xs text-zinc-500">
                {editingItem
                  ? "Update merchant session credentials"
                  : "Save a new merchant session cookie"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Account / Outlet Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Downtown Bistro - Primary"
              value={formData.name}
              onChange={(e) =>
                onChangeFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Zomato Merchant Cookie <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Where to get this?</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Paste raw cookie string (e.g., _session_id=...; PHPSESSID=...)"
              value={formData.cookie}
              onChange={(e) =>
                onChangeFormData({ ...formData, cookie: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-zinc-100 scrollbar-thin"
              required
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Ensure the cookie includes active session identifiers from{" "}
              <span className="font-mono">zomato.com/merchant</span>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{editingItem ? "Save Changes" : "Create Credential"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
