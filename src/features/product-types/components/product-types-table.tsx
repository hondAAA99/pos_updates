"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type {
  ProductType,
  ProductTypeSortKey,
  SortDirection,
} from "../types/product-type";

type ProductTypesTableProps = {
  productTypes: ProductType[];
  query: string;
  sortKey: ProductTypeSortKey;
  sortDirection: SortDirection;
  hasProductTypes: boolean;
  canCreate: boolean;
  canManage: boolean;
  onQueryChange: (query: string) => void;
  onSort: (key: ProductTypeSortKey) => void;
  onAdd: () => void;
  onEdit: (productType: ProductType) => void;
  onDelete: (productType: ProductType) => void;
};

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) return <ArrowUpDown aria-hidden="true" className="size-3.5" />;
  return direction === "ascending" ? (
    <ArrowUp aria-hidden="true" className="size-3.5" />
  ) : (
    <ArrowDown aria-hidden="true" className="size-3.5" />
  );
}

export function ProductTypesTable({
  productTypes,
  query,
  sortKey,
  sortDirection,
  hasProductTypes,
  canCreate,
  canManage,
  onQueryChange,
  onSort,
  onAdd,
  onEdit,
  onDelete,
}: ProductTypesTableProps) {
  const t = useTranslations("productTypes");
  const activeLocale = useLocale() === "ar" ? "ar" : "en";

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <label className="relative block w-full sm:max-w-sm">
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
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: productTypes.length })}
        </p>
      </div>

      {productTypes.length > 0 ? (
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[42rem] text-start text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th scope="col" aria-sort={sortKey === "name" ? sortDirection : "none"} className="px-5 py-3.5 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => onSort("name")}
                    className="inline-flex items-center gap-2 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("table.name")}
                    <SortIndicator active={sortKey === "name"} direction={sortDirection} />
                  </button>
                </th>
                <th scope="col" className="px-5 py-3.5 text-start font-medium">
                  {t("table.id")}
                </th>
                <th scope="col" aria-sort={sortKey === "createdAt" ? sortDirection : "none"} className="px-5 py-3.5 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => onSort("createdAt")}
                    className="inline-flex items-center gap-2 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("table.createdAt")}
                    <SortIndicator active={sortKey === "createdAt"} direction={sortDirection} />
                  </button>
                </th>
                {canManage && (
                  <th scope="col" className="px-5 py-3.5 text-end font-medium">
                    {t("table.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productTypes.map((productType) => (
                <tr key={productType._id} className="transition-colors hover:bg-muted/30">
                  <th scope="row" className="px-5 py-4 text-start font-medium text-foreground">
                    {productType.name}
                  </th>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {productType._id}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {productType.createdAt
                      ? formatDate(productType.createdAt, activeLocale, {
                          dateStyle: "medium",
                        })
                      : "—"}
                  </td>
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("actions.editNamed", { name: productType.name })}
                              onClick={() => onEdit(productType)}
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("actions.deleteNamed", { name: productType.name })}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => onDelete(productType)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {hasProductTypes ? t("empty.noMatchesTitle") : t("empty.noRecordsTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasProductTypes ? t("empty.noMatchesDescription") : t("empty.noRecordsDescription")}
          </p>
          {!hasProductTypes && canCreate && (
            <Button type="button" onClick={onAdd} className="mt-5">
              <Plus aria-hidden="true" />
              {t("actions.add")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
