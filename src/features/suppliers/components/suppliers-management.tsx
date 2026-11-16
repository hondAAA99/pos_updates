"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
} from "../services/suppliers-service";
import {
  getSupplierPermissions,
  type SupplierRole,
} from "../services/supplier-permissions";
import type {
  SupplierDetail,
  SupplierListItem,
  SupplierPage,
} from "../types/supplier";
import { DeleteSupplierSheet } from "./delete-supplier-sheet";
import { SupplierDetailsSheet } from "./supplier-details-sheet";
import { SupplierFormSheet } from "./supplier-form-sheet";
import { SuppliersTable } from "./suppliers-table";

const pageSizes = [5, 10, 20] as const;
const initialPageSize = 5;

type LoadState = "loading" | "ready" | "error";
const noPermissions = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

function emptyPage(limit: number): SupplierPage {
  return {
    meta: { totalDoc: 0, currentPage: 1, totalPages: 0, limit },
    data: [],
  };
}

export function SuppliersManagement() {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const role: SupplierRole | null =
    user?.role === "admin" || user?.role === "inventory-man"
      ? user.role
      : null;
  const permissions = role ? getSupplierPermissions(role) : noPermissions;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialPageSize);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [result, setResult] = useState(() => emptyPage(initialPageSize));
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<SupplierListItem | null>(null);
  const [viewingSupplier, setViewingSupplier] =
    useState<SupplierDetail | null>(null);
  const [deletingSupplier, setDeletingSupplier] =
    useState<SupplierListItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const listRequestId = useRef(0);

  const showApiError = useCallback(
    (caught: unknown, fallback: string) => {
      const unauthorized =
        caught instanceof ApiClientError && caught.status === 401;
      setError(
        unauthorized
          ? t("states.unauthorized")
          : caught instanceof ApiClientError && caught.status === 0
            ? caught.message
            : fallback,
      );
      if (unauthorized) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadSuppliers = useCallback(
    async (nextPage = page) => {
      const requestId = ++listRequestId.current;
      if (!token) {
        setLoadState("error");
        setError(t("states.unauthorized"));
        return;
      }
      try {
        setLoadState("loading");
        setError("");
        const nextResult = await listSuppliers(token, {
          page: nextPage,
          limit,
          phoneNumber,
        });
        if (requestId !== listRequestId.current) return;
        setResult(nextResult);
        setPage(nextResult.meta.currentPage);
        setLoadState("ready");
      } catch (caught) {
        if (requestId === listRequestId.current) {
          setLoadState("error");
          showApiError(caught, t("states.loadError"));
        }
      }
    },
    [limit, page, phoneNumber, showApiError, t, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSuppliers(page);
  }, [loadSuppliers, page, retryCount]);

  function openCreateForm() {
    if (!permissions.canCreate) return;
    setEditingSupplier(null);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function openEditForm(detail: SupplierDetail) {
    if (!permissions.canUpdate) return;
    setViewingSupplier(null);
    setEditingSupplier(detail.supplier);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingSupplier(null);
  }

  async function handleSave(values: { name: string; phoneNumber: string }) {
    if (!token || (!editingSupplier && !permissions.canCreate)) return;
    if (editingSupplier && !permissions.canUpdate) return;

    try {
      setIsSubmitting(true);
      setError("");
      if (editingSupplier) {
        await updateSupplier(token, editingSupplier._id, values);
        setFeedback(t("feedback.updated"));
      } else {
        await createSupplier(token, values);
        setFeedback(t("feedback.created"));
      }
      setEditorOpen(false);
      setEditingSupplier(null);
      await loadSuppliers(1);
    } catch (caught) {
      showApiError(caught, t("states.operationError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingSupplier || !token || !permissions.canDelete) return;
    try {
      setIsDeleting(true);
      setError("");
      await deleteSupplier(token, deletingSupplier._id);
      setFeedback(t("feedback.deleted"));
      setDeletingSupplier(null);
      setViewingSupplier(null);
      const nextPage =
        result.data.length === 1 && page > 1 ? page - 1 : page;
      await loadSuppliers(nextPage);
    } catch (caught) {
      showApiError(caught, t("states.operationError"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function openDetails(supplier: SupplierListItem) {
    if (!token) return;
    try {
      setError("");
      setViewingSupplier(await getSupplierById(token, supplier._id));
      setFeedback("");
    } catch (caught) {
      showApiError(caught, t("states.detailsError"));
    }
  }

  async function openEdit(supplier: SupplierListItem) {
    if (!token || !permissions.canUpdate) return;
    try {
      setError("");
      const detail = await getSupplierById(token, supplier._id);
      openEditForm(detail);
    } catch (caught) {
      showApiError(caught, t("states.detailsError"));
    }
  }

  function openDelete(detail: SupplierDetail) {
    if (!permissions.canDelete) return;
    setViewingSupplier(null);
    setDeletingSupplier(detail.supplier);
    setFeedback("");
    setError("");
  }

  function clearFilter() {
    setPhoneNumber("");
    setPage(1);
    setFeedback("");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-6">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        {permissions.canCreate && (
          <Button type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" />
            {t("actions.add")}
          </Button>
        )}
      </header>

      {feedback && (
        <p role="status" className="text-sm text-success">
          {feedback}
        </p>
      )}
      {error && loadState !== "error" && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loadState === "loading" ? (
        <Card
          aria-label={t("states.loading")}
          className="min-h-64 items-center justify-center"
        >
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.loading")}
          </p>
        </Card>
      ) : loadState === "error" ? (
        <Card className="min-h-64 items-center justify-center gap-4 text-center">
          <p role="alert" className="text-sm text-destructive">
            {error || t("states.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RefreshCw aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        </Card>
      ) : (
        <SuppliersTable
          suppliers={result}
          phoneNumber={phoneNumber}
          hasSuppliers={result.meta.totalDoc > 0}
          canCreate={permissions.canCreate}
          canUpdate={permissions.canUpdate}
          canDelete={permissions.canDelete}
          onPhoneNumberChange={(value) => {
            setPhoneNumber(value);
            setPage(1);
            setFeedback("");
          }}
          onClearFilter={clearFilter}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            if (pageSizes.some((size) => size === nextLimit)) {
              setLimit(nextLimit);
              setPage(1);
            }
          }}
          onAdd={openCreateForm}
          onView={(supplier) => void openDetails(supplier)}
          onEdit={(supplier) => void openEdit(supplier)}
          onDelete={(supplier) => {
            if (!permissions.canDelete) return;
            setDeletingSupplier(supplier);
            setFeedback("");
            setError("");
          }}
        />
      )}

      {permissions.canCreate && (
        <SupplierFormSheet
          key={`${editorOpen}:${editingSupplier?._id ?? "new"}`}
          open={editorOpen}
          supplier={editingSupplier}
          isSubmitting={isSubmitting}
          onOpenChange={closeEditor}
          onSubmit={handleSave}
        />
      )}
      <SupplierDetailsSheet
        detail={viewingSupplier}
        canUpdate={permissions.canUpdate}
        canDelete={permissions.canDelete}
        onOpenChange={(open) => {
          if (!open) setViewingSupplier(null);
        }}
        onEdit={openEditForm}
        onDelete={openDelete}
      />
      {permissions.canDelete && (
        <DeleteSupplierSheet
          supplier={deletingSupplier}
          isDeleting={isDeleting}
          onOpenChange={(open) => {
            if (!open) setDeletingSupplier(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
