"use client";
import Link from "next/link";
import { useState } from "react";
import { filterRestaurants } from "./helpers";
import { useQuery } from "@tanstack/react-query";
import { credentialService } from "@/services/frontend/credentialService";
import { DashboardHeader, FilterToolbar, RestaurantCard } from "./fragments";
import { Store, AlertCircle, ArrowLeft, RefreshCw, KeyRound, Activity, CheckCircle2 } from "lucide-react";

export default function RestaurantDashboard({ credentialId }) {
  const [requestType, setRequestType] = useState("active-requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: queryResponse,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["restaurants", credentialId, requestType],
    queryFn: () => credentialService.getRestaurants(credentialId, requestType),
    enabled: Boolean(credentialId),
    retry: 1,
  });

  const credential = queryResponse?.credential || null;
  const rawData = queryResponse?.data || null;
  const rawRestaurants = rawData?.restaurants || [];

  const filteredList = filterRestaurants(rawRestaurants, searchQuery, statusFilter);

  const errorMessage =
    queryError?.response?.data?.message ||
    queryError?.message ||
    (queryResponse && !queryResponse.success ? queryResponse.message : null);

  const isUnauthorized =
    queryError?.response?.status === 401 ||
    (errorMessage && errorMessage.toLowerCase().includes("401"));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DashboardHeader
        credential={credential}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {isError && (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                {isUnauthorized
                  ? "Zomato Session Expired (401 Unauthorized)"
                  : "Failed to load Zomato Outlets"}
              </h3>
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 leading-relaxed max-w-2xl">
                {isUnauthorized
                  ? "The merchant session cookie stored for this credential has expired. Please update the cookie in your Credentials Manager to regain live access."
                  : errorMessage || "Unable to reach Zomato Merchant API."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Merchant Cookie</span>
            </Link>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRequestType("active-requests");
              setStatusFilter("ALL");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${requestType === "active-requests"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Active Requests ({rawData?.activeRequestsCount ?? 0})</span>
          </button>

          <button
            onClick={() => {
              setRequestType("live");
              setStatusFilter("ALL");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${requestType === "live"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Outlets ({rawData?.liveRestaurantsCount ?? 0})</span>
          </button>
        </div>

        {isFetching && (
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
            <span>Fetching {requestType}...</span>
          </span>
        )}
      </div>

      {!isLoading && !isError && rawRestaurants.length > 0 && (
        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">
            Fetching {requestType === "live" ? "live outlets" : "onboarding requests"} from Zomato...
          </p>
        </div>
      ) : !isError && filteredList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              {searchQuery || statusFilter !== "ALL"
                ? "No matching outlets found"
                : `No ${requestType === "live" ? "live outlets" : "active onboarding requests"} found`}
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search query or filter."
                : `This merchant account does not currently have any ${requestType === "live" ? "live" : "in-progress onboarding"} outlets on Zomato.`}
            </p>
          </div>
          {searchQuery || statusFilter !== "ALL" ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Credentials</span>
            </Link>
          )}
        </div>
      ) : (
        /* List of Outlets */
        <div className="space-y-6">
          {filteredList.map((restaurant) => (
            <RestaurantCard
              key={restaurant.resId || restaurant.name}
              restaurant={restaurant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
