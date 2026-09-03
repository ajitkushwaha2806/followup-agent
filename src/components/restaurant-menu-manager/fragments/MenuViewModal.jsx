"use client";

import { useState } from "react";
import { X, Utensils, Tag, ChevronRight, Layers, DollarSign } from "lucide-react";

export default function MenuViewModal({ isOpen, onClose, restaurant, menuData }) {
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  if (!isOpen) return null;

  const categories = menuData?.menu || menuData?.data?.menu || [];
  const selectedCategory = categories[selectedCategoryIdx] || categories[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {restaurant?.name || "Restaurant Menu"}
                </h2>
                {restaurant?.resId && (
                  <span className="text-xs text-zinc-400 font-mono">
                    #{restaurant.resId}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {categories.length} Categories · Imported from Zomato
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

        {/* Content Body */}
        {categories.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-sm font-medium">No menu data available yet.</p>
            <p className="text-xs">Click "Sync Menu" to fetch the latest menu from Zomato.</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Categories */}
            <div className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-1">
                Categories ({categories.length})
              </div>
              {categories.map((cat, idx) => {
                const isSelected = selectedCategoryIdx === idx;
                const totalItems = (cat.sub_category || []).reduce(
                  (acc, sub) => acc + (sub.items || []).length,
                  0
                );

                return (
                  <button
                    key={cat.id || idx}
                    onClick={() => setSelectedCategoryIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="truncate">{cat.name || "Untitled Category"}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1.5 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {totalItems}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main Item List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedCategory?.sub_category?.map((sub, sIdx) => (
                <div key={sub.id || sIdx} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      {sub.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({sub.items?.length || 0} items)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sub.items?.map((item, iIdx) => (
                      <div
                        key={item.id || iIdx}
                        className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              #{item.id}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{item.base_price || 0}
                            </span>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-tight">
                              Base Price
                            </div>
                          </div>
                        </div>

                        {/* Variants if any */}
                        {item.variants && item.variants.length > 0 && (
                          <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 space-y-1.5">
                            {item.variants.map((v, vIdx) => (
                              <div key={v.property_id || vIdx} className="space-y-1">
                                <div className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>{v.property_name || "Variant"}:</span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {v.options?.map((opt, oIdx) => (
                                    <span
                                      key={opt.variant_id || opt.option_id || oIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300"
                                    >
                                      <span>{opt.option_name}</span>
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        ₹{opt.price}
                                      </span>
                                      {opt.is_default && (
                                        <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1 rounded">
                                          default
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
          <span>Imported via Zomato Menu Catalog API</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
