"use client";

import { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { useNotification } from "@/context/NotificationContext";
import {
  Check,
  Calculator,
  Plus,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  CheckSquare,
  Upload,
} from "lucide-react";

const PriceEditorTable = forwardRef(function PriceEditorTable(
  {
    categories = [],
    onSaveMenu,
    onSyncMenu,
    isSaving = false,
    isSyncing = false,
    restaurantName = "",
    onHasChangesChange,
  },
  ref
) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const notification = useNotification();

  // Bulk update state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("increase"); // "increase" | "decrease"
  const [bulkMode, setBulkMode] = useState("percentage"); // "percentage" | "flat"
  const [bulkValue, setBulkValue] = useState("");
  const [roundMode, setRoundMode] = useState("nearest9");
  const [bulkTarget, setBulkTarget] = useState("all");

  useEffect(() => {
    setLocalCategories(categories);
    setHasChanges(false);
    onHasChangesChange?.(false);
  }, [categories]);

  useEffect(() => {
    onHasChangesChange?.(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  const handleSave = async () => {
    if (onSaveMenu) {
      await onSaveMenu(localCategories);
      setHasChanges(false);
      onHasChangesChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
    hasChanges,
  }));

  // Flatten all items with category hierarchy
  const allItems = useMemo(() => {
    const list = [];
    localCategories.forEach((cat, catIdx) => {
      (cat.sub_category || []).forEach((sub, subIdx) => {
        (sub.items || []).forEach((item, itemIdx) => {
          list.push({
            ...item,
            _catIdx: catIdx,
            _subIdx: subIdx,
            _itemIdx: itemIdx,
            _catName: cat.name || "Category",
            _subName: sub.name || "nota",
          });
        });
      });
    });
    return list;
  }, [localCategories]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.id?.toString().includes(q) ||
        item._catName?.toLowerCase().includes(q) ||
        item._subName?.toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  const handleItemUpdate = (catIdx, subIdx, itemIdx, updates) => {
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetItem = next[catIdx]?.sub_category[subIdx]?.items[itemIdx];
      if (!targetItem) return prev;
      Object.assign(targetItem, updates);
      return next;
    });
    setHasChanges(true);
  };

  const handleBasePriceChange = (catIdx, subIdx, itemIdx, value) => {
    const num = value === "" ? "" : Number(value);
    handleItemUpdate(catIdx, subIdx, itemIdx, { base_price: num });
  };

  const handleVariantPriceChange = (catIdx, subIdx, itemIdx, gIdx, oIdx, value) => {
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetItem = next[catIdx]?.sub_category[subIdx]?.items[itemIdx];
      if (!targetItem?.variants?.[gIdx]?.options?.[oIdx]) return prev;

      targetItem.variants[gIdx].options[oIdx].price = value === "" ? "" : Number(value);
      return next;
    });
    setHasChanges(true);
  };

  const handleVariantOptionNameChange = (catIdx, subIdx, itemIdx, gIdx, oIdx, newName) => {
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetItem = next[catIdx]?.sub_category[subIdx]?.items[itemIdx];
      if (!targetItem?.variants?.[gIdx]?.options?.[oIdx]) return prev;

      targetItem.variants[gIdx].options[oIdx].option_name = newName;
      return next;
    });
    setHasChanges(true);
  };

  const handleVariantGroupNameChange = (catIdx, subIdx, itemIdx, gIdx, newName) => {
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetItem = next[catIdx]?.sub_category[subIdx]?.items[itemIdx];
      if (!targetItem?.variants?.[gIdx]) return prev;

      targetItem.variants[gIdx].property_name = newName;
      return next;
    });
    setHasChanges(true);
  };



  const applyRounding = (price, mode) => {
    if (mode === "none") return Math.round(price);
    if (mode === "nearest9") {
      const rounded = Math.round(price);
      const remainder = rounded % 10;
      if (remainder === 9) return rounded;
      if (remainder === 0) return rounded - 1;
      return rounded + (9 - remainder);
    }
    if (mode === "next9") {
      const rounded = Math.ceil(price);
      const remainder = rounded % 10;
      if (remainder === 9) return rounded;
      return rounded + (9 - remainder);
    }
    return Math.round(price);
  };

  const handleApplyBulkUpdate = () => {
    const val = Number(bulkValue);
    if (!val || val <= 0) {
      return;
    }

    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let count = 0;

      next.forEach((cat, cIdx) => {
        if (bulkTarget !== "all" && cat.id !== bulkTarget && String(cIdx) !== bulkTarget) {
          return;
        }

        (cat.sub_category || []).forEach((sub) => {
          (sub.items || []).forEach((item) => {
            const currentBase = Number(item.base_price) || 0;
            const diff = bulkMode === "percentage" ? (currentBase * val) / 100 : val;
            let newBase = bulkAction === "increase" ? currentBase + diff : currentBase - diff;
            if (newBase < 0) newBase = 0;
            item.base_price = applyRounding(newBase, roundMode);
            count++;

            (item.variants || []).forEach((g) => {
              (g.options || []).forEach((opt) => {
                const curOptPrice = Number(opt.price) || 0;
                const optDiff = bulkMode === "percentage" ? (curOptPrice * val) / 100 : val;
                let newOptPrice =
                  bulkAction === "increase" ? curOptPrice + optDiff : curOptPrice - optDiff;
                if (newOptPrice < 0) newOptPrice = 0;
                opt.price = applyRounding(newOptPrice, roundMode);
              });
            });
          });
        });
      });

      return next;
    });

    setHasChanges(true);
    setIsBulkModalOpen(false);
    setBulkValue("");
    notification.success("Bulk price update applied to sheet!");
  };

  return (
    <div className="w-full space-y-4 font-sans text-gray-800">
      {/* Top Action Bar exactly matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Price Editor
          </h1>
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-gray-600" />
            <span>Bulk Update Prices</span>
          </button>
        </div>
      </div>

      {/* Table Container exactly matching the screenshot */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcfdfd] border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="p-3.5 w-1/3 min-w-[200px] font-medium text-gray-600">Item Name</th>
                <th className="p-3.5 w-32 min-w-[110px] font-medium text-gray-600">Base Price (₹)</th>
                <th className="p-3.5 min-w-[340px] font-medium text-gray-600">Variants Prices (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400">
                    No items found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const { _catIdx, _subIdx, _itemIdx } = item;
                  const variants = (item.variants || [])
                    .filter((g) => g.status !== "delete" && g.status !== "deleted")
                    .map((g) => ({
                      ...g,
                      options: (g.options || []).filter(
                        (o) => o.status !== "delete" && o.status !== "deleted"
                      ),
                    }));

                  return (
                    <tr
                      key={item.id || `${_catIdx}-${_subIdx}-${_itemIdx}`}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Item Name */}
                      <td className="p-3.5 align-top">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.name || "Unnamed Item"}
                        </div>
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                          {item._catName} &gt; {item._subName}
                        </div>
                      </td>

                      {/* Base Price (₹) */}
                      <td className="p-3.5 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.base_price ?? ""}
                            onChange={(e) =>
                              handleBasePriceChange(_catIdx, _subIdx, _itemIdx, e.target.value)
                            }
                            placeholder="0"
                            className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-gray-500 transition-colors"
                          />
                          {item.is_under_review && item.under_review_price !== undefined && item.under_review_price !== null && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/60 border border-amber-200/70 rounded-md text-xs whitespace-nowrap">
                              <span className="text-gray-900 font-semibold">₹{item.under_review_price}</span>
                              <span className="bg-[#c84e16] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded leading-normal">
                                Under review
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Variants Prices (₹) */}
                      <td className="p-3.5 align-top space-y-2">
                        {variants.length === 0 ? (
                          <div className="pt-1">
                            <span className="text-gray-400 text-xs italic">No variants</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {variants.map((group, gIdx) => (
                              <div key={group.property_id || gIdx} className="space-y-1.5">
                                {/* Variant header line */}
                                <div className="flex items-center text-xs">
                                  <input
                                    type="text"
                                    value={group.property_name || "Property"}
                                    onChange={(e) =>
                                      handleVariantGroupNameChange(
                                        _catIdx,
                                        _subIdx,
                                        _itemIdx,
                                        gIdx,
                                        e.target.value
                                      )
                                    }
                                    className="font-semibold text-gray-700 bg-transparent outline-none w-24 focus:border-b border-gray-400"
                                  />
                                </div>

                                {/* Option pills */}
                                <div className="flex flex-wrap gap-2.5">
                                  {(group.options || []).map((opt, oIdx) => (
                                    <div
                                      key={opt.variant_id || opt.propertyValueId || opt.option_id || oIdx}
                                      className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden text-xs shadow-2xs"
                                    >
                                      <input
                                        type="text"
                                        value={opt.option_name || ""}
                                        onChange={(e) =>
                                          handleVariantOptionNameChange(
                                            _catIdx,
                                            _subIdx,
                                            _itemIdx,
                                            gIdx,
                                            oIdx,
                                            e.target.value
                                          )
                                        }
                                        className="w-20 px-2 py-1.5 text-gray-700 bg-gray-50/50 border-r border-gray-200 outline-none"
                                      />
                                      <input
                                        type="number"
                                        value={opt.price ?? ""}
                                        onChange={(e) =>
                                          handleVariantPriceChange(
                                            _catIdx,
                                            _subIdx,
                                            _itemIdx,
                                            gIdx,
                                            oIdx,
                                            e.target.value
                                          )
                                        }
                                        placeholder="0"
                                        className="w-16 px-2 py-1.5 text-gray-900 font-medium outline-none text-center"
                                      />

                                      {opt.is_under_review && opt.under_review_price !== undefined && opt.under_review_price !== null && (
                                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border-l border-gray-200 text-xs whitespace-nowrap">
                                          <span className="text-gray-900 font-semibold">₹{opt.under_review_price}</span>
                                          <span className="bg-[#c84e16] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded leading-normal">
                                            Under review
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Update Right Sidebar Sheet */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsBulkModalOpen(false)}
          />

          {/* Slide-over Right Sheet */}
          <div className="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-800 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Bulk Update Prices
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Update multiple item prices & variants in bulk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Apply To */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Apply To</label>
                <select
                  value={bulkTarget}
                  onChange={(e) => setBulkTarget(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="all">All Items ({allItems.length} items)</option>
                  {localCategories.map((cat, idx) => (
                    <option key={cat.id || idx} value={cat.id || String(idx)}>
                      {cat.name} ({(cat.sub_category || []).reduce((acc, s) => acc + (s.items || []).length, 0)} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Action & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Action</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setBulkAction("increase")}
                      className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        bulkAction === "increase"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      + Increase
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAction("decrease")}
                      className={`flex-1 py-2 text-xs font-medium border-l border-gray-300 transition-colors cursor-pointer ${
                        bulkAction === "decrease"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      - Decrease
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Type</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setBulkMode("percentage")}
                      className={`flex-1 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        bulkMode === "percentage"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode("flat")}
                      className={`flex-1 py-2 text-xs font-medium border-l border-gray-300 transition-colors cursor-pointer ${
                        bulkMode === "flat"
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Flat (₹)
                    </button>
                  </div>
                </div>
              </div>

              {/* Value Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  Value ({bulkMode === "percentage" ? "%" : "₹"})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder={bulkMode === "percentage" ? "e.g. 10" : "e.g. 50"}
                    className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-gray-500 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    {bulkMode === "percentage" ? "%" : "₹"}
                  </span>
                </div>
              </div>

              {/* Rounding Option */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Rounding Option</label>
                <select
                  value={roundMode}
                  onChange={(e) => setRoundMode(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-gray-500 transition-colors"
                >
                  <option value="nearest9">Round to 9 (e.g. ₹300 → ₹299)</option>
                  <option value="next9">Round to Next 9 (e.g. ₹301 → ₹309)</option>
                  <option value="none">No Rounding (Exact mathematical value)</option>
                </select>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                <span className="font-semibold text-gray-700 block">Preview Summary</span>
                <p className="text-gray-500 leading-relaxed">
                  Will {bulkAction} base prices and variants by{" "}
                  <strong className="text-gray-800">
                    {bulkValue || "0"}
                    {bulkMode === "percentage" ? "%" : "₹"}
                  </strong>{" "}
                  with{" "}
                  <strong className="text-gray-800">
                    {roundMode === "nearest9"
                      ? "Round to 9"
                      : roundMode === "next9"
                      ? "Round to next 9"
                      : "No Rounding"}
                  </strong>{" "}
                  on{" "}
                  {bulkTarget === "all"
                    ? `all ${allItems.length} items`
                    : `${localCategories.find((c) => c.id === bulkTarget || String(c._id) === bulkTarget)?.name || "selected category"}`}
                  .
                </p>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkUpdate}
                disabled={!bulkValue || Number(bulkValue) <= 0}
                className="flex-1 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                Apply Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PriceEditorTable;
