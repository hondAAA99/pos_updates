"use client";

import { Eye, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { ProductDetail } from "@/features/products/types/product";
import type {
  StockHistoryItem,
  StockHistoryPage,
} from "../types/stock-history";

type StockHistoryTableProps = {
  history: StockHistoryPage;
  products: ProductDetail[];
  query: string;
  productId: string;
  hasHistory: boolean;
  onQueryChange: (query: string) => void;
  onProductChange: (id: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (record: StockHistoryItem) => void;
};

export function StockHistoryTable({
  history,
  products,
  query,
  productId,
  hasHistory,
  onQueryChange,
  onProductChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onView,
}: StockHistoryTableProps) {
  const t = useTranslations("stockHistory");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const start =
    history.totalItems === 0
      ? 0
      : (history.page - 1) * history.pageSize + 1;
  const end = Math.min(history.page * history.pageSize, history.totalItems);
  const hasActiveFilters = Boolean(query.trim()) || productId !== "all";

  function displayDate(value: string) {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      Number.isNaN(new Date(value).getTime())
    ) {
      return t("details.notAvailable");
    }

    return formatDate(value, locale, { dateStyle: "medium" });
  }

  function viewAction(record: StockHistoryItem) {
    const productName =
      record.productId?.productName ?? t("details.notAvailable");
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t("actions.viewNamed", {
          name: productName,
        })}
        onClick={() => onView(record)}
      >
        <Eye aria-hidden="true" />
        <span className="hidden sm:inline">{t("actions.viewDetails")}</span>
        <span className="sm:hidden">{t("actions.view")}</span>
      </Button>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block w-full md:max-w-sm md:flex-1">
            <span className="sr-only">{t("search.label")}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.currentTarget.value)}
              placeholder={t("search.placeholder")}
              className="ps-9"
            />
          </label>
          <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 md:w-auto md:min-w-64">
            <span className="shrink-0 text-sm text-muted-foreground">
              {t("filter.product")}
            </span>
            <select
              value={productId}
              onChange={(event) => onProductChange(event.currentTarget.value)}
              aria-label={t("filter.product")}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none"
            >
              <option value="all">{t("filter.allProducts")}</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.productName}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              className="self-start md:self-auto"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("search.localNote")}
        </p>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", {
            count: query.trim() ? history.items.length : history.totalItems,
          })}
        </p>
      </div>

      {history.totalItems > 0 ? (
        <>
          <div className="grid gap-3 p-4">
            {history.items.map((record) => (
              <article
                key={record._id}
                className="min-w-0 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold">
                      {record.productId?.productName ?? t("details.notAvailable")}
                    </h2>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {record.supplierId?.name ?? t("details.notAvailable")}
                    </p>
                  </div>
                  {viewAction(record)}
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <MobileDetail
                    label={t("table.date")}
                    value={displayDate(record.timestamp)}
                  />
                  <MobileDetail
                    label={t("table.quantity")}
                    value={formatNumber(record.quantity, locale)}
                  />
                  <MobileDetail
                    label={t("table.batchSellingPrice")}
                    value={formatCurrency(record.batch_selling_price, locale)}
                  />
                  <MobileDetail
                    label={t("table.batchPurchasePrice")}
                    value={formatCurrency(record.batch_purchase_price, locale)}
                  />
                  <MobileDetail
                    label={t("table.batchWholesalePrice")}
                    value={formatCurrency(record.batch_wholesale_price, locale)}
                  />
                  <MobileDetail
                    label={t("table.profitMargin")}
                    value={formatNumber(record.profit_margin, locale)}
                  />
                </dl>
              </article>
            ))}
          </div>
          <footer className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("pagination.showing", {
                  start,
                  end,
                  total: history.totalItems,
                })}
              </span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={history.pageSize}
                  onChange={(event) =>
                    onPageSizeChange(Number(event.currentTarget.value))
                  }
                  aria-label={t("pagination.pageSize")}
                  className="h-8 rounded-md border border-input bg-background px-2 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                >
                  {[5, 10, 20].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={history.page <= 1}
                onClick={() => onPageChange(history.page - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                {t("pagination.page", {
                  page: history.page,
                  total: history.totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={history.page >= history.totalPages}
                onClick={() => onPageChange(history.page + 1)}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {hasHistory
              ? t("empty.noMatchesTitle")
              : t("empty.noRecordsTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasHistory
              ? t("empty.noMatchesDescription")
              : t("empty.noRecordsDescription")}
          </p>
          {hasHistory && hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd dir="auto" className="break-words text-end tabular-nums">
        {value}
      </dd>
    </div>
  );
}
