"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/format";
import type {
  TransferBranchReference,
  TransferItem,
  TransferPage,
  TransferProductReference,
} from "../types/transfer";

type TransfersTableProps = {
  transfers: TransferPage;
  branches: TransferBranchReference[];
  products: TransferProductReference[];
  branchId: string;
  productId: string;
  filtersDisabled: boolean;
  canAdd: boolean;
  addDisabled: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onBranchChange: (id: string) => void;
  onProductChange: (id: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onAdd: () => void;
  onView: (transfer: TransferItem) => void;
  onEdit: (transfer: TransferItem) => void;
  onDelete: (transfer: TransferItem) => void;
};

export function TransfersTable({
  transfers,
  branches,
  products,
  branchId,
  productId,
  filtersDisabled,
  canAdd,
  addDisabled,
  canEdit,
  canDelete,
  onBranchChange,
  onProductChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: TransfersTableProps) {
  const t = useTranslations("transfers");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const start =
    transfers.totalItems === 0
      ? 0
      : (transfers.page - 1) * transfers.pageSize + 1;
  const end = Math.min(transfers.page * transfers.pageSize, transfers.totalItems);
  const hasActiveFilters = branchId !== "all" || productId !== "all";

  function getBranchName(transfer: TransferItem) {
    return (
      (transfer.branchId
        ? branches.find((branch) => branch._id === transfer.branchId?._id)?.name
        : undefined) ??
      transfer.branchId?.name ??
      t("details.notAvailable")
    );
  }

  function getTimestamp(transfer: TransferItem) {
    if (
      !transfer.timestamp ||
      Number.isNaN(new Date(transfer.timestamp).getTime())
    ) {
      return t("details.notAvailable");
    }

    return formatDate(transfer.timestamp, locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function actions(transfer: TransferItem) {
    const productName =
      transfer.productId?.productName ?? t("details.notAvailable");
    const canEditTransfer = Boolean(
      transfer.branchId?._id && transfer.productId?._id,
    );
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", {
            name: productName,
          })}
          title={t("actions.view")}
          onClick={() => onView(transfer)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canEditTransfer}
            aria-label={t("actions.editNamed", {
              name: productName,
            })}
            title={t("actions.edit")}
            onClick={() => onEdit(transfer)}
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
            title={t("actions.delete")}
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(transfer)}
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 lg:w-auto lg:min-w-56">
            <span className="shrink-0 text-sm text-muted-foreground">
              {t("filter.branch")}
            </span>
            <select
              value={branchId}
              disabled={filtersDisabled}
              onChange={(event) => onBranchChange(event.currentTarget.value)}
              aria-label={t("filter.branch")}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none"
            >
              <option value="all">{t("filter.allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 lg:w-auto lg:min-w-64">
            <span className="shrink-0 text-sm text-muted-foreground">
              {t("filter.product")}
            </span>
            <select
              value={productId}
              disabled={filtersDisabled}
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
              className="self-start lg:self-auto"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: transfers.totalItems })}
        </p>
      </div>

      {transfers.totalItems > 0 ? (
        <>
          <CardContent className="hidden p-0 2xl:block">
            <table className="w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="w-[22%] px-4 py-3.5 text-start font-medium">
                    {t("table.branch")}
                  </th>
                  <th scope="col" className="w-[27%] px-4 py-3.5 text-start font-medium">
                    {t("table.product")}
                  </th>
                  <th scope="col" className="w-[19%] px-4 py-3.5 text-start font-medium">
                    {t("table.timestamp")}
                  </th>
                  <th scope="col" className="w-[12%] px-4 py-3.5 text-end font-medium">
                    {t("table.quantity")}
                  </th>
                  <th scope="col" className="w-[20%] px-4 py-3.5 text-end font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transfers.items.map((transfer) => (
                  <tr
                    key={transfer._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th scope="row" className="px-4 py-4 text-start font-medium">
                      <span className="block break-words">
                        {getBranchName(transfer)}
                      </span>
                    </th>
                    <td className="px-4 py-4">
                      <span className="block break-words">
                        {transfer.productId?.productName ?? t("details.notAvailable")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {getTimestamp(transfer)}
                    </td>
                    <td dir="ltr" className="px-4 py-4 text-end tabular-nums">
                      {formatNumber(transfer.quantity, locale)}
                    </td>
                    <td className="px-2 py-3">{actions(transfer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <div className="grid gap-3 p-4 2xl:hidden">
            {transfers.items.map((transfer) => (
              <article
                key={transfer._id}
                className="min-w-0 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold">
                      {transfer.productId?.productName ?? t("details.notAvailable")}
                    </h2>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {getBranchName(transfer)}
                    </p>
                  </div>
                  {actions(transfer)}
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{t("table.timestamp")}</dt>
                    <dd dir="auto" className="text-end">
                      {getTimestamp(transfer)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{t("table.quantity")}</dt>
                    <dd dir="ltr" className="text-end tabular-nums">
                      {formatNumber(transfer.quantity, locale)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <footer className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("pagination.showing", { start, end, total: transfers.totalItems })}
              </span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={transfers.pageSize}
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
                disabled={transfers.page <= 1}
                onClick={() => onPageChange(transfers.page - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                {t("pagination.page", {
                  page: transfers.page,
                  total: transfers.totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={transfers.page >= transfers.totalPages}
                onClick={() => onPageChange(transfers.page + 1)}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {hasActiveFilters ? (
              <Search aria-hidden="true" className="size-5" />
            ) : (
              <Plus aria-hidden="true" className="size-5" />
            )}
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {hasActiveFilters
              ? t("empty.noMatchesTitle")
              : t("empty.noTransfersTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasActiveFilters
              ? t("empty.noMatchesDescription")
              : t("empty.noTransfersDescription")}
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          ) : canAdd ? (
            <Button
              type="button"
              className="mt-5"
              onClick={onAdd}
              disabled={addDisabled}
            >
              <Plus aria-hidden="true" />
              {t("actions.new")}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
