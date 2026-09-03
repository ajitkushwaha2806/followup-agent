"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { credentialService } from "@/services/frontend/credentialService";
import { INITIAL_FORM_DATA } from "./constants";
import { filterCredentials } from "./helpers";
import {
  HeaderBanner,
  AlertNotifications,
  FilterToolbar,
  CredentialTable,
  EmptyState,
  CredentialModal,
  DeleteConfirmModal,
  CookieGuideModal,
} from "./fragments";

export default function ZomatoCredentialsManager() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [successMessage, setSuccessMessage] = useState(null);
  const [customError, setCustomError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formError, setFormError] = useState("");
  const [visibleCookies, setVisibleCookies] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const {
    data: queryResponse,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["credentials"],
    queryFn: credentialService.getAll,
  });

  const credentials = queryResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (newCred) => credentialService.create(newCred),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setSuccessMessage(data.message || "Credential added successfully!");
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
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
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
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setSuccessMessage(data.message || "Credential removed successfully!");
      setDeleteConfirmItem(null);
    },
    onError: (err) => {
      setCustomError(
        err.response?.data?.message || err.message || "Failed to delete credential"
      );
    },
  });

  const testMutation = useMutation({
    mutationFn: (id) => credentialService.testConnection(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      const user = data.user;
      const userSummary = user?.name
        ? `${user.name} (${user.email || user.user_id})`
        : null;

      if (data.isValid) {
        setSuccessMessage(
          `Verified! Merchant user: ${userSummary || "Active"}. Status updated to ACTIVE.`
        );
      } else {
        setCustomError(data.message || "Session verification failed. Status set to EXPIRED.");
      }
      setTestingId(null);
    },
    onError: (err) => {
      setCustomError(
        err.response?.data?.message || err.message || "Test connection failed"
      );
      setTestingId(null);
    },
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenModal = (item = null) => {
    setFormError("");
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        cookie: item.cookie,
      });
    } else {
      setEditingItem(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Please provide an account name");
      return;
    }

    if (!formData.cookie.trim()) {
      setFormError("Please provide the Zomato merchant cookie");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem._id,
        payload: {
          name: formData.name,
          cookie: formData.cookie,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmItem) return;
    deleteMutation.mutate(deleteConfirmItem._id);
  };

  const handleTestConnection = (id) => {
    setTestingId(id);
    testMutation.mutate(id);
  };

  const toggleCookieVisibility = (id) => {
    setVisibleCookies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCredentials = filterCredentials(
    credentials,
    searchQuery,
    statusFilter
  );

  const activeError =
    customError ||
    (isError
      ? queryError?.response?.data?.message || queryError?.message
      : null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <HeaderBanner
        onOpenAddModal={() => handleOpenModal()}
      />

      <AlertNotifications
        successMessage={successMessage}
        errorMessage={activeError}
        onClearSuccess={() => setSuccessMessage(null)}
        onClearError={() => setCustomError(null)}
      />

      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
          <p className="text-zinc-500 text-sm">
            Fetching credentials via TanStack Query...
          </p>
        </div>
      ) : filteredCredentials.length === 0 ? (
        <EmptyState
          hasSearchOrFilter={Boolean(searchQuery || statusFilter !== "ALL")}
          onResetFilters={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
          onOpenAddModal={() => handleOpenModal()}
        />
      ) : (
        <CredentialTable
          credentials={filteredCredentials}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onEdit={handleOpenModal}
          onDeleteConfirm={setDeleteConfirmItem}
          onTestConnection={handleTestConnection}
          testingId={testingId}
        />
      )}

      <CredentialModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        formData={formData}
        formError={formError}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onChangeFormData={setFormData}
        onSubmit={handleSubmit}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <DeleteConfirmModal
        item={deleteConfirmItem}
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={handleDelete}
      />

      <CookieGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
