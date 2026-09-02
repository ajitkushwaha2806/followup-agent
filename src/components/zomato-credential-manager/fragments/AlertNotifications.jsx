import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function AlertNotifications({
  successMessage,
  errorMessage,
  onClearSuccess,
  onClearError,
}) {
  return (
    <>
      {successMessage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={onClearSuccess}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
