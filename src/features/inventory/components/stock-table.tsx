"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { ProductDetail } from "@/features/products/types/product";
import { withStockProductDetails } from "../services/stock-service";
import type { StockPage, StockRecord } from "../types/stock";

type StockTableProps = {
  stocks: StockPage;
  products: ProductDetail[];
  query: string;
  productId: string;
  hasStock: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onQueryChange: (query: string) => void;
  onProductChange: (id: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onAdd: () => void;
  onView: (stock: StockRecord) => void;
  onEdit: (stock: StockRecord) => void;
  onDelete: (stock: StockRecord) => void;
};

export function StockTable({
  stocks,
  products,
  query,
  productId,
  hasStock,
  canCreate,
  canEdit,
  canDelete,
  onQueryChange,
  onProductChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: StockTableProps) {
  const t = useTranslations("inventory");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const start =
    stocks.totalItems === 0 ? 0 : (stocks.page - 1) * stocks.pageSize + 1;
  const end = Math.min(stocks.page * stocks.pageSize, stocks.totalItems);
  const hasActiveFilters = Boolean(query.trim()) || productId !== "all";
  const displayStocks = stocks.items.map((stock) =>
    withStockProductDetails(stock, products),
  );

  function actions(stock: StockRecord) {
    const productName = stock.product_id?.productName ?? t("details.notAvailable");
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", {
            name: productName,
          })}
          onClick={() => onView(stock)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.editNamed", {
              name: productName,
            })}
            onClick={() => onEdit(stock)}
          >
            <Pencil aria-hidden="true" />
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.deleteNamed", {
              name: productName,
            })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(stock)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
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
            count: query.trim() ? stocks.items.length : stocks.totalItems,
          })}
        </p>
      </div>

      {stocks.totalItems > 0 ? (
        <>
          <CardContent className="hidden p-0 xl:block">
            <table className="w-full table-fixed text-start text-xs">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="w-[21%] px-3 py-3.5 text-start font-medium">
                    {t("table.product")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[13%] px-2 py-3.5 font-medium">
                    {t("table.serialNumber")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[9%] px-2 py-3.5 font-medium">
                    {t("table.quantity")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[14%] px-2 py-3.5 font-medium">
                    {t("table.sellingPrice")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[14%] px-2 py-3.5 font-medium">
                    {t("table.wholesalePrice")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[14%] px-2 py-3.5 font-medium">
                    {t("table.purchasePrice")}
                  </th>
                  <th scope="col" data-column-align="actions" className="w-[15%] px-2 py-3.5 font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayStocks.map((stock) => (
                  <tr
                    key={stock._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th scope="row" className="px-3 py-4 text-start font-medium">
                      <span className="block break-words">
                        {stock.product_id?.productName ?? t("details.notAvailable")}
                      </span>
                    </th>
                    <td
                      dir="auto"
                      data-column-align="center"
                      className="break-all px-2 py-4 font-mono text-[1rem] text-muted-foreground"
                    >
                      {stock.product_id?.serialNumber ?? t("details.notAvailable")}
                    </td>
                    <td dir="ltr" data-column-align="center" className="px-2 py-4 tabular-nums">
                      {formatNumber(stock.total_quantity, locale)}
                    </td>
                    <MoneyCell
                      value={stock.current_selling_price_per_piece}
                      locale={locale}
                    />
                    <MoneyCell
                      value={stock.current_wholesale_price_per_piece}
                      locale={locale}
                    />
                    <MoneyCell
                      value={stock.current_purchase_price_per_piece}
                      locale={locale}
                    />
                    <td data-column-align="actions" className="px-2 py-3">{actions(stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <div className="grid gap-3 p-4 xl:hidden">
            {displayStocks.map((stock) => (
              <article
                key={stock._id}
                className="min-w-0 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words text-sm font-semibold">
                    {stock.product_id?.productName ?? t("details.notAvailable")}
                  </h2>
                  {actions(stock)}
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <MobileDetail
                    label={t("table.serialNumber")}
                    value={stock.product_id?.serialNumber ?? t("details.notAvailable")}
                    dir="auto"
                  />
                  <MobileDetail
                    label={t("table.quantity")}
                    value={formatNumber(stock.total_quantity, locale)}
                  />
                  <MobileDetail
                    label={t("table.sellingPrice")}
                    value={formatCurrency(
                      stock.current_selling_price_per_piece,
                      locale,
                    )}
                  />
                  <MobileDetail
                    label={t("table.wholesalePrice")}
                    value={formatCurrency(
                      stock.current_wholesale_price_per_piece,
                      locale,
                    )}
                  />
                  <MobileDetail
                    label={t("table.purchasePrice")}
                    value={formatCurrency(
                      stock.current_purchase_price_per_piece,
                      locale,
                    )}
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
                  total: stocks.totalItems,
                })}
              </span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={stocks.pageSize}
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
                disabled={stocks.page <= 1}
                onClick={() => onPageChange(stocks.page - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                {t("pagination.page", {
                  page: stocks.page,
                  total: stocks.totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={stocks.page >= stocks.totalPages}
                onClick={() => onPageChange(stocks.page + 1)}
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
            {hasStock ? t("empty.noMatchesTitle") : t("empty.noRecordsTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasStock
              ? t("empty.noMatchesDescription")
              : t("empty.noRecordsDescription")}
          </p>
          {hasStock && hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          ) : !hasStock && canCreate ? (
            <Button type="button" onClick={onAdd} className="mt-5">
              <Plus aria-hidden="true" />
              {t("actions.add")}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function MoneyCell({ value, locale }: { value: number; locale: Locale }) {
  return (
    <td dir="ltr" data-column-align="center" className="break-words px-2 py-4 tabular-nums">
      {formatCurrency(value, locale)}
    </td>
  );
}

function MobileDetail({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "auto";
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd dir={dir} className="break-words text-end tabular-nums">
        {value}
      </dd>
    </div>
  );
}
