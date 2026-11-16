"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Expense, ExpenseInput } from "../types/expense";

type ExpenseFormSheetProps = {
  open: boolean;
  expense: Expense | null;
  isSubmitting: boolean;
  submissionError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpenseInput) => Promise<void>;
};

function toLocalDateTimeValue(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ExpenseFormSheet({
  open,
  expense,
  isSubmitting,
  submissionError,
  onOpenChange,
  onSubmit,
}: ExpenseFormSheetProps) {
  const t = useTranslations("expenses");
  const locale = useLocale();
  const [expenseName, setExpenseName] = useState(expense?.expenseName ?? "");
  const [expenseDetail, setExpenseDetail] = useState(expense?.expenseDetail ?? "");
  const [price, setPrice] = useState(
    expense ? String(expense.price) : "",
  );
  const [timestamp, setTimestamp] = useState(
    toLocalDateTimeValue(expense?.timestamp),
  );
  const [errors, setErrors] = useState({
    expenseName: false,
    expenseDetail: false,
    price: false,
    timestamp: false,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Number(price);
    const nextErrors = {
      expenseName: !expenseName.trim(),
      expenseDetail: !expenseDetail.trim(),
      price: !Number.isFinite(parsedPrice) || parsedPrice <= 0,
      timestamp: !timestamp || !Number.isFinite(new Date(timestamp).getTime()),
    };

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    void onSubmit({
      expenseName: expenseName.trim(),
      expenseDetail: expenseDetail.trim(),
      price: parsedPrice,
      timestamp: new Date(timestamp).toISOString(),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <form noValidate onSubmit={handleSubmit} className="flex min-h-full flex-col">
          <SheetHeader className="relative border-b border-border p-6 pe-14">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("actions.close")}
              title={t("actions.close")}
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>
              {expense ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("form.description")}</SheetDescription>
          </SheetHeader>
          {submissionError && (
            <p role="alert" className="mx-6 mt-5 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submissionError}
            </p>
          )}
          <div className="space-y-5 p-6">
            <Field
              id="expense-name"
              label={t("form.nameLabel")}
              error={errors.expenseName}
              errorMessage={t("form.validation.nameRequired")}
            >
              <Input
                id="expense-name"
                name="expenseName"
                autoFocus
                value={expenseName}
                disabled={isSubmitting}
                onChange={(event) => {
                  setExpenseName(event.currentTarget.value);
                  setErrors((current) => ({ ...current, expenseName: false }));
                }}
                aria-invalid={errors.expenseName}
                aria-required="true"
                aria-describedby={errors.expenseName ? "expense-name-error" : undefined}
                placeholder={t("form.namePlaceholder")}
              />
            </Field>
            <Field
              id="expense-detail"
              label={t("form.detailLabel")}
              error={errors.expenseDetail}
              errorMessage={t("form.validation.detailRequired")}
            >
              <textarea
                id="expense-detail"
                name="expenseDetail"
                rows={4}
                value={expenseDetail}
                disabled={isSubmitting}
                onChange={(event) => {
                  setExpenseDetail(event.currentTarget.value);
                  setErrors((current) => ({ ...current, expenseDetail: false }));
                }}
                aria-invalid={errors.expenseDetail}
                aria-required="true"
                aria-describedby={errors.expenseDetail ? "expense-detail-error" : undefined}
                placeholder={t("form.detailPlaceholder")}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>
            <Field
              id="expense-price"
              label={t("form.priceLabel")}
              error={errors.price}
              errorMessage={t("form.validation.priceInvalid")}
            >
              <Input
                id="expense-price"
                name="price"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={price}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPrice(event.currentTarget.value);
                  setErrors((current) => ({ ...current, price: false }));
                }}
                aria-invalid={errors.price}
                aria-required="true"
                aria-describedby={errors.price ? "expense-price-error" : undefined}
                placeholder={t("form.pricePlaceholder")}
              />
            </Field>
            <Field
              id="expense-timestamp"
              label={t("form.timestampLabel")}
              error={errors.timestamp}
              errorMessage={t("form.validation.timestampRequired")}
            >
              <Input
                id="expense-timestamp"
                name="timestamp"
                type="datetime-local"
                value={timestamp}
                disabled={isSubmitting}
                onChange={(event) => {
                  setTimestamp(event.currentTarget.value);
                  setErrors((current) => ({ ...current, timestamp: false }));
                }}
                aria-invalid={errors.timestamp}
                aria-required="true"
                aria-describedby={errors.timestamp ? "expense-timestamp-error" : undefined}
                dir="ltr"
              />
            </Field>
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {expense ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  id,
  label,
  error,
  errorMessage,
  children,
}: {
  id: string;
  label: string;
  error: boolean;
  errorMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
