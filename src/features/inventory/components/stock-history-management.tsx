"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { listProducts } from "@/features/products/services/products-service";
import type { ProductDetail } from "@/features/products/types/product";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import {
  getStockHistoryItem,
  listStockHistory,
  filterStockHistory,
  resolveStockHistoryProduct,
} from "../services/stock-history-service";
import type {
  StockHistoryItem,
  StockHistoryPage,
} from "../types/stock-history";
import { StockHistoryDetailsSheet } from "./stock-history-details-sheet";
import { StockHistoryTable } from "./stock-history-table";

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

export function StockHistoryManagement() {
  const t = useTranslations("stockHistory");
  const router = useRouter();
  const { token, logout } = useAuth();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [history, setHistory] = useState<StockHistoryPage>({
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
  const [viewingRecord, setViewingRecord] = useState<StockHistoryItem | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isProductsReady, setIsProductsReady] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

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

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setIsProductsReady(false);
      setIsProductsLoading(false);
      return;
    }

    try {
      setIsProductsLoading(true);
      setProducts(await listAllCatalogueProducts(token));
      setIsProductsReady(true);
    } catch (error) {
      setIsProductsReady(false);
      handleApiError(error, t("feedback.productsError"));
    } finally {
      setIsProductsLoading(false);
    }
  }, [handleApiError, t, token]);

  const loadHistoryPage = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextProductId = productId,
    ) => {
      if (!token) {
        setHistory({
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
        const nextHistory = await listStockHistory(token, {
          page: nextPage,
          limit: nextPageSize,
          ...(nextProductId !== "all" ? { productId: nextProductId } : {}),
        });
        setHistory(nextHistory);
        const lastAvailablePage = Math.max(1, nextHistory.totalPages);
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
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistoryPage(page, pageSize, productId);
  }, [loadHistoryPage, page, pageSize, productId]);

  const visibleHistory = useMemo(
    () => ({
      ...history,
      items: filterStockHistory(
        history.items.map((record) =>
          resolveStockHistoryProduct(record, products),
        ),
        query,
        "all",
      ),
    }),
    [history, products, query],
  );

  async function handleView(record: StockHistoryItem) {
    if (!token) return;

    try {
      setIsDetailLoading(true);
      setFeedback("");
      const details = await getStockHistoryItem(token, record._id);
      const resolvedDetails = resolveStockHistoryProduct(details, products);
      setViewingRecord({
        ...resolvedDetails,
        supplierId: resolvedDetails.supplierId ?? record.supplierId,
      });
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
      <header>
        <h1 className="type-page-title">{t("title")}</h1>
        <p className="type-secondary mt-2">{t("description")}</p>
      </header>

      {isProductsLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingProducts")}
        </p>
      )}
      {!isProductsLoading && !isProductsReady && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadProducts()}
        >
          {t("actions.retry")}
        </Button>
      )}
      {feedback && (
        <p role="alert" className="text-sm text-destructive">
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
          onClick={() => void loadHistoryPage(page, pageSize, productId)}
        >
          {t("actions.retry")}
        </Button>
      ) : (
        <StockHistoryTable
          history={visibleHistory}
          products={products}
          query={query}
          productId={productId}
          hasHistory={
            history.totalItems > 0 ||
            Boolean(query.trim()) ||
            productId !== "all"
          }
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
          onView={handleView}
        />
      )}

      {isDetailLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingDetails")}
        </p>
      )}
      <StockHistoryDetailsSheet
        record={viewingRecord}
        onOpenChange={(open) => {
          if (!open) setViewingRecord(null);
        }}
      />
    </div>
  );
}
