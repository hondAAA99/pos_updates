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
import type { ProductDetail } from "../types/product";

type ProductDetailsSheetProps = {
  product: ProductDetail | null;
  canEdit: boolean;
  canDelete: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: ProductDetail) => void;
  onDelete: (product: ProductDetail) => void;
};

export function ProductDetailsSheet({
  product,
  canEdit,
  canDelete,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductDetailsSheetProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  function close() {
    onOpenChange(false);
  }

  return (
    <Sheet
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {product && (
          <>
            <SheetHeader className="relative border-b border-border p-6 pe-14">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("actions.close")}
                title={t("actions.close")}
                onClick={close}
                className="absolute end-3 top-3"
              >
                <X aria-hidden="true" />
              </Button>
              <SheetTitle>{product.productName}</SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("table.serialNumber")}
                </dt>
                <dd dir="auto" className="font-mono text-sm">
                  {product.serialNumber}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("table.productType")}
                </dt>
                <dd className="text-sm">
                  {product.productType?.name ?? t("unknownProductType")}
                </dd>
              </div>
            </dl>
            {(canEdit || canDelete) && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("actions.delete")}
                  </Button>
                )}
                {canEdit && (
                  <Button
                    type="button"
                    onClick={() => onEdit(product)}
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
