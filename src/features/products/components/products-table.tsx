"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductType } from "@/features/product-types/types/product-type";
import type { ProductDetail, ProductPage } from "../types/product";

type ProductsTableProps = {
  products: ProductPage;
  productTypes: ProductType[];
  query: string;
  productTypeId: string;
  hasProducts: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onQueryChange: (query: string) => void;
  onProductTypeChange: (id: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onAdd: () => void;
  onView: (product: ProductDetail) => void;
  onEdit: (product: ProductDetail) => void;
  onDelete: (product: ProductDetail) => void;
};

export function ProductsTable({
  products,
  productTypes,
  query,
  productTypeId,
  hasProducts,
  canCreate,
  canEdit,
  canDelete,
  onQueryChange,
  onProductTypeChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const t = useTranslations("products");
  const start = products.totalItems === 0 ? 0 : (products.page - 1) * products.pageSize + 1;
  const end = Math.min(products.page * products.pageSize, products.totalItems);
  const hasActiveFilters = Boolean(query.trim()) || productTypeId !== "all";

  function actions(product: ProductDetail) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: product.productName })}
          onClick={() => onView(product)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.editNamed", { name: product.productName })}
            onClick={() => onEdit(product)}
          >
            <Pencil aria-hidden="true" />
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.deleteNamed", { name: product.productName })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(product)}
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
              {t("filter.label")}
            </span>
            <select
              value={productTypeId}
              onChange={(event) => onProductTypeChange(event.currentTarget.value)}
              aria-label={t("filter.label")}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none"
            >
              <option value="all">{t("filter.allTypes")}</option>
              {productTypes.map((productType) => (
                <option key={productType._id} value={productType._id}>
                  {productType.name}
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
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: products.totalItems })}
        </p>
      </div>

      {products.totalItems > 0 ? (
        <>
          <CardContent className="hidden p-0 md:block">
            <table className="w-full text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-3.5 text-start font-medium">
                    {t("table.productName")}
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-start font-medium">
                    {t("table.serialNumber")}
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-start font-medium">
                    {t("table.productType")}
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-end font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.items.map((product) => (
                  <tr
                    key={product._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th
                      scope="row"
                      className="max-w-72 px-5 py-4 text-start font-medium text-foreground"
                    >
                      <span className="block truncate">{product.productName}</span>
                    </th>
                    <td dir="auto" className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {product.serialNumber}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {product.productType?.name ?? t("unknownProductType")}
                    </td>
                    <td className="px-4 py-3">{actions(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <div className="grid gap-3 p-4 md:hidden">
            {products.items.map((product) => (
              <article
                key={product._id}
                className="min-w-0 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-sm font-semibold">
                    {product.productName}
                  </h2>
                  {actions(product)}
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">
                      {t("table.serialNumber")}
                    </dt>
                    <dd dir="auto" className="break-all font-mono text-xs">
                      {product.serialNumber}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">
                      {t("table.productType")}
                    </dt>
                    <dd className="text-end">
                      {product.productType?.name ?? t("unknownProductType")}
                    </dd>
                  </div>
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
                  total: products.totalItems,
                })}
              </span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={products.pageSize}
                  onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
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
                disabled={products.page <= 1}
                onClick={() => onPageChange(products.page - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                {t("pagination.page", {
                  page: products.page,
                  total: products.totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={products.page >= products.totalPages}
                onClick={() => onPageChange(products.page + 1)}
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
            {hasProducts ? t("empty.noMatchesTitle") : t("empty.noRecordsTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasProducts
              ? t("empty.noMatchesDescription")
              : t("empty.noRecordsDescription")}
          </p>
          {hasProducts && hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          ) : !hasProducts && canCreate ? (
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
