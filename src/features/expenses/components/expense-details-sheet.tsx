"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { Expense } from "../types/expense";

type ExpenseDetailsSheetProps = {
  expense: Expense | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

export function ExpenseDetailsSheet({
  expense,
  canManage,
  onOpenChange,
  onEdit,
  onDelete,
}: ExpenseDetailsSheetProps) {
  const t = useTranslations("expenses");
  const locale = useLocale() as Locale;

  return (
    <Sheet
      open={expense !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {expense && (
          <>
            <SheetHeader className="relative border-b border-border p-6 pe-14">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("actions.close")}
                title={t("actions.close")}
                onClick={() => onOpenChange(false)}
                className="absolute end-3 top-3"
              >
                <X aria-hidden="true" />
              </Button>
              <SheetTitle>{expense.expenseName}</SheetTitle>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail label={t("table.name")} value={expense.expenseName} />
              <Detail label={t("table.detail")} value={expense.expenseDetail} />
              <Detail
                label={t("table.price")}
                value={formatCurrency(expense.price, locale)}
                direction="ltr"
              />
              <Detail
                label={t("table.timestamp")}
                value={
                  Number.isFinite(new Date(expense.timestamp).getTime())
                    ? formatDate(expense.timestamp, locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : t("states.notAvailable")
                }
              />
              <Detail label={t("details.id")} value={expense._id} direction="ltr" />
            </dl>
            {canManage && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(expense)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("actions.delete")}
                </Button>
                <Button type="button" onClick={() => onEdit(expense)}>
                  <Pencil aria-hidden="true" />
                  {t("actions.edit")}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction?: "auto" | "ltr";
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd dir={direction} className="break-words text-sm">
        {value}
      </dd>
    </div>
  );
}
