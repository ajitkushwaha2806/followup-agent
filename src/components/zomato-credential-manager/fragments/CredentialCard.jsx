import Link from "next/link";
import { Clock, RefreshCw, Edit3, Trash2, ArrowRight, Store } from "lucide-react";
import { formatDate } from "../helpers";

export default function CredentialCard({ item, isTesting, onTestConnection, onEdit, onDeleteConfirm }) {
  const isActive = item.status === "ACTIVE";

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-200 shadow-sm hover:shadow-md p-5 ${isActive
          ? "border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-900"
          : "border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40"
        }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-semibold text-base shadow-sm">
              {item.name ? item.name.charAt(0).toUpperCase() : "Z"}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug line-clamp-1">
                {item.name}
              </h3>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>

          <div>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                EXPIRED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onTestConnection(item._id)}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-red-500" : ""}`} />
            <span>{isTesting ? "Testing..." : "Test Connection"}</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Edit Credential"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteConfirm(item)}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete Credential"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
