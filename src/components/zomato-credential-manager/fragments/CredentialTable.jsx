"use client";

import { useQuery } from "@tanstack/react-query";
import { credentialService } from "@/services/frontend/credentialService";
import { Clock, Edit3, Trash2, Loader2, AlertCircle, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { formatDate, checkIfNeedsAttention, getRestaurantLastUpdated } from "../helpers";
import Pagination from "./Pagination";

function CredentialTableRow({
  item,
  onEdit,
  onDeleteConfirm,
  onTestConnection,
  onGenerateEmail,
  isTesting = false,
}) {
  const {
    data: restaurantResponse,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
  } = useQuery({
    queryKey: ["credential-restaurants", item._id],
    queryFn: () => credentialService.getRestaurants(item._id, "active-requests"),
    enabled: Boolean(item._id && item.status === "ACTIVE"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  const rawRestaurants = restaurantResponse?.data?.restaurants || [];
  const hasMultipleRestaurants = rawRestaurants.length > 1;
  const isSessionActive = item.status === "ACTIVE";

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "READY TO GO LIVE" || s === "LIVE" || s === "APPROVED") {
      return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (s === "REJECTED") {
      return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  };

  const getStatusDotClass = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "READY TO GO LIVE" || s === "LIVE" || s === "APPROVED") {
      return "bg-emerald-500 animate-pulse";
    }
    if (s === "REJECTED") {
      return "bg-rose-500";
    }
    return "bg-blue-500 animate-pulse";
  };

  return (
    <tr className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group">
      {/* Account column */}
      <td className="py-3.5 px-4 align-top">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 mt-0.5">
            {item.name ? item.name.charAt(0).toUpperCase() : "Z"}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 break-words" title={item.name}>
                {item.name}
              </span>
              {hasMultipleRestaurants && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 shrink-0">
                  {rawRestaurants.length}
                </span>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{formatDate(item.createdAt)}</span>
              </div>
              {item.email && (
                <span className="text-zinc-500 truncate max-w-[150px] sm:max-w-[200px]" title={item.email}>
                  · {item.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Session column */}
      <td className="py-3.5 px-3 whitespace-nowrap align-top">
        {isSessionActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            EXPIRED
          </span>
        )}
      </td>

      {/* Application Status & Onboarding Stage */}
      <td className="py-3.5 px-3 align-top">
        {!isSessionActive ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Session expired</span>
          </span>
        ) : isLoadingRestaurants ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 animate-pulse py-1">
            <Loader2 className="w-3 h-3 animate-spin text-red-500" />
            <span>Checking...</span>
          </div>
        ) : isRestaurantError ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Failed</span>
          </span>
        ) : rawRestaurants.length > 0 ? (
          <div className="space-y-2">
            {rawRestaurants.map((res, idx) => {
              const steps = res.steps || [];
              const approvedSteps = steps.filter((s) => s.status === "APPROVED");
              const pendingSteps = steps.filter((s) => s.status !== "APPROVED");
              const currentPendingStep = pendingSteps[0];
              const listingStatus = (res.resListingStatus || "UNDER REVIEW").toUpperCase();
              const needsAttention = checkIfNeedsAttention(res);
              const lastUpdated = getRestaurantLastUpdated(res);

              return (
                <div
                  key={res.resId || idx}
                  className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
                    needsAttention
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40"
                      : "bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate" title={res.name}>
                        {res.name}
                      </span>
                      {res.resId && (
                        <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                          #{res.resId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {needsAttention && (
                        <button
                          type="button"
                          onClick={() => onGenerateEmail && onGenerateEmail(res, item)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap animate-pulse"
                          title="No status change in the last 36hrs. Click to draft follow-up email."
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Needs Attention</span>
                        </button>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase border whitespace-nowrap shrink-0 ${getStatusBadgeClass(
                          listingStatus
                        )}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full shrink-0 ${getStatusDotClass(
                            listingStatus
                          )}`}
                        />
                        <span>{res.resListingStatus || "Under Review"}</span>
                      </span>
                    </div>
                  </div>

                  {currentPendingStep ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-lg px-2.5 py-1">
                      <div className="flex items-start sm:items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-semibold text-[10px] uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/70 px-1 py-0.2 rounded text-amber-900 dark:text-amber-200 shrink-0 mt-0.5 sm:mt-0">
                          Pending
                        </span>
                        <span
                          className="text-xs break-words line-clamp-2 leading-relaxed"
                          title={`${currentPendingStep.title}${
                            currentPendingStep.message?.[0] ? ` · ${currentPendingStep.message[0]}` : ""
                          }`}
                        >
                          <span className="font-medium">{currentPendingStep.title}</span>
                          {currentPendingStep.message?.[0] && (
                            <span className="text-amber-900/85 dark:text-amber-200/85 font-normal">
                              {" · "}{currentPendingStep.message[0]}
                            </span>
                          )}
                        </span>
                      </div>
                      {lastUpdated && (
                        <div className="text-[9px] text-amber-700/80 dark:text-amber-400/80 shrink-0 flex items-center gap-0.5 font-medium self-end sm:self-center pl-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{lastUpdated}</span>
                        </div>
                      )}
                    </div>
                  ) : steps.length > 0 ? (
                    <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                      <span>✓ Approved ({approvedSteps.length}/{steps.length})</span>
                      {lastUpdated && (
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 font-normal">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{lastUpdated}</span>
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic">No requests</span>
        )}
      </td>

      {/* AI Follow-up Email Column */}
      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
        {!isSessionActive ? (
          <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>
        ) : isLoadingRestaurants ? (
          <span className="text-xs text-zinc-400">...</span>
        ) : rawRestaurants.length > 0 ? (
          <div className="space-y-2 flex flex-col items-center">
            {rawRestaurants.map((res, idx) => {
              const needsAttention = checkIfNeedsAttention(res);

              return (
                <div
                  key={res.resId || idx}
                  className="min-h-[56px] flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => onGenerateEmail && onGenerateEmail(res, item)}
                    className={`inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-sm hover:scale-105 ${
                      needsAttention
                        ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/60 ring-offset-1 dark:ring-offset-zinc-900 animate-pulse"
                        : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                    }`}
                    title={
                      needsAttention
                        ? `🚨 Needs Attention (>36h stale). Click to draft AI email for ${res.name}`
                        : `Draft AI Follow-up Email for ${res.name}`
                    }
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>
        )}
      </td>

      {/* Actions column */}
      <td className="py-3.5 px-3 whitespace-nowrap text-right align-top">
        <div className="flex items-center justify-end gap-1 pt-1">
          {onTestConnection && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTestConnection(item._id);
              }}
              disabled={isTesting}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Test Connection"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-red-500" : ""}`}
              />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConfirm(item);
            }}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CredentialTable({
  credentials = [],
  onEdit,
  onDeleteConfirm,
  onTestConnection,
  onGenerateEmail,
  testingId,
  pagination,
  onPageChange,
  onLimitChange,
}) {
  return (
    <div className="space-y-4">
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                <th className="py-3 px-4 w-[24%] min-w-[190px]">Account</th>
                <th className="py-3 px-3 w-[12%] min-w-[90px]">Session</th>
                <th className="py-3 px-3 w-[48%] min-w-[360px]">Outlets & Pending Steps</th>
                <th className="py-3 px-3 w-[8%] min-w-[65px] text-center">
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Sparkles className="w-3 h-3 text-red-500" />
                    <span>AI</span>
                  </span>
                </th>
                <th className="py-3 px-3 w-[8%] min-w-[85px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-sm">
              {credentials.map((item) => (
                <CredentialTableRow
                  key={item._id}
                  item={item}
                  onEdit={onEdit}
                  onDeleteConfirm={onDeleteConfirm}
                  onTestConnection={onTestConnection}
                  onGenerateEmail={onGenerateEmail}
                  isTesting={testingId === item._id}
                />
              ))}
            </tbody>
          </table>
        </div>
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

