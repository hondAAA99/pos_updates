"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Expense } from "../types/expense";

type DeleteExpenseSheetProps = {
  expense: Expense | null;
  isDeleting: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteExpenseSheet({
  expense,
  isDeleting,
  error,
  onOpenChange,
  onConfirm,
}: DeleteExpenseSheetProps) {
  const t = useTranslations("expenses");
  const locale = useLocale();

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
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="relative border-b border-border p-6 pe-14">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.close")}
            title={t("actions.close")}
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="absolute end-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("delete.title")}</SheetTitle>
          <SheetDescription>
            {t("delete.description", { name: expense?.expenseName ?? "" })}
          </SheetDescription>
        </SheetHeader>
        {error && (
          <p role="alert" className="mx-6 mt-5 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <SheetFooter className="flex-row justify-end p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {t("actions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
