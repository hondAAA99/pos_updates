"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { StockHistoryItem } from "../types/stock-history";

type StockHistoryDetailsSheetProps = {
  record: StockHistoryItem | null;
  onOpenChange: (open: boolean) => void;
};

export function StockHistoryDetailsSheet({
  record,
  onOpenChange,
}: StockHistoryDetailsSheetProps) {
  const t = useTranslations("stockHistory");
  const locale = useLocale() === "ar" ? "ar" : "en";

  function displayDate(value: string) {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      Number.isNaN(new Date(value).getTime())
    ) {
      return t("details.notAvailable");
    }

    return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
  }

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
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
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
                className="absolute end-3 top-3"
              >
                <X aria-hidden="true" />
              </Button>
              <SheetTitle>
                {record.productId?.productName ?? t("details.notAvailable")}
              </SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-7 p-6">
              <section aria-labelledby="history-product-heading">
                <h2
                  id="history-product-heading"
                  className="mb-3 text-sm font-semibold"
                >
                  {t("details.productSection")}
                </h2>
                <dl className="grid gap-4">
                  <Detail
                    label={t("table.product")}
                    value={
                      record.productId?.productName ??
                      t("details.notAvailable")
                    }
                  />
                  <Detail
                    label={t("details.productId")}
                    value={record.productId?._id ?? t("details.notAvailable")}
                    dir="ltr"
                    mono
                  />
                </dl>
              </section>
              <section aria-labelledby="history-supplier-heading">
                <h2
                  id="history-supplier-heading"
                  className="mb-3 text-sm font-semibold"
                >
                  {t("details.supplierSection")}
                </h2>
                <dl className="grid gap-4">
                  <Detail
                    label={t("table.supplier")}
                    value={record.supplierId?.name ?? t("details.notAvailable")}
                  />
                  <Detail
                    label={t("details.supplierPhone")}
                    value={
                      record.supplierId?.phoneNumber ?? t("details.notAvailable")
                    }
                    dir="auto"
                  />
                </dl>
              </section>
              <section aria-labelledby="history-entry-heading">
                <h2
                  id="history-entry-heading"
                  className="mb-3 text-sm font-semibold"
                >
                  {t("details.entrySection")}
                </h2>
                <dl className="grid gap-4">
                  <Detail
                    label={t("table.date")}
                    value={displayDate(record.timestamp)}
                  />
                  <Detail
                    label={t("table.quantity")}
                    value={formatNumber(record.quantity, locale)}
                  />
                  <Detail
                    label={t("table.batchSellingPrice")}
                    value={formatCurrency(record.batch_selling_price, locale)}
                  />
                  <Detail
                    label={t("table.batchPurchasePrice")}
                    value={formatCurrency(record.batch_purchase_price, locale)}
                  />
                  <Detail
                    label={t("table.batchWholesalePrice")}
                    value={formatCurrency(record.batch_wholesale_price, locale)}
                  />
                  <Detail
                    label={t("table.profitMargin")}
                    value={formatNumber(record.profit_margin, locale)}
                  />
                </dl>
              </section>
            </div>
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
