"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SupplierListItem, SupplierPage } from "../types/supplier";

type SuppliersTableProps = {
  suppliers: SupplierPage;
  phoneNumber: string;
  hasSuppliers: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPhoneNumberChange: (value: string) => void;
  onClearFilter: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onAdd: () => void;
  onView: (supplier: SupplierListItem) => void;
  onEdit: (supplier: SupplierListItem) => void;
  onDelete: (supplier: SupplierListItem) => void;
};

export function SuppliersTable({
  suppliers,
  phoneNumber,
  hasSuppliers,
  canCreate,
  canUpdate,
  canDelete,
  onPhoneNumberChange,
  onClearFilter,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: SuppliersTableProps) {
  const t = useTranslations("suppliers");
  const { currentPage, limit, totalDoc, totalPages } = suppliers.meta;
  const start = totalDoc === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalDoc);

  function actions(supplier: SupplierListItem) {
    return (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: supplier.name })}
          title={t("actions.view")}
          onClick={() => onView(supplier)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {canUpdate && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.editNamed", { name: supplier.name })}
            title={t("actions.edit")}
            onClick={() => onEdit(supplier)}
          >
            <Pencil aria-hidden="true" />
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.deleteNamed", { name: supplier.name })}
            title={t("actions.delete")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(supplier)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-5 border-b border-border p-5">
        <div className="flex flex-1 items-center gap-3">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">{t("search.label")}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={phoneNumber}
              onChange={(event) =>
                onPhoneNumberChange(event.currentTarget.value)
              }
              placeholder={t("search.placeholder")}
              className="ps-9"
            />
          </label>
          {phoneNumber && (
            <Button type="button" variant="ghost" onClick={onClearFilter}>
              {t("actions.clearFilter")}
            </Button>
          )}
        </div>
        <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: totalDoc })}
        </p>
      </div>

      {suppliers.data.length > 0 ? (
        <>
          <CardContent className="p-0">
            <table className="w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="px-6 py-3.5 text-start font-medium">
                    {t("table.name")}
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-start font-medium">
                    {t("table.phoneNumber")}
                  </th>
                  <th scope="col" className="w-40 px-6 py-3.5 text-end font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.data.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th scope="row" className="px-6 py-4 text-start font-medium">
                      <span className="block break-words">{supplier.name}</span>
                    </th>
                    <td dir="auto" className="px-6 py-4 text-muted-foreground">
                      {supplier.phoneNumber}
                    </td>
                    <td className="px-6 py-3">{actions(supplier)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <footer className="flex items-center justify-between gap-6 border-t border-border px-6 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{t("pagination.showing", { start, end, total: totalDoc })}</span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={limit}
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
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                {t("pagination.page", { page: currentPage, total: totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
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
            {hasSuppliers ? t("empty.noMatchesTitle") : t("empty.noSuppliersTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasSuppliers
              ? t("empty.noMatchesDescription")
              : t("empty.noSuppliersDescription")}
          </p>
          {hasSuppliers && phoneNumber ? (
            <Button type="button" variant="outline" className="mt-5" onClick={onClearFilter}>
              {t("actions.clearFilter")}
            </Button>
          ) : !hasSuppliers && canCreate ? (
            <Button type="button" className="mt-5" onClick={onAdd}>
              <Plus aria-hidden="true" />
              {t("actions.add")}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
