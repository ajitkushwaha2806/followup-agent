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
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Square,
  MinusSquare,
  Utensils,
  AlertTriangle,
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
  const [roundMode, setRoundMode] = useState("next9"); // Default to Round to Next 9
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState(new Set());

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

  // When modal opens or items change, select entire menu and expand categories by default
  useEffect(() => {
    if (allItems.length > 0) {
      setSelectedItemIds(new Set(allItems.map((i) => i.id)));
      setExpandedCategories(new Set(localCategories.map((_, idx) => String(idx))));
    }
  }, [allItems, localCategories]);

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

  // Tree selection helpers
  const isAllItemsSelected = allItems.length > 0 && selectedItemIds.size === allItems.length;

  const toggleSelectAll = () => {
    if (isAllItemsSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(allItems.map((i) => i.id)));
    }
  };

  const toggleCategory = (cat) => {
    const catItemIds = [];
    (cat.sub_category || []).forEach((sub) => {
      (sub.items || []).forEach((item) => catItemIds.push(item.id));
    });
    if (catItemIds.length === 0) return;

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      const isEverySelected = catItemIds.every((id) => next.has(id));
      if (isEverySelected) {
        catItemIds.forEach((id) => next.delete(id));
      } else {
        catItemIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSubCategory = (sub) => {
    const subItemIds = (sub.items || []).map((i) => i.id);
    if (subItemIds.length === 0) return;

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      const isEverySelected = subItemIds.every((id) => next.has(id));
      if (isEverySelected) {
        subItemIds.forEach((id) => next.delete(id));
      } else {
        subItemIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleItem = (itemId) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleCatExpand = (catKey) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  };

  const toggleSubCatExpand = (subKey) => {
    setExpandedSubCategories((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) next.delete(subKey);
      else next.add(subKey);
      return next;
    });
  };

  const applyRounding = (price, mode) => {
    if (mode === "none" || mode === "exact") return Math.round(price * 100) / 100;
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
      notification.error("Please enter a valid update value");
      return;
    }

    if (selectedItemIds.size === 0) {
      notification.error("Please select at least one item from the menu tree");
      return;
    }

    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let count = 0;

      next.forEach((cat) => {
        (cat.sub_category || []).forEach((sub) => {
          (sub.items || []).forEach((item) => {
            if (!selectedItemIds.has(item.id)) return;

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
    notification.success(`Bulk price update applied to ${selectedItemIds.size} items!`);
  };

  // Count items & variants that have under review price
  const underReviewItemsCount = useMemo(() => {
    let count = 0;
    localCategories.forEach((cat) => {
      (cat.sub_category || []).forEach((sub) => {
        (sub.items || []).forEach((item) => {
          if (
            item.is_under_review &&
            item.under_review_price !== undefined &&
            item.under_review_price !== null
          ) {
            count++;
          }
          (item.variants || []).forEach((g) => {
            (g.options || []).forEach((opt) => {
              if (
                opt.is_under_review &&
                opt.under_review_price !== undefined &&
                opt.under_review_price !== null
              ) {
                count++;
              }
            });
          });
        });
      });
    });
    return count;
  }, [localCategories]);

  const selectedUnderReviewCount = useMemo(() => {
    let count = 0;
    localCategories.forEach((cat) => {
      (cat.sub_category || []).forEach((sub) => {
        (sub.items || []).forEach((item) => {
          if (!selectedItemIds.has(item.id)) return;
          if (
            item.is_under_review &&
            item.under_review_price !== undefined &&
            item.under_review_price !== null
          ) {
            count++;
          }
          (item.variants || []).forEach((g) => {
            (g.options || []).forEach((opt) => {
              if (
                opt.is_under_review &&
                opt.under_review_price !== undefined &&
                opt.under_review_price !== null
              ) {
                count++;
              }
            });
          });
        });
      });
    });
    return count;
  }, [localCategories, selectedItemIds]);

  // Count items & variants that exceed max allowed price
  const exceededMaxPriceCount = useMemo(() => {
    let count = 0;
    localCategories.forEach((cat) => {
      (cat.sub_category || []).forEach((sub) => {
        (sub.items || []).forEach((item) => {
          let hasExceeded = false;
          if (
            item.max_allowed_price &&
            item.base_price !== "" &&
            Number(item.base_price) > Number(item.max_allowed_price)
          ) {
            hasExceeded = true;
          }
          (item.variants || []).forEach((g) => {
            (g.options || []).forEach((opt) => {
              if (
                opt.max_allowed_price &&
                opt.price !== "" &&
                Number(opt.price) > Number(opt.max_allowed_price)
              ) {
                hasExceeded = true;
              }
            });
          });
          if (hasExceeded) count++;
        });
      });
    });
    return count;
  }, [localCategories]);

  const handleApplyAllUnderReviewPrices = () => {
    let count = 0;
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.forEach((cat) => {
        (cat.sub_category || []).forEach((sub) => {
          (sub.items || []).forEach((item) => {
            if (
              item.is_under_review &&
              item.under_review_price !== undefined &&
              item.under_review_price !== null
            ) {
              item.base_price = Number(item.under_review_price);
              count++;
            }
            (item.variants || []).forEach((g) => {
              (g.options || []).forEach((opt) => {
                if (
                  opt.is_under_review &&
                  opt.under_review_price !== undefined &&
                  opt.under_review_price !== null
                ) {
                  opt.price = Number(opt.under_review_price);
                  count++;
                }
              });
            });
          });
        });
      });
      return next;
    });

    if (count > 0) {
      setHasChanges(true);
      notification.success(`Set under-review price for ${count} items/variants in the table!`);
    } else {
      notification.error("No items with under-review price found.");
    }
  };

  const handleApplySelectedUnderReviewPrices = () => {
    let count = 0;
    setLocalCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.forEach((cat) => {
        (cat.sub_category || []).forEach((sub) => {
          (sub.items || []).forEach((item) => {
            if (!selectedItemIds.has(item.id)) return;
            if (
              item.is_under_review &&
              item.under_review_price !== undefined &&
              item.under_review_price !== null
            ) {
              item.base_price = Number(item.under_review_price);
              count++;
            }
            (item.variants || []).forEach((g) => {
              (g.options || []).forEach((opt) => {
                if (
                  opt.is_under_review &&
                  opt.under_review_price !== undefined &&
                  opt.under_review_price !== null
                ) {
                  opt.price = Number(opt.under_review_price);
                  count++;
                }
              });
            });
          });
        });
      });
      return next;
    });

    if (count > 0) {
      setHasChanges(true);
      setIsBulkModalOpen(false);
      notification.success(`Set under-review price for ${count} selected items/variants!`);
    } else {
      notification.error("No selected items have under-review prices.");
    }
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
          {exceededMaxPriceCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{exceededMaxPriceCount} item(s) exceed max allowed price</span>
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

          {underReviewItemsCount > 0 && (
            <button
              type="button"
              onClick={handleApplyAllUnderReviewPrices}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Click to copy all under review prices into the price fields"
            >
              <span className="w-2 h-2 rounded-full bg-[#c84e16] animate-pulse" />
              <span>Use Under Review Prices ({underReviewItemsCount})</span>
            </button>
          )}

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

                  const isBaseExceeded =
                    Boolean(item.max_allowed_price) &&
                    item.base_price !== "" &&
                    Number(item.base_price) > Number(item.max_allowed_price);

                  const hasAnyVariantExceeded = variants.some((g) =>
                    (g.options || []).some(
                      (o) =>
                        Boolean(o.max_allowed_price) &&
                        o.price !== "" &&
                        Number(o.price) > Number(o.max_allowed_price)
                    )
                  );

                  const isRowExceeded = isBaseExceeded || hasAnyVariantExceeded;

                  return (
                    <tr
                      key={item.id || `${_catIdx}-${_subIdx}-${_itemIdx}`}
                      className={`transition-colors ${
                        isRowExceeded
                          ? "bg-rose-50/20 hover:bg-rose-50/40"
                          : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Item Name */}
                      <td className="p-3.5 align-top">
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          <span>{item.name || "Unnamed Item"}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                          {item._catName} &gt; {item._subName}
                        </div>
                        {isRowExceeded && (
                          <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-semibold text-rose-700">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Price exceeds max limit</span>
                          </div>
                        )}
                      </td>

                      {/* Base Price (₹) */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={item.base_price ?? ""}
                              onChange={(e) =>
                                handleBasePriceChange(_catIdx, _subIdx, _itemIdx, e.target.value)
                              }
                              placeholder="0"
                              className={`w-24 px-3 py-1.5 bg-white border rounded-lg text-sm font-medium outline-none transition-colors ${
                                isBaseExceeded
                                  ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500 font-bold"
                                  : "border-gray-300 text-gray-900 focus:border-gray-500"
                              }`}
                            />
                            {item.is_under_review && item.under_review_price !== undefined && item.under_review_price !== null && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleBasePriceChange(_catIdx, _subIdx, _itemIdx, item.under_review_price)
                                }
                                title={`Click to set field to ₹${item.under_review_price}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200/80 hover:border-amber-300 rounded-md text-xs whitespace-nowrap transition-all cursor-pointer shadow-2xs group"
                              >
                                <span className="text-gray-900 font-semibold group-hover:text-amber-950">
                                  ₹{item.under_review_price}
                                </span>
                                <span className="bg-[#c84e16] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded leading-normal">
                                  Under review
                                </span>
                                <span className="text-[10px] text-amber-700 bg-amber-200/70 font-semibold px-1 py-0.5 rounded group-hover:bg-amber-300 transition-colors">
                                  Set
                                </span>
                              </button>
                            )}
                          </div>
                          {isBaseExceeded && (
                            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium leading-tight">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Max allowed: ₹{item.max_allowed_price}</span>
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
                                  {(group.options || []).map((opt, oIdx) => {
                                    const isOptExceeded =
                                      Boolean(opt.max_allowed_price) &&
                                      opt.price !== "" &&
                                      Number(opt.price) > Number(opt.max_allowed_price);

                                    return (
                                      <div
                                        key={opt.variant_id || opt.propertyValueId || opt.option_id || oIdx}
                                        className={`flex items-center bg-white border rounded-lg overflow-hidden text-xs shadow-2xs transition-colors ${
                                          isOptExceeded
                                            ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-300/60"
                                            : "border-gray-200"
                                        }`}
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
                                          className={`w-16 px-2 py-1.5 font-medium outline-none text-center ${
                                            isOptExceeded
                                              ? "text-rose-900 bg-rose-50/40 font-bold"
                                              : "text-gray-900"
                                          }`}
                                        />

                                        {isOptExceeded && (
                                          <div
                                            title={`Price ₹${opt.price} exceeds Zomato max allowed price of ₹${opt.max_allowed_price}`}
                                            className="flex items-center gap-0.5 px-1.5 py-1.5 bg-rose-50 border-l border-rose-200 text-rose-700 text-[10px] font-bold whitespace-nowrap"
                                          >
                                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                            <span>Max ₹{opt.max_allowed_price}</span>
                                          </div>
                                        )}

                                        {opt.is_under_review && opt.under_review_price !== undefined && opt.under_review_price !== null && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleVariantPriceChange(
                                                _catIdx,
                                                _subIdx,
                                                _itemIdx,
                                                gIdx,
                                                oIdx,
                                                opt.under_review_price
                                              )
                                            }
                                            title={`Click to set field to ₹${opt.under_review_price}`}
                                            className="flex items-center gap-1 px-1.5 py-1.5 bg-amber-50 hover:bg-amber-100/90 active:scale-95 border-l border-gray-200 text-xs whitespace-nowrap transition-all cursor-pointer group"
                                          >
                                            <span className="text-gray-900 font-semibold group-hover:text-amber-950">
                                              ₹{opt.under_review_price}
                                            </span>
                                            <span className="bg-[#c84e16] text-white text-[9px] font-semibold px-1 py-0.5 rounded leading-normal">
                                              Under review
                                            </span>
                                            <span className="text-[9px] text-amber-700 bg-amber-200/70 font-semibold px-1 py-0.2 rounded group-hover:bg-amber-300 transition-colors">
                                              Set
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
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
              {/* Folder-like Tree Structure for Item Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-500" />
                    <span>Select Items to Update</span>
                  </label>
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {selectedItemIds.size} of {allItems.length} selected
                  </span>
                </div>

                {/* Tree Box */}
                <div className="border border-gray-200 rounded-xl bg-gray-50/60 overflow-hidden text-xs">
                  {/* Master Select All Row */}
                  <div className="flex items-center justify-between p-2.5 bg-white border-b border-gray-200 font-medium text-gray-800">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllItemsSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-3.5 h-3.5 cursor-pointer accent-gray-900"
                      />
                      <span className="font-semibold text-gray-900">Entire Menu (All Categories)</span>
                    </label>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {isAllItemsSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {/* Scrollable Tree Container */}
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1 divide-y divide-gray-100/80">
                    {localCategories.map((cat, catIdx) => {
                      const catKey = String(cat.id || catIdx);
                      const isCatExpanded = expandedCategories.has(catKey);

                      // Calculate item stats for this category
                      const catItems = [];
                      (cat.sub_category || []).forEach((sub) => {
                        (sub.items || []).forEach((item) => catItems.push(item));
                      });
                      const catItemIds = catItems.map((i) => i.id);
                      const selectedInCat = catItemIds.filter((id) => selectedItemIds.has(id)).length;
                      const isCatFullySelected = catItemIds.length > 0 && selectedInCat === catItemIds.length;
                      const isCatPartiallySelected = selectedInCat > 0 && selectedInCat < catItemIds.length;

                      return (
                        <div key={catKey} className="pt-1.5 first:pt-0">
                          {/* Category Folder Row */}
                          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white transition-colors group">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleCatExpand(catKey)}
                                className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                              >
                                {isCatExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 select-none">
                                <input
                                  type="checkbox"
                                  checked={isCatFullySelected}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isCatPartiallySelected;
                                  }}
                                  onChange={() => toggleCategory(cat)}
                                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-3.5 h-3.5 cursor-pointer accent-gray-900"
                                />
                                {isCatExpanded ? (
                                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                                ) : (
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                )}
                                <span className="font-semibold text-gray-800 truncate">
                                  {cat.name}
                                </span>
                              </label>
                            </div>

                            <span className="text-[10px] font-medium text-gray-400 shrink-0 ml-2 bg-gray-100 dark:bg-gray-200/50 px-1.5 py-0.2 rounded">
                              {selectedInCat}/{catItemIds.length}
                            </span>
                          </div>

                          {/* Subcategories (if expanded) */}
                          {isCatExpanded && (
                            <div className="pl-5 space-y-1 mt-1 border-l border-gray-200 ml-3">
                              {(cat.sub_category || []).map((sub, subIdx) => {
                                const subKey = `${catKey}-${sub.id || subIdx}`;
                                const isSubExpanded = expandedSubCategories.has(subKey);

                                const subItems = sub.items || [];
                                const subItemIds = subItems.map((i) => i.id);
                                const selectedInSub = subItemIds.filter((id) => selectedItemIds.has(id)).length;
                                const isSubFullySelected = subItemIds.length > 0 && selectedInSub === subItemIds.length;
                                const isSubPartiallySelected = selectedInSub > 0 && selectedInSub < subItemIds.length;

                                return (
                                  <div key={subKey} className="space-y-0.5">
                                    {/* Subcategory Row */}
                                    <div className="flex items-center justify-between p-1 rounded-lg hover:bg-white transition-colors">
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => toggleSubCatExpand(subKey)}
                                          className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                                        >
                                          {isSubExpanded ? (
                                            <ChevronDown className="w-3 h-3" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3" />
                                          )}
                                        </button>

                                        <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0 select-none">
                                          <input
                                            type="checkbox"
                                            checked={isSubFullySelected}
                                            ref={(el) => {
                                              if (el) el.indeterminate = isSubPartiallySelected;
                                            }}
                                            onChange={() => toggleSubCategory(sub)}
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-3 h-3 cursor-pointer accent-gray-900"
                                          />
                                          <span className="text-gray-700 font-medium truncate">
                                            {sub.name === "nota" || !sub.name ? "Items" : sub.name}
                                          </span>
                                        </label>
                                      </div>

                                      <span className="text-[9px] text-gray-400 shrink-0">
                                        {selectedInSub}/{subItemIds.length}
                                      </span>
                                    </div>

                                    {/* Items under Subcategory (if expanded) */}
                                    {isSubExpanded && (
                                      <div className="pl-5 space-y-0.5 border-l border-gray-200 ml-2.5">
                                        {subItems.map((item) => {
                                          const isItemSelected = selectedItemIds.has(item.id);
                                          return (
                                            <label
                                              key={item.id}
                                              className="flex items-center justify-between p-1 rounded-md hover:bg-white cursor-pointer transition-colors text-[11px]"
                                            >
                                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <input
                                                  type="checkbox"
                                                  checked={isItemSelected}
                                                  onChange={() => toggleItem(item.id)}
                                                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 w-3 h-3 cursor-pointer accent-gray-900"
                                                />
                                                <span
                                                  className={`truncate ${
                                                    isItemSelected
                                                      ? "text-gray-900 font-medium"
                                                      : "text-gray-400"
                                                  }`}
                                                  title={item.name}
                                                >
                                                  {item.name}
                                                </span>
                                              </div>

                                              <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-1">
                                                ₹{item.base_price || 0}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                  className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 outline-none focus:border-gray-500 transition-colors cursor-pointer"
                >
                  <option value="next9">Round to Next 9 (e.g. ₹301 → ₹309)</option>
                  <option value="none">No Rounding (Exact mathematical value)</option>
                </select>
              </div>

              {/* Quick Action for Under Review Prices */}
              {selectedUnderReviewCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-amber-900">
                      Under Review Prices Detected
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c84e16] text-white">
                      {selectedUnderReviewCount} items
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    {selectedUnderReviewCount} of your selected items/variants have an active price under review in Zomato.
                  </p>
                  <button
                    type="button"
                    onClick={handleApplySelectedUnderReviewPrices}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    Set Under Review Prices to Selected ({selectedUnderReviewCount})
                  </button>
                </div>
              )}
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
                disabled={!bulkValue || Number(bulkValue) <= 0 || selectedItemIds.size === 0}
                className="flex-1 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                Apply Updates ({selectedItemIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PriceEditorTable;
