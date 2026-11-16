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
import { formatCurrency, formatNumber } from "@/lib/format";
import type { StockRecord } from "../types/stock";

type StockDetailsSheetProps = {
  stock: StockRecord | null;
  canEdit: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (stock: StockRecord) => void;
  onDelete: (stock: StockRecord) => void;
};

export function StockDetailsSheet({
  stock,
  canEdit,
  canDelete,
  onOpenChange,
  onEdit,
  onDelete,
}: StockDetailsSheetProps) {
  const t = useTranslations("inventory");
  const locale = useLocale() === "ar" ? "ar" : "en";

  return (
    <Sheet
      open={stock !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {stock && (
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
                {stock.product_id?.productName ?? t("details.notAvailable")}
              </SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail
                label={t("table.serialNumber")}
                value={
                  stock.product_id?.serialNumber ?? t("details.notAvailable")
                }
                dir="auto"
              />
              <Detail
                label={t("details.productId")}
                value={stock.product_id?._id ?? t("details.notAvailable")}
                dir="ltr"
                mono
              />
              <Detail
                label={t("table.quantity")}
                value={formatNumber(stock.total_quantity, locale)}
              />
              <Detail
                label={t("table.sellingPrice")}
                value={formatCurrency(
                  stock.current_selling_price_per_piece,
                  locale,
                )}
              />
              <Detail
                label={t("table.wholesalePrice")}
                value={formatCurrency(
                  stock.current_wholesale_price_per_piece,
                  locale,
                )}
              />
              <Detail
                label={t("table.purchasePrice")}
                value={formatCurrency(
                  stock.current_purchase_price_per_piece,
                  locale,
                )}
              />
            </dl>
            {(canEdit || canDelete) && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(stock)}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("actions.delete")}
                  </Button>
                )}
                {canEdit && (
                  <Button type="button" onClick={() => onEdit(stock)}>
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
  dir,
  mono = false,
}: {
  label: string;
  value: string;
  dir?: "auto" | "ltr";
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd
        dir={dir}
        className={mono ? "break-all font-mono text-xs" : "text-sm"}
      >
        {value}
      </dd>
    </div>
  );
}
