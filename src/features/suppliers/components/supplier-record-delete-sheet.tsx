"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SupplierFinancialRecord } from "../types/supplier-financial-record";

export function SupplierRecordDeleteSheet({
  kind,
  record,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  kind: "deposits" | "transactions";
  record: SupplierFinancialRecord | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("supplierRecords");
  const locale = useLocale();

  return (
    <Sheet
      open={record !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        {record && (
          <>
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
                {t(
                  kind === "deposits"
                    ? "delete.depositDescription"
                    : "delete.transactionDescription",
                  {
                    supplier:
                      record.supplierId?.name ?? t("details.notAvailable"),
                  },
                )}
              </SheetDescription>
            </SheetHeader>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
