"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/context/NotificationContext";
import { getUserAccess } from "@/lib/auth/access";
import { credentialService } from "@/services/frontend/credentialService";
import { menuService } from "@/services/frontend/menuService";
import {
  ArrowLeft,
  Store,
  ChevronsUpDown,
  Check,
  Search,
  Copy,
  Utensils,
  Download,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  Layers,
  Tag,
  ChevronRight,
  ExternalLink,
  Zap,
  Save,
} from "lucide-react";
import { formatDate } from "@/components/zomato-credential-manager/helpers";
import MenuViewModal from "@/components/restaurant-menu-manager/fragments/MenuViewModal";

import PriceEditorTable from "@/components/restaurant-menu-manager/fragments/PriceEditorTable";

function RestaurantImage({ restaurant, isSelected }) {
  return (
    <div
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold overflow-hidden border shadow-2xs ${
        isSelected
          ? "border-orange-500 bg-orange-600 text-white"
          : "border-zinc-200 dark:border-zinc-800 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
      }`}
    >
      {restaurant?.thumbnail ? (
        <img
          src={restaurant.thumbnail}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Store className="w-5 h-5" />
      )}
    </div>
  );
}

// Top Restaurant Switcher dropdown (inspired by zomato-menu-manager)
function RestaurantSwitcher({
  restaurants = [],
  selectedRes,
  onSelect,
  isLoading = false,
  onRefetch,
  isFetching = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    const q = searchQuery.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.resId?.toString().includes(q) ||
        r.resAddress?.toLowerCase().includes(q)
    );
  }, [restaurants, searchQuery]);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Switcher Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60 transition-all text-left shadow-2xs group cursor-pointer"
      >
        <RestaurantImage restaurant={selectedRes} isSelected={false} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
              {selectedRes?.name || (isLoading ? "Loading outlets..." : "Select Restaurant")}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-red-500/10 text-red-600 shrink-0">
              Zomato
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="truncate text-[11px] text-zinc-400">
              {selectedRes?.resAddress || "No location specified"}
            </span>
            {selectedRes?.resId && (
              <span
                onClick={(e) => handleCopyId(e, selectedRes.resId)}
                className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                title="Click to copy Restaurant ID"
              >
                {copiedId === selectedRes.resId ? "Copied!" : `#${selectedRes.resId}`}
                <Copy className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </div>

        <ChevronsUpDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-orange-500" : "group-hover:text-zinc-600"
          }`}
        />
      </button>

      {/* Switcher Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-full min-w-[320px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Your Restaurants
              </p>
              <p className="text-xs text-zinc-500 font-medium">
                {restaurants.length} Connected Outlet{restaurants.length !== 1 ? "s" : ""}
              </p>
            </div>

            {onRefetch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefetch();
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Refresh Outlets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-orange-500" : ""}`} />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant or location..."
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Outlets List */}
          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const isSelected = r.resId === selectedRes?.resId;
                return (
                  <div
                    key={r.resId}
                    onClick={() => {
                      onSelect(r);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors group ${
                      isSelected
                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-semibold"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      {r.thumbnail ? (
                        <img src={r.thumbnail} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-4 h-4 text-orange-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-snug">
                        {r.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="truncate text-[10px] text-zinc-400">
                          {r.resAddress || "No location"}
                        </span>
                        {r.resId && (
                          <span
                            onClick={(e) => handleCopyId(e, r.resId)}
                            className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Copy ID"
                          >
                            #{r.resId}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-xs text-zinc-400">
                No restaurants found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <span>Select to switch active outlet</span>
            <span>{filtered.length} Total</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CredentialRestaurantsPage({ params }) {
  const resolvedParams = use(params);
  const credentialId = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  const { hasOnboarding, hasRestaurant } = getUserAccess(user);

  useEffect(() => {
    if (user && hasOnboarding && !hasRestaurant) {
      router.replace("/onboarding");
    }
  }, [user, hasOnboarding, hasRestaurant, router]);

  const queryClient = useQueryClient();
  const notification = useNotification();

  const [selectedResId, setSelectedResId] = useState(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [menuItemSearch, setMenuItemSearch] = useState("");
  const [importingResId, setImportingResId] = useState(null);
  const [importSuccessResId, setImportSuccessResId] = useState(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const editorRef = useRef(null);

  const {
    data: credentialResponse,
    isLoading: isLoadingCred,
  } = useQuery({
    queryKey: ["credential", credentialId],
    queryFn: () => credentialService.getById(credentialId),
  });

  const credential = credentialResponse?.data;
  const isSessionActive = credential?.status === "ACTIVE";

  const {
    data: restaurantsResponse,
    isLoading: isLoadingRestaurants,
    isError: isRestaurantsError,
    error: restaurantsError,
    refetch: refetchRestaurants,
    isFetching: isFetchingRestaurants,
  } = useQuery({
    queryKey: ["credential-outlets", credentialId],
    queryFn: () => credentialService.getRestaurants(credentialId, "live"),
    enabled: Boolean(credentialId && isSessionActive),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const rawRestaurants = useMemo(() => {
    return restaurantsResponse?.data?.restaurants || [];
  }, [restaurantsResponse]);

  const handleSelectRestaurant = (res) => {
    if (!res?.resId) return;
    setSelectedResId(res.resId);
    try {
      localStorage.setItem("zomato_active_res_id", String(res.resId));
      localStorage.setItem("zomato_active_restaurant", JSON.stringify(res));
    } catch (e) {
      console.warn("Could not save active restaurant to localStorage:", e);
    }
  };

  useEffect(() => {
    if (rawRestaurants.length > 0) {
      let candidateId = selectedResId;
      if (!candidateId) {
        try {
          const storedId = localStorage.getItem("zomato_active_res_id");
          if (storedId && rawRestaurants.some((r) => String(r.resId) === String(storedId))) {
            candidateId = storedId;
          }
        } catch (e) {}
      }

      if (!candidateId || !rawRestaurants.some((r) => String(r.resId) === String(candidateId))) {
        candidateId = rawRestaurants[0].resId;
      }

      if (candidateId !== selectedResId) {
        setSelectedResId(candidateId);
        const matchRes = rawRestaurants.find((r) => String(r.resId) === String(candidateId));
        if (matchRes) {
          try {
            localStorage.setItem("zomato_active_res_id", String(candidateId));
            localStorage.setItem("zomato_active_restaurant", JSON.stringify(matchRes));
          } catch (e) {}
        }
      }
    }
  }, [rawRestaurants, selectedResId]);

  const activeRestaurant = useMemo(() => {
    return rawRestaurants.find((r) => r.resId === selectedResId) || rawRestaurants[0] || null;
  }, [rawRestaurants, selectedResId]);

  const {
    data: menuResponse,
    isLoading: isLoadingMenu,
    refetch: refetchMenu,
  } = useQuery({
    queryKey: ["restaurant-menu", selectedResId],
    queryFn: () => menuService.getMenu(selectedResId),
    enabled: Boolean(selectedResId),
    retry: false,
  });

  const savedMenu = menuResponse?.data;
  const menuCategories = savedMenu?.menu || [];

  useEffect(() => {
    setSelectedCategoryIdx(0);
    setMenuItemSearch("");
  }, [selectedResId]);

  // Import Menu Handler
  const handleImportMenu = async (res) => {
    const targetRes = res || activeRestaurant;
    if (!targetRes?.resId) return;

    try {
      setImportingResId(targetRes.resId);
      const resData = await menuService.importZomatoMenu(targetRes.resId, credentialId);
      setImportSuccessResId(targetRes.resId);
      setTimeout(() => setImportSuccessResId(null), 3000);

      // Directly update React Query cache for instant UI refresh
      if (resData?.data) {
        queryClient.setQueryData(["restaurant-menu", selectedResId], resData);
        queryClient.setQueryData(["restaurant-menu", targetRes.resId], resData);
        queryClient.setQueryData(["restaurant-menu", String(targetRes.resId)], resData);
      }

      await queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
      await refetchMenu();
      notification.success(resData?.message || "Menu synced from Zomato successfully!");
    } catch (err) {
      notification.error(err?.response?.data?.message || err.message || "Failed to sync menu");
    } finally {
      setImportingResId(null);
    }
  };

  const selectedCategory = menuCategories[selectedCategoryIdx] || menuCategories[0];

  const displaySubcategories = useMemo(() => {
    if (!selectedCategory?.sub_category) return [];
    if (!menuItemSearch.trim()) return selectedCategory.sub_category;

    const q = menuItemSearch.toLowerCase();
    return selectedCategory.sub_category
      .map((sub) => ({
        ...sub,
        items: (sub.items || []).filter(
          (item) =>
            item.name?.toLowerCase().includes(q) ||
            item.id?.toString().includes(q)
        ),
      }))
      .filter((sub) => (sub.items || []).length > 0);
  }, [selectedCategory, menuItemSearch]);

  const totalMenuItemsCount = useMemo(() => {
    return menuCategories.reduce((acc, cat) => {
      return (
        acc +
        (cat.sub_category || []).reduce(
          (subAcc, sub) => subAcc + (sub.items || []).length,
          0
        )
      );
    }, 0);
  }, [menuCategories]);

  const [triggeringResId, setTriggeringResId] = useState(null);
  const [triggerSuccessResId, setTriggerSuccessResId] = useState(null);

  const handleTriggerMenu = async (res) => {
    const targetRes = res || activeRestaurant;
    if (!targetRes?.resId) return;

    try {
      setTriggeringResId(targetRes.resId);
      const result = await menuService.updateMenu(targetRes.resId, { credentialId });
      setTriggerSuccessResId(targetRes.resId);
      setTimeout(() => setTriggerSuccessResId(null), 3000);
      notification.success(result?.message || "Menu triggered and pushed to Zomato successfully!");
    } catch (err) {
      notification.error(err?.response?.data?.message || err.message || "Failed to trigger menu update");
    } finally {
      setTriggeringResId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#fcfdfd] text-gray-800">
      {/* Top Controls Bar with Restaurant Selector and Action Buttons */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Accounts</span>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {/* Restaurant Switcher Trigger */}
          <div className="w-72">
            <RestaurantSwitcher
              restaurants={rawRestaurants}
              selectedRes={activeRestaurant}
              onSelect={handleSelectRestaurant}
              isLoading={isLoadingRestaurants}
              onRefetch={refetchRestaurants}
              isFetching={isFetchingRestaurants}
            />
          </div>
        </div>

        {/* Right side: Connected Count + Colorful Sync & Trigger Buttons */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium hidden md:inline">
            {rawRestaurants.length} Connected Outlets
          </span>

          {activeRestaurant && (
            <div className="flex items-center gap-3">
              {/* Solid Sync Menu Button */}
              <button
                type="button"
                onClick={() => handleImportMenu(activeRestaurant)}
                disabled={importingResId === activeRestaurant.resId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fa4a0c] hover:bg-[#e03e05] text-white text-sm font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {importingResId === activeRestaurant.resId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : importSuccessResId === activeRestaurant.resId ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>
                  {importingResId === activeRestaurant.resId
                    ? "Syncing..."
                    : importSuccessResId === activeRestaurant.resId
                    ? "Synced!"
                    : "Sync Menu"}
                </span>
              </button>

              {/* Save Changes Button (when unsaved changes exist) OR Trigger Menu Button */}
              {hasUnsavedChanges ? (
                <button
                  type="button"
                  onClick={() => editorRef.current?.handleSave()}
                  disabled={isSavingMenu}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingMenu ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingMenu ? "Saving..." : "Save Changes"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTriggerMenu(activeRestaurant)}
                  disabled={triggeringResId === activeRestaurant.resId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009b55] hover:bg-[#008649] text-white text-sm font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {triggeringResId === activeRestaurant.resId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : triggerSuccessResId === activeRestaurant.resId ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>
                    {triggeringResId === activeRestaurant.resId
                      ? "Triggering..."
                      : triggerSuccessResId === activeRestaurant.resId
                      ? "Triggered!"
                      : "Trigger Menu"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {!activeRestaurant ? (
          <div className="flex items-center justify-center p-16 text-center text-gray-400">
            <div className="space-y-2 max-w-sm">
              <Store className="w-10 h-10 mx-auto text-gray-300" />
              <h3 className="font-semibold text-sm text-gray-800">
                Select a Restaurant
              </h3>
              <p className="text-xs text-gray-400">
                Choose a restaurant from the switcher above to view, sync, and edit its prices.
              </p>
            </div>
          </div>
        ) : isLoadingMenu ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">
              Loading menu & items...
            </p>
          </div>
        ) : menuCategories.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-xl border border-gray-200 space-y-4 max-w-lg mx-auto mt-8">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-gray-900">
                No Menu Synced Yet
              </h3>
              <p className="text-xs text-gray-500">
                Click &ldquo;Sync Menu&rdquo; to fetch the latest categories, items, and pricing from Zomato.
              </p>
            </div>
            <button
              onClick={() => handleImportMenu(activeRestaurant)}
              disabled={importingResId === activeRestaurant.resId}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
            >
              {importingResId === activeRestaurant.resId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Sync Zomato Menu</span>
            </button>
          </div>
        ) : (
          <PriceEditorTable
            key={`${selectedResId}-${savedMenu?.updatedAt || ""}`}
            ref={editorRef}
            categories={menuCategories}
            restaurantName={activeRestaurant?.name}
            isSaving={isSavingMenu}
            onHasChangesChange={setHasUnsavedChanges}
            onSaveMenu={async (updatedMenu) => {
              setIsSavingMenu(true);
              try {
                await menuService.saveMenu(selectedResId, {
                  menu: updatedMenu,
                  rawCatalogue: savedMenu?.rawCatalogue,
                });
                queryClient.invalidateQueries({
                  queryKey: ["restaurant-menu", selectedResId],
                });
                setHasUnsavedChanges(false);
                notification.success("Prices and variants saved successfully!");
              } catch (e) {
                notification.error(e?.response?.data?.message || e.message || "Failed to save menu");
              } finally {
                setIsSavingMenu(false);
              }
            }}
            onSyncMenu={() => handleImportMenu(activeRestaurant)}
            isSyncing={importingResId === activeRestaurant?.resId}
          />
        )}
      </main>

      {/* Raw Menu View Modal */}
      {isRawModalOpen && (
        <MenuViewModal
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
          restaurant={activeRestaurant}
          menuData={savedMenu}
        />
      )}
    </div>
  );
}
