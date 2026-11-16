"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { ApiClientError } from "@/lib/api-client";
import { useRouter } from "@/i18n/navigation";
import {
  createProductType,
  deleteProductType,
  listProductTypes,
  searchProductTypes,
  sortProductTypes,
  updateProductType,
} from "../services/product-types-service";
import type {
  ProductType,
  ProductTypeSortKey,
  SortDirection,
} from "../types/product-type";
import { DeleteProductTypeSheet } from "./delete-product-type-sheet";
import { ProductTypeFormSheet } from "./product-type-form-sheet";
import { ProductTypesTable } from "./product-types-table";

export function ProductTypesManagement() {
  const t = useTranslations("productTypes");
  const activeLocale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ProductTypeSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("descending");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [deletingProductType, setDeletingProductType] = useState<ProductType | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const canCreate = user?.role === "admin" || user?.role === "inventory-man";
  const canManage = user?.role === "admin";

  const loadProductTypes = useCallback(async () => {
    if (!token) {
      setProductTypes([]);
      return;
    }

    try {
      setIsLoading(true);
      const nextProductTypes = await listProductTypes(token);
      setProductTypes(nextProductTypes);
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.status === 401
          ? t("feedback.unauthorized")
          : t("feedback.loadError");
      setFeedback(message);

      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, router, t, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductTypes();
  }, [loadProductTypes]);

  const visibleProductTypes = useMemo(
    () =>
      sortProductTypes(
        searchProductTypes(productTypes, query),
        sortKey,
        sortDirection,
        activeLocale,
      ),
    [activeLocale, productTypes, query, sortDirection, sortKey],
  );

  function openCreateForm() {
    if (!canCreate) return;
    setEditingProductType(null);
    setEditorOpen(true);
    setFeedback("");
  }

  function openEditForm(productType: ProductType) {
    if (!canManage) return;
    setEditingProductType(productType);
    setEditorOpen(true);
    setFeedback("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingProductType(null);
  }

  async function handleSave(name: string) {
    if (!token || (editingProductType ? !canManage : !canCreate)) return;

    try {
      if (editingProductType) {
        await updateProductType(token, editingProductType._id, name);
        setFeedback(t("feedback.updated"));
      } else {
        await createProductType(token, name);
        setFeedback(t("feedback.created"));
      }

      await loadProductTypes();
      closeEditor(false);
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.status === 401
          ? t("feedback.unauthorized")
          : t("feedback.saveError");
      setFeedback(message);

      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
      }
    }
  }

  async function handleDelete() {
    if (!deletingProductType || !token || !canManage) return;

    try {
      await deleteProductType(token, deletingProductType._id);
      setFeedback(t("feedback.deleted"));
      await loadProductTypes();
      setDeletingProductType(null);
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.status === 401
          ? t("feedback.unauthorized")
          : t("feedback.deleteError");
      setFeedback(message);

      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
      }
    }
  }

  function handleSort(key: ProductTypeSortKey) {
    if (key === sortKey) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdAt" ? "descending" : "ascending");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        {canCreate && (
          <Button type="button" onClick={openCreateForm} className="w-full sm:w-auto">
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("feedback.loading")}</p>
      ) : (
        <ProductTypesTable
          productTypes={visibleProductTypes}
          query={query}
          sortKey={sortKey}
          sortDirection={sortDirection}
          hasProductTypes={productTypes.length > 0}
          canCreate={canCreate}
          canManage={canManage}
          onQueryChange={(value) => {
            setQuery(value);
            setFeedback("");
          }}
          onSort={handleSort}
          onAdd={openCreateForm}
          onEdit={openEditForm}
          onDelete={(productType) => {
            setDeletingProductType(productType);
            setFeedback("");
          }}
        />
      )}

      <ProductTypeFormSheet
        key={`${editorOpen}:${editingProductType?._id ?? "new"}`}
        open={editorOpen}
        productType={editingProductType}
        onOpenChange={closeEditor}
        onSubmit={handleSave}
      />
      <DeleteProductTypeSheet
        productType={deletingProductType}
        onOpenChange={(open) => {
          if (!open) setDeletingProductType(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
