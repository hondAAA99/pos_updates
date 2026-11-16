"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import type { ProductDetail } from "@/features/products/types/product";
import { listProducts } from "@/features/products/services/products-service";
import {
  listSupplierOptionsFromApi,
} from "@/features/suppliers/services/suppliers-service";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import { ApiClientError } from "@/lib/api-client";
import {
  createInventoryStock,
  deleteInventoryStock,
  getInventoryItem,
  listInventory,
  updateInventoryStock,
} from "../services/inventory-api-service";
import {
  filterStockRecords,
  withStockProductDetails,
} from "../services/stock-service";
import type {
  AddStockDto,
  StockPage,
  StockRecord,
  UpdateStockDto,
} from "../types/stock";
import { DeleteStockSheet } from "./delete-stock-sheet";
import { StockDetailsSheet } from "./stock-details-sheet";
import { StockFormSheet } from "./stock-form-sheet";
import { StockTable } from "./stock-table";

const pageSizes = [5, 10, 20] as const;
const lookupPageSize = 100;

async function listAllCatalogueProducts(token: string): Promise<ProductDetail[]> {
  const firstPage = await listProducts(token, {
    page: 1,
    limit: lookupPageSize,
  });
  const products = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const response = await listProducts(token, {
      page,
      limit: lookupPageSize,
    });
    products.push(...response.items);
  }

  return products;
}

export function InventoryManagement() {
  const t = useTranslations("inventory");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [stocks, setStocks] = useState<StockPage>({
    items: [],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizes)[number]>(5);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRecord | null>(null);
  const [viewingStock, setViewingStock] = useState<StockRecord | null>(null);
  const [deletingStock, setDeletingStock] = useState<StockRecord | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLookupLoading, setIsLookupLoading] = useState(true);
  const [isLookupReady, setIsLookupReady] = useState(false);
  const [productsLookupError, setProductsLookupError] = useState("");
  const [suppliersLookupError, setSuppliersLookupError] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const canCreate = user?.role === "admin" || user?.role === "inventory-man";
  const canEdit = user?.role === "admin";
  const canDelete = user?.role === "admin";

  const handleApiError = useCallback(
    (error: unknown, fallback: string) => {
      setFeedback(
        error instanceof ApiClientError && error.status === 401
          ? t("feedback.unauthorized")
          : fallback,
      );

      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadLookups = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setSuppliers([]);
      setIsLookupReady(false);
      setIsLookupLoading(false);
      return;
    }

    try {
      setIsLookupLoading(true);
      setIsLookupReady(false);
      setProductsLookupError("");
      setSuppliersLookupError("");
      const [productsResult, suppliersResult] = await Promise.allSettled([
        listAllCatalogueProducts(token),
        listSupplierOptionsFromApi(token),
      ]);

      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value);
      } else {
        setProducts([]);
        setProductsLookupError(
          productsResult.reason instanceof ApiClientError &&
            productsResult.reason.status === 401
            ? t("feedback.unauthorized")
            : t("feedback.productsLoadError"),
        );
      }

      if (suppliersResult.status === "fulfilled") {
        setSuppliers(suppliersResult.value);
      } else {
        setSuppliers([]);
        setSuppliersLookupError(
          suppliersResult.reason instanceof ApiClientError &&
            suppliersResult.reason.status === 401
            ? t("feedback.unauthorized")
            : t("feedback.suppliersLoadError"),
        );
      }

      const rejectedResults = [productsResult, suppliersResult].filter(
        (result) => result.status === "rejected",
      );
      setIsLookupReady(rejectedResults.length === 0);

      if (rejectedResults.some((result) =>
        result.status === "rejected" &&
        result.reason instanceof ApiClientError &&
        result.reason.status === 401
      )) {
        logout();
        router.replace("/login");
      }
    } finally {
      setIsLookupLoading(false);
    }
  }, [logout, router, t, token]);

  const loadStockPage = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextProductId = productId,
    ) => {
      if (!token) {
        setStocks({
          items: [],
          page: 1,
          pageSize: nextPageSize,
          totalItems: 0,
          totalPages: 0,
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasLoadError(false);
        const nextStocks = await listInventory(token, {
          page: nextPage,
          limit: nextPageSize,
          ...(nextProductId !== "all" ? { productId: nextProductId } : {}),
        });
        setStocks(nextStocks);
        const lastAvailablePage = Math.max(1, nextStocks.totalPages);
        if (nextPage > lastAvailablePage) {
          setPage(lastAvailablePage);
        }
      } catch (error) {
        setHasLoadError(true);
        handleApiError(error, t("feedback.loadError"));
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError, page, pageSize, productId, t, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStockPage(page, pageSize, productId);
  }, [loadStockPage, page, pageSize, productId]);

  const visibleStocks = useMemo(
    () => ({
      ...stocks,
      items: filterStockRecords(stocks.items, query, "all"),
    }),
    [query, stocks],
  );
  const isSuccessFeedback = [
    t("feedback.created"),
    t("feedback.updated"),
    t("feedback.deleted"),
  ].includes(feedback);

  function openCreateForm() {
    if (!canCreate || !isLookupReady) return;
    setEditingStock(null);
    setEditorOpen(true);
    setFeedback("");
  }

  function openEditForm(stock: StockRecord) {
    if (!canEdit) return;
    setViewingStock(null);
    setEditingStock(stock);
    setEditorOpen(true);
    setFeedback("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingStock(null);
  }

  async function handleCreate(dto: AddStockDto) {
    if (!token || !canCreate) return;

    try {
      await createInventoryStock(token, dto);
      setFeedback(t("feedback.created"));
      setPage(1);
      setProductId("all");
      await loadStockPage(1, pageSize, "all");
      closeEditor(false);
    } catch (error) {
      handleApiError(error, t("feedback.saveError"));
    }
  }

  async function handleUpdate(dto: UpdateStockDto) {
    if (!editingStock || !token || !canEdit) return;

    try {
      await updateInventoryStock(token, editingStock._id, dto);
      setFeedback(t("feedback.updated"));
      closeEditor(false);
      await loadStockPage(page, pageSize, productId);
    } catch (error) {
      handleApiError(error, t("feedback.saveError"));
    }
  }

  async function handleDelete() {
    if (!deletingStock || !token || !canDelete) return;

    try {
      await deleteInventoryStock(token, deletingStock._id);
      setFeedback(t("feedback.deleted"));
      setDeletingStock(null);
      setViewingStock(null);
      await loadStockPage(page, pageSize, productId);
    } catch (error) {
      handleApiError(error, t("feedback.deleteError"));
    }
  }

  async function handleView(stock: StockRecord) {
    if (!token) return;

    try {
      setIsDetailLoading(true);
      setFeedback("");
      const details = await getInventoryItem(token, stock._id);
      setViewingStock(withStockProductDetails(details, products));
    } catch (error) {
      handleApiError(error, t("feedback.detailsError"));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setProductId("all");
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6">
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
            disabled={isLookupLoading || !isLookupReady}
          >
            <Plus aria-hidden="true" />
            {t("actions.add")}
          </Button>
        )}
      </header>

      {isLookupLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingLookups")}
        </p>
      )}
      {!isLookupLoading && productsLookupError && (
        <p role="alert" className="text-sm text-destructive">
          {productsLookupError}
        </p>
      )}
      {!isLookupLoading && suppliersLookupError && (
        <p role="alert" className="text-sm text-destructive">
          {suppliersLookupError}
        </p>
      )}
      {!isLookupLoading && !isLookupReady && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadLookups()}
        >
          {t("actions.retry")}
        </Button>
      )}
      {feedback && (
        <p
          role={isSuccessFeedback ? "status" : "alert"}
          className={isSuccessFeedback ? "text-sm text-success" : "text-sm text-destructive"}
        >
          {feedback}
        </p>
      )}

      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loading")}
        </p>
      ) : hasLoadError ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadStockPage(page, pageSize, productId)}
        >
          {t("actions.retry")}
        </Button>
      ) : (
        <StockTable
          stocks={visibleStocks}
          products={products}
          query={query}
          productId={productId}
          hasStock={stocks.totalItems > 0 || Boolean(query.trim()) || productId !== "all"}
          canCreate={Boolean(canCreate && isLookupReady)}
          canEdit={Boolean(canEdit)}
          canDelete={Boolean(canDelete)}
          onQueryChange={(value) => {
            setQuery(value);
            setFeedback("");
          }}
          onProductChange={(id) => {
            setProductId(id);
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
          onView={handleView}
          onEdit={openEditForm}
          onDelete={(stock) => {
            if (!canDelete) return;
            setDeletingStock(stock);
            setFeedback("");
          }}
        />
      )}

      {isDetailLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingDetails")}
        </p>
      )}

      <StockFormSheet
        key={`${editorOpen}:${editingStock?._id ?? "new"}`}
        open={editorOpen}
        stock={editingStock}
        products={products}
        suppliers={suppliers}
        onOpenChange={closeEditor}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <StockDetailsSheet
        stock={viewingStock}
        canEdit={Boolean(canEdit)}
        canDelete={Boolean(canDelete)}
        onOpenChange={(open) => {
          if (!open) setViewingStock(null);
        }}
        onEdit={openEditForm}
        onDelete={(stock) => {
          if (!canDelete) return;
          setViewingStock(null);
          setDeletingStock(stock);
        }}
      />
      <DeleteStockSheet
        stock={deletingStock}
        onOpenChange={(open) => {
          if (!open) setDeletingStock(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
