"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { Expense, ExpensePage } from "../types/expense";

type ExpensesTableProps = {
  expenses: ExpensePage;
  timestamp: string;
  isLoading: boolean;
  canManage: boolean;
  onTimestampChange: (value: string) => void;
  onClearFilter: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onAdd: () => void;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

function displayTimestamp(value: string, locale: Locale): string {
  return Number.isFinite(new Date(value).getTime())
    ? formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

export function ExpensesTable({
  expenses,
  timestamp,
  isLoading,
  canManage,
  onTimestampChange,
  onClearFilter,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const t = useTranslations("expenses");
  const locale = useLocale() as Locale;
  const { currentPage, limit, totalDoc, totalPages } = expenses.meta;
  const start = totalDoc === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalDoc);

  function actions(expense: Expense) {
    return (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: expense.expenseName })}
          title={t("actions.view")}
          onClick={() => onView(expense)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {canManage && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("actions.editNamed", { name: expense.expenseName })}
              title={t("actions.edit")}
              onClick={() => onEdit(expense)}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("actions.deleteNamed", { name: expense.expenseName })}
              title={t("actions.delete")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(expense)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span>{t("filter.timestampLabel")}</span>
            <Input
              type="date"
              value={timestamp}
              onChange={(event) => onTimestampChange(event.currentTarget.value)}
              className="w-auto"
              aria-label={t("filter.timestampLabel")}
            />
          </label>
          {timestamp && (
            <Button type="button" variant="ghost" onClick={onClearFilter}>
              {t("actions.clearFilter")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("resultsCount", { count: totalDoc })}
          </p>
          {canManage && (
            <Button type="button" onClick={onAdd}>
              <Plus aria-hidden="true" />
              {t("actions.add")}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex min-h-64 items-center justify-center px-6 py-10 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {t("states.loading")}
        </div>
      ) : expenses.data.length > 0 ? (
        <>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="w-[22%] px-6 py-3.5 text-start font-medium">
                    {t("table.name")}
                  </th>
                  <th scope="col" className="w-[34%] px-6 py-3.5 text-start font-medium">
                    {t("table.detail")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[16%] px-6 py-3.5 font-medium">
                    {t("table.price")}
                  </th>
                  <th scope="col" className="w-[20%] px-6 py-3.5 text-start font-medium">
                    {t("table.timestamp")}
                  </th>
                  <th scope="col" data-column-align="actions" className="w-36 px-6 py-3.5 font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.data.map((expense) => (
                  <tr
                    key={expense._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th scope="row" className="px-6 py-4 text-start font-medium">
                      <span className="block break-words">{expense.expenseName}</span>
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="block line-clamp-2 break-words">
                        {expense.expenseDetail}
                      </span>
                    </td>
                    <td dir="ltr" data-column-align="center" className="px-6 py-4 tabular-nums">
                      {formatCurrency(expense.price, locale)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {displayTimestamp(expense.timestamp, locale)}
                    </td>
                    <td data-column-align="actions" className="px-6 py-3">{actions(expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{t("pagination.showing", { start, end, total: totalDoc })}</span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={limit}
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
            {timestamp ? t("empty.noMatchesTitle") : t("empty.noExpensesTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {timestamp
              ? t("empty.noMatchesDescription")
              : t("empty.noExpensesDescription")}
          </p>
          {timestamp && (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilter}
            >
              {t("actions.clearFilter")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
