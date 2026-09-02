import { useState } from "react";
import { MapPin, UtensilsCrossed, Copy, Check } from "lucide-react";
import StepPipeline from "./StepPipeline";

export default function RestaurantCard({ restaurant }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyResId = () => {
    if (restaurant.resId) {
      navigator.clipboard.writeText(String(restaurant.resId));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const status = (restaurant.resListingStatus || "UNDER REVIEW").toUpperCase();
  const isUnderReview = status === "UNDER REVIEW";
  const isReady = status === "READY TO GO LIVE" || status === "LIVE" || status === "APPROVED";
  const isRejected = status === "REJECTED";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6 sm:p-7 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-600/20 font-bold text-lg">
              {restaurant.name ? restaurant.name.charAt(0).toUpperCase() : "R"}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {restaurant.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                  <UtensilsCrossed className="w-3 h-3 text-red-500" />
                  <span>{restaurant.kitchenType || "Kitchen"}</span>
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 max-w-2xl leading-relaxed">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400 mt-0.5" />
                <span>{restaurant.resAddress || "Address not specified"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-2.5">
            {isReady ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{restaurant.resListingStatus}</span>
              </span>
            ) : isUnderReview ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>{restaurant.resListingStatus}</span>
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>{restaurant.resListingStatus}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>{restaurant.resListingStatus}</span>
              </span>
            )}

            {restaurant.resId && (
              <button
                onClick={copyResId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Click to copy Restaurant ID"
              >
                <span className="text-[10px] text-zinc-400">ID:</span>
                <span className="font-semibold">{restaurant.resId}</span>
                {isCopied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 bg-zinc-50/80 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800/60">
        <StepPipeline steps={restaurant.steps} />
      </div>
    </div>
  );
}
