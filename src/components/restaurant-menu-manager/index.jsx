"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { credentialService } from "@/services/frontend/credentialService";
import { INITIAL_FORM_DATA } from "@/components/zomato-credential-manager/constants";
import {
  AlertNotifications,
  EmptyState,
  CredentialModal,
  DeleteConfirmModal,
  CookieGuideModal,
} from "@/components/zomato-credential-manager/fragments";
import MenuCredentialTable from "./fragments/MenuCredentialTable";
import { Plus, Search, Utensils, RefreshCw, ClipboardList, ArrowRight } from "lucide-react";
import { getUserAccess } from "@/lib/auth/access";

export default function RestaurantMenuManager() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hasOnboarding } = getUserAccess(user);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [successMessage, setSuccessMessage] = useState(null);
  const [customError, setCustomError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA, type: "MENU_MANAGEMENT" });
  const [formError, setFormError] = useState("");
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data: queryResponse,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["menu-credentials", page, limit, debouncedSearch, statusFilter],
    queryFn: () =>
      credentialService.getAll({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        type: "MENU_MANAGEMENT",
      }),
  });

  const credentials = queryResponse?.data || [];
  const pagination = queryResponse?.pagination;

  const createMutation = useMutation({
    mutationFn: (newCred) =>
      credentialService.create({ ...newCred, type: "MENU_MANAGEMENT" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu-credentials"] });
      setSuccessMessage(data.message || "Menu management credential added successfully!");
      handleCloseModal();
    },
    onError: (err) => {
      setFormError(
        err.response?.data?.message || err.message || "Failed to create credential"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => credentialService.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu-credentials"] });
      setSuccessMessage(data.message || "Credential updated successfully!");
      handleCloseModal();
    },
    onError: (err) => {
      setFormError(
        err.response?.data?.message || err.message || "Failed to update credential"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => credentialService.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu-credentials"] });
      setSuccessMessage(data.message || "Credential deleted successfully!");
      setDeleteConfirmItem(null);
    },
    onError: (err) => {
      setCustomError(
        err.response?.data?.message || err.message || "Failed to delete credential"
      );
      setDeleteConfirmItem(null);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id) => credentialService.testConnection(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu-credentials"] });
      setSuccessMessage(data.message || "Connection verified successfully!");
      setTestingId(null);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["menu-credentials"] });
      setCustomError(
        err.response?.data?.message || err.message || "Session test failed"
      );
      setTestingId(null);
    },
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM_DATA, type: "MENU_MANAGEMENT" });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      cookie: item.cookie || "",
      type: "MENU_MANAGEMENT",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ ...INITIAL_FORM_DATA, type: "MENU_MANAGEMENT" });
    setFormError("");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.cookie.trim()) {
      setFormError("Account name and cookie are required");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem._id,
        payload: {
          name: formData.name.trim(),
          cookie: formData.cookie.trim(),
          type: "MENU_MANAGEMENT",
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        cookie: formData.cookie.trim(),
        type: "MENU_MANAGEMENT",
      });
    }
  };

  const handleTestConnection = (id) => {
    setTestingId(id);
    testConnectionMutation.mutate(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
              <Utensils className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Restaurant Menu & Pricing
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage live restaurant merchant credentials, import catalogue menus, and manage pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasOnboarding && (
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-red-400" />
              <span>Onboarding Tracker</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-all shadow-md shadow-orange-600/20 hover:shadow-lg active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Menu Credential</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AlertNotifications
        successMessage={successMessage}
        customError={customError}
        queryError={queryError?.response?.data?.message || queryError?.message}
        onClearSuccess={() => setSuccessMessage(null)}
        onClearCustomError={() => setCustomError(null)}
      />

      {/* Main Table or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">Loading menu credentials...</p>
        </div>
      ) : credentials.length === 0 ? (
        <EmptyState
          searchQuery=""
          statusFilter="ALL"
          onOpenAddModal={handleOpenAddModal}
        />
      ) : (
        <MenuCredentialTable
          credentials={credentials}
          onEdit={handleOpenEditModal}
          onDeleteConfirm={(item) => setDeleteConfirmItem(item)}
          onTestConnection={handleTestConnection}
          testingId={testingId}
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* Modals */}
      <CredentialModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        formData={formData}
        formError={formError}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onChangeFormData={setFormData}
        onSubmit={handleFormSubmit}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmItem)}
        item={deleteConfirmItem}
        isDeleting={deleteMutation.isPending}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={() => deleteMutation.mutate(deleteConfirmItem._id)}
      />

      <CookieGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
