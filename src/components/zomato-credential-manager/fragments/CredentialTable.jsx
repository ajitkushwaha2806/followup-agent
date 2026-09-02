"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { credentialService } from "@/services/frontend/credentialService";
import { Clock, Edit3, Trash2, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "../helpers";

function CredentialTableRow({ item, searchQuery = "", statusFilter = "ALL", onEdit, onDeleteConfirm }) {
  const router = useRouter();

  const {
    data: restaurantResponse,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantError,
  } = useQuery({
    queryKey: ["credential-restaurants", item._id],
    queryFn: () => credentialService.getRestaurants(item._id, "active-requests"),
    enabled: Boolean(item._id && item.status === "ACTIVE"),
    staleTime: 60 * 1000,
    retry: false,
  });

  const rawRestaurants = restaurantResponse?.data?.restaurants || [];
  const primaryRestaurant = rawRestaurants[0];
  const isSessionActive = item.status === "ACTIVE";

  const steps = primaryRestaurant?.steps || [];
  const approvedSteps = steps.filter((s) => s.status === "APPROVED");
  const pendingSteps = steps.filter((s) => s.status !== "APPROVED");
  const currentPendingStep = pendingSteps[0];
  const listingStatus = (primaryRestaurant?.resListingStatus || "UNDER REVIEW").toUpperCase();

  // Status filtering
  if (statusFilter && statusFilter !== "ALL") {
    const matchesResStatus = listingStatus === statusFilter.toUpperCase();
    const matchesSessionStatus = item.status === statusFilter.toUpperCase();
    if (!matchesResStatus && !matchesSessionStatus) {
      return null;
    }
  }

  // Search query filtering
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    const matchesAccount = item.name?.toLowerCase().includes(q);
    const matchesRes =
      primaryRestaurant?.name?.toLowerCase().includes(q) ||
      String(primaryRestaurant?.resId || "").includes(q) ||
      primaryRestaurant?.resAddress?.toLowerCase().includes(q) ||
      primaryRestaurant?.kitchenType?.toLowerCase().includes(q);

    if (!matchesAccount && !matchesRes) {
      return null;
    }
  }

  return (
    <tr
      onClick={() => router.push(`/restaurant/${item._id}`)}
      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
    >
      {/* Account column */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {item.name ? item.name.charAt(0).toUpperCase() : "Z"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
              {item.name}
            </div>
            {primaryRestaurant && primaryRestaurant.name !== item.name && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {primaryRestaurant.name}
              </div>
            )}
            <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Session column */}
      <td className="py-4 px-6 whitespace-nowrap">
        {isSessionActive ? (
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
      </td>

      {/* Application Status & Onboarding Stage */}
      <td className="py-4 px-6">
        {!isSessionActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Session expired (Update cookie)</span>
          </span>
        ) : isLoadingRestaurants ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
            <span>Checking Zomato status...</span>
          </div>
        ) : isRestaurantError ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Failed to fetch status</span>
          </span>
        ) : primaryRestaurant ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight uppercase border ${
                  listingStatus === "READY TO GO LIVE" ||
                  listingStatus === "LIVE" ||
                  listingStatus === "APPROVED"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : listingStatus === "REJECTED"
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    listingStatus === "READY TO GO LIVE" ||
                    listingStatus === "LIVE" ||
                    listingStatus === "APPROVED"
                      ? "bg-emerald-500 animate-pulse"
                      : listingStatus === "REJECTED"
                      ? "bg-rose-500"
                      : "bg-blue-500 animate-pulse"
                  }`}
                />
                <span>{primaryRestaurant.resListingStatus || "Under Review"}</span>
              </span>

              {steps.length > 0 && (
                <span className="text-[11px] font-medium text-zinc-400">
                  ({approvedSteps.length}/{steps.length} approved)
                </span>
              )}
            </div>

            {currentPendingStep ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-lg px-2.5 py-1 max-w-fit">
                <span className="font-semibold text-[11px]">Pending Step:</span>
                <span className="font-medium text-[11px] truncate max-w-[200px]">
                  {currentPendingStep.title}
                </span>
                {currentPendingStep.message?.[0] && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate max-w-[140px]">
                    · {currentPendingStep.message[0]}
                  </span>
                )}
              </div>
            ) : steps.length > 0 ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ All onboarding steps approved
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-zinc-400 italic">No active requests</span>
        )}
      </td>

      {/* Actions column */}
      <td className="py-4 px-6 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Edit Credential"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConfirm(item);
            }}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Credential"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CredentialTable({
  credentials,
  searchQuery = "",
  statusFilter = "ALL",
  onEdit,
  onDeleteConfirm,
}) {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
              <th className="py-3.5 px-6">Account</th>
              <th className="py-3.5 px-6">Session</th>
              <th className="py-3.5 px-6">Application Status & Pending Step</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-sm">
            {credentials.map((item) => (
              <CredentialTableRow
                key={item._id}
                item={item}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                onEdit={onEdit}
                onDeleteConfirm={onDeleteConfirm}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
