"use client";

import Link from "next/link";
import {
  Clock,
  Edit3,
  Trash2,
  RefreshCw,
  Utensils,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/components/zomato-credential-manager/helpers";
import Pagination from "@/components/zomato-credential-manager/fragments/Pagination";

function MenuCredentialTableRow({
  item,
  onEdit,
  onDeleteConfirm,
  onTestConnection,
  isTesting = false,
}) {
  const isSessionActive = item.status === "ACTIVE";

  return (
    <tr className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group">
      {/* Account column */}
      <td className="py-4 px-6 align-top">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 mt-0.5">
            {item.name ? item.name.charAt(0).toUpperCase() : "M"}
          </div>
          <div className="min-w-0 space-y-1">
            <span
              className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate block"
              title={item.name}
            >
              {item.name}
            </span>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{formatDate(item.createdAt)}</span>
              {item.email && (
                <span className="text-zinc-500 truncate max-w-xs">
                  · {item.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Session status */}
      <td className="py-4 px-6 whitespace-nowrap align-top">
        {isSessionActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            EXPIRED
          </span>
        )}
      </td>

      {/* Actions & Navigation to /restaurant/[id] */}
      <td className="py-4 px-6 whitespace-nowrap text-right align-top">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/restaurant/${item._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title={`View outlets and manage menu for ${item.name}`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Manage Outlets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {onTestConnection && (
            <button
              onClick={() => onTestConnection(item._id)}
              disabled={isTesting}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Test & Verify Session Cookie"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isTesting ? "animate-spin text-orange-500" : ""
                }`}
              />
            </button>
          )}

          <button
            onClick={() => onEdit(item)}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Edit Credential"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteConfirm(item)}
            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Credential"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MenuCredentialTable({
  credentials = [],
  onEdit,
  onDeleteConfirm,
  onTestConnection,
  testingId,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  return (
    <div className="space-y-4">
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
              <th className="py-3.5 px-6">Account</th>
              <th className="py-3.5 px-6">Session</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-sm">
            {credentials.map((item) => (
              <MenuCredentialTableRow
                key={item._id}
                item={item}
                onEdit={onEdit}
                onDeleteConfirm={onDeleteConfirm}
                onTestConnection={onTestConnection}
                isTesting={testingId === item._id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
