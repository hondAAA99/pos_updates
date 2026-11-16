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
import type { SupplierListItem } from "../types/supplier";

type DeleteSupplierSheetProps = {
  supplier: SupplierListItem | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteSupplierSheet({
  supplier,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteSupplierSheetProps) {
  const t = useTranslations("suppliers");
  const locale = useLocale();

  return (
    <Sheet
      open={supplier !== null}
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
            {t("delete.description", { name: supplier?.name ?? "" })}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex-row justify-end p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
