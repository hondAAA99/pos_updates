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
import type { TransferItem } from "../types/transfer";

type DeleteTransferSheetProps = {
  transfer: TransferItem | null;
  branchName: string;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteTransferSheet({
  transfer,
  branchName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteTransferSheetProps) {
  const t = useTranslations("transfers");
  const locale = useLocale();

  return (
    <Sheet
      open={transfer !== null}
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
            className="absolute end-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("delete.title")}</SheetTitle>
          <SheetDescription>
            {t("delete.description", {
              product:
                transfer?.productId?.productName ??
                t("details.notAvailable"),
              branch: branchName,
            })}
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
      </SheetContent>
    </Sheet>
  );
}
