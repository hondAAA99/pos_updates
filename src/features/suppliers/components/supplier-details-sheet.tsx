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
import { formatCurrency } from "@/lib/format";
import type { SupplierDetail } from "../types/supplier";

type SupplierDetailsSheetProps = {
  detail: SupplierDetail | null;
  canUpdate: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (detail: SupplierDetail) => void;
  onDelete: (detail: SupplierDetail) => void;
};

export function SupplierDetailsSheet({
  detail,
  canUpdate,
  canDelete,
  onOpenChange,
  onEdit,
  onDelete,
}: SupplierDetailsSheetProps) {
  const t = useTranslations("suppliers");
  const locale = useLocale() === "ar" ? "ar" : "en";

  return (
    <Sheet
      open={detail !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {detail && (
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
              <SheetTitle>{detail.supplier.name}</SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail label={t("table.name")} value={detail.supplier.name} />
              <Detail
                label={t("table.phoneNumber")}
                value={detail.supplier.phoneNumber}
                direction="auto"
              />
              <Detail
                label={t("details.defferedAmount")}
                value={formatCurrency(detail.account.defferedAmount, locale)}
                direction="ltr"
              />
            </dl>
            {(canUpdate || canDelete) && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(detail)}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("actions.delete")}
                  </Button>
                )}
                {canUpdate && (
                  <Button type="button" onClick={() => onEdit(detail)}>
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
