"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { listProductTypes } from "@/features/product-types/services/product-types-service";
import { ApiClientError } from "@/lib/api-client";
import { useRouter } from "@/i18n/navigation";
import type { ProductType } from "@/features/product-types/types/product-type";
import {
  createProduct,
  deleteProduct,
  filterProducts,
  listProducts,
  updateProduct,
} from "../services/products-service";
import type { ProductDetail, ProductFormValues, ProductPage } from "../types/product";
import { DeleteProductSheet } from "./delete-product-sheet";
import { ProductDetailsSheet } from "./product-details-sheet";
import { ProductFormSheet } from "./product-form-sheet";
import { ProductsTable } from "./products-table";

const pageSizes = [5, 10, 20] as const;

export function ProductsManagement() {
  const t = useTranslations("products");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<ProductPage>({
    items: [],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [productTypeId, setProductTypeId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizes)[number]>(5);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductDetail | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDetail | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const canCreate = user ? ["admin", "inventory-man"].includes(user.role) : false;
  const canEdit = user ? user.role === "admin" : false;
  const canDelete = user ? user.role === "admin" : false;

  const loadProductTypes = useCallback(async () => {
    if (!token) {
      setProductTypes([]);
      return;
    }

    try {
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
    }
  }, [logout, router, t, token]);

  const loadProducts = useCallback(
    async (nextPage = page, nextPageSize = pageSize, nextProductTypeId = productTypeId) => {
      if (!token) {
        setProducts({ items: [], page: 1, pageSize: nextPageSize, totalItems: 0, totalPages: 0 });
        return;
      }

      try {
        setIsLoading(true);
        const nextPageData = await listProducts(token, {
          page: nextPage,
          limit: nextPageSize,
          ...(nextProductTypeId !== "all" ? { productType: nextProductTypeId } : {}),
        });
        setProducts(nextPageData);
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
    },
    [logout, page, pageSize, productTypeId, router, t, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductTypes();
  }, [loadProductTypes]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadProducts(page, pageSize, productTypeId);
    }
  }, [loadProducts, page, pageSize, productTypeId, token]);

  const visibleProducts = useMemo(() => {
    const filteredItems = filterProducts(products.items, query, productTypeId);
    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / products.pageSize || 1));

    return {
      ...products,
      items: filteredItems,
      page: Math.min(products.page, totalPages),
      totalItems,
      totalPages,
    };
  }, [products, productTypeId, query]);

  function openCreateForm() {
    setEditingProduct(null);
    setEditorOpen(true);
    setFeedback("");
  }

  function openEditForm(product: ProductDetail) {
    setViewingProduct(null);
    setEditingProduct(product);
    setEditorOpen(true);
    setFeedback("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingProduct(null);
  }

  async function handleSave(values: ProductFormValues) {
    if (!token) return;

    try {
      if (editingProduct) {
        const productName = values.productName.trim();
        const update = {
          ...(productName !== editingProduct.productName.trim()
            ? { productName }
            : {}),
          ...(values.productType !== (editingProduct.productType?._id ?? "")
            ? { productType: values.productType }
            : {}),
        };
        if (Object.keys(update).length === 0) return;

        await updateProduct(token, editingProduct._id, update);
        setFeedback(t("feedback.updated"));
      } else {
        const response = await createProduct(token, {
          productName: values.productName,
          productType: values.productType,
          serialNumber: values.serialNumber,
        });
        setFeedback(t("feedback.createdSerial", { serialNumber: response.serialNumber }));
      }

      setPage(1);
      setProductTypeId("all");
      await loadProducts(1, pageSize, "all");
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
    if (!deletingProduct || !token) return;

    try {
      await deleteProduct(token, deletingProduct._id);
      setFeedback(t("feedback.deleted"));
      setDeletingProduct(null);
      setViewingProduct(null);
      await loadProducts(Math.max(1, page), pageSize, productTypeId);
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

  function clearFilters() {
    setQuery("");
    setProductTypeId("all");
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={openCreateForm}
            className="w-full sm:w-auto"
          >
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
        <ProductsTable
          products={visibleProducts}
          productTypes={productTypes}
          query={query}
          productTypeId={productTypeId}
          hasProducts={products.totalItems > 0}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
            setFeedback("");
          }}
          onProductTypeChange={(id) => {
            setProductTypeId(id);
            setPage(1);
            setFeedback("");
          }}
          onClearFilters={clearFilters}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            const nextPageSize = pageSizes.find((size) => size === value);
            if (nextPageSize !== undefined) {
              setPageSize(nextPageSize);
              setPage(1);
            }
          }}
          onAdd={openCreateForm}
          onView={(product) => {
            setViewingProduct(product);
            setFeedback("");
          }}
          onEdit={openEditForm}
          onDelete={(product) => {
            setDeletingProduct(product);
            setFeedback("");
          }}
        />
      )}

      <ProductFormSheet
        key={`${editorOpen}:${editingProduct?._id ?? "new"}`}
        open={editorOpen}
        product={editingProduct}
        productTypes={productTypes}
        onOpenChange={closeEditor}
        onSubmit={handleSave}
      />
      <ProductDetailsSheet
        product={viewingProduct}
        canEdit={canEdit}
        canDelete={canDelete}
        onOpenChange={(open) => {
          if (!open) setViewingProduct(null);
        }}
        onEdit={openEditForm}
        onDelete={(product) => {
          setDeletingProduct(product);
          setViewingProduct(null);
        }}
      />
      <DeleteProductSheet
        product={deletingProduct}
        onOpenChange={(open) => {
          if (!open) setDeletingProduct(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
