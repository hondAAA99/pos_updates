"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, formatNumber } from "@/lib/format";
import type { TransferItem } from "../types/transfer";

type TransferDetailsSheetProps = {
  transfer: TransferItem | null;
  branchName: string;
  canEdit: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transfer: TransferItem) => void;
  onDelete: (transfer: TransferItem) => void;
};

export function TransferDetailsSheet({
  transfer,
  branchName,
  canEdit,
  canDelete,
  onOpenChange,
  onEdit,
  onDelete,
}: TransferDetailsSheetProps) {
  const t = useTranslations("transfers");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const timestamp =
    transfer?.timestamp &&
    !Number.isNaN(new Date(transfer.timestamp).getTime())
      ? formatDate(transfer.timestamp, locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : t("details.notAvailable");

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
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {transfer && (
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
              <SheetTitle>
                {transfer.productId?.productName ?? t("details.notAvailable")}
              </SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail label={t("table.branch")} value={branchName} />
              <Detail
                label={t("table.product")}
                value={
                  transfer.productId?.productName ?? t("details.notAvailable")
                }
              />
              <Detail
                label={t("details.branchId")}
                value={transfer.branchId?._id ?? t("details.notAvailable")}
                direction="ltr"
              />
              <Detail
                label={t("details.productId")}
                value={transfer.productId?._id ?? t("details.notAvailable")}
                direction="ltr"
              />
              <Detail
                label={t("table.timestamp")}
                value={timestamp}
              />
              <Detail
                label={t("table.quantity")}
                value={formatNumber(transfer.quantity, locale)}
                direction="ltr"
              />
            </dl>
            {(canEdit || canDelete) && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(transfer)}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("actions.delete")}
                  </Button>
                )}
                {canEdit && (
                  <Button
                    type="button"
                    onClick={() => onEdit(transfer)}
                    disabled={!transfer.branchId?._id || !transfer.productId?._id}
                  >
                    <Pencil aria-hidden="true" />
                    {t("actions.edit")}
                  </Button>
                )}
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
  direction = "auto",
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
