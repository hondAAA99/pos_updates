"use client";

import { Pencil, Trash2, X } from "lucide-react";
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
import {
  formatCurrency,
  formatDate as formatLocalizedDate,
} from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { SupplierFinancialRecord } from "../types/supplier-financial-record";

type SupplierRecordDetailsSheetProps = {
  kind: "deposits" | "transactions";
  record: SupplierFinancialRecord | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (record: SupplierFinancialRecord) => void;
  onDelete: (record: SupplierFinancialRecord) => void;
};

function formatDate(value: string, locale: Locale, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return formatLocalizedDate(date, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SupplierRecordDetailsSheet({
  kind,
  record,
  canManage,
  onOpenChange,
  onEdit,
  onDelete,
}: SupplierRecordDetailsSheetProps) {
  const t = useTranslations("supplierRecords");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const isDeposit = kind === "deposits";

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
                {isDeposit
                  ? t("depositDetails.title")
                  : t("transactionDetails.title")}
              </SheetTitle>
              <SheetDescription>
                {record.supplierId?.name ?? t("details.notAvailable")} ·{" "}
                {record.supplierId?.phoneNumber ?? t("details.notAvailable")}
              </SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail
                label={t("fields.supplier")}
                value={record.supplierId?.name ?? t("details.notAvailable")}
              />
              <Detail
                label={t("fields.phoneNumber")}
                value={
                  record.supplierId?.phoneNumber ?? t("details.notAvailable")
                }
              />
              <Detail
                label={
                  isDeposit
                    ? t("fields.depositAmount")
                    : t("fields.transferredAmount")
                }
                value={formatCurrency(record.amount, locale)}
                direction="ltr"
              />
              {isDeposit ? (
                <Detail
                  label={t("fields.depositDate")}
                  value={formatDate(
                    record.date,
                    locale,
                    t("details.notAvailable"),
                  )}
                />
              ) : (
                <>
                  {record.timestamp && (
                    <Detail
                      label={t("fields.timestamp")}
                      value={formatDate(
                        record.timestamp,
                        locale,
                        t("details.notAvailable"),
                      )}
                    />
                  )}
                  {record.comments && (
                    <Detail
                      label={t("fields.comments")}
                      value={record.comments}
                    />
                  )}
                </>
              )}
            </dl>
            {canManage && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(record)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("actions.delete")}
                </Button>
                <Button
                  type="button"
                  onClick={() => onEdit(record)}
                  disabled={!record.supplierId?._id}
                >
                  <Pencil aria-hidden="true" />
                  {t("actions.edit")}
                </Button>
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
