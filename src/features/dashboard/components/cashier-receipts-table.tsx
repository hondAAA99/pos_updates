"use client";

import { Eye, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { CashierReceipt } from "../types/cashier-dashboard";

type CashierReceiptsTableProps = {
  receipts: CashierReceipt[];
  locale: Locale;
  onView: (receipt: CashierReceipt) => void;
};

export function CashierReceiptsTable({
  receipts,
  locale,
  onView,
}: CashierReceiptsTableProps) {
  const t = useTranslations("cashierDashboard");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="border-b border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{t("receipts.title")}</CardTitle>
            <CardDescription>{t("receipts.description")}</CardDescription>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t("receipts.count", { count: receipts.length })}
          </span>
        </div>
      </CardHeader>

      {receipts.length > 0 ? (
        <CardContent className="p-0">
          <table className="w-full table-fixed text-start text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th scope="col" className="w-[18%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.reference")}
                </th>
                <th scope="col" className="w-[12%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.time")}
                </th>
                <th scope="col" className="w-[16%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.amount")}
                </th>
                <th scope="col" className="w-[14%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.paymentMethod")}
                </th>
                <th scope="col" className="w-[14%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.status")}
                </th>
                <th scope="col" className="w-[18%] px-5 py-3.5 text-start font-medium">
                  {t("receipts.salesman")}
                </th>
                <th scope="col" className="w-[8%] px-3 py-3.5 text-end font-medium">
                  {t("receipts.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receipts.map((receipt) => (
                <tr
                  key={receipt._id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <th scope="row" dir="ltr" className="px-5 py-4 text-start font-medium">
                    {receipt.referenceNumber}
                  </th>
                  <td dir="ltr" className="px-5 py-4 text-muted-foreground">
                    {formatDate(receipt.timestamp, locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td dir="ltr" className="px-5 py-4 font-medium">
                    {formatCurrency(receipt.totalAmount, locale)}
                  </td>
                  <td className="px-5 py-4">
                    {t(`paymentMethods.${receipt.paymentMethod}`)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        receipt.status === "completed"
                          ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                          : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {t(`statuses.${receipt.status}`)}
                    </span>
                  </td>
                  <td className="px-5 py-4">{receipt.salesmanName}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("receipts.viewNamed", {
                          reference: receipt.referenceNumber,
                        })}
                        title={t("receipts.view")}
                        onClick={() => onView(receipt)}
                      >
                        <Eye aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptText aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">{t("receipts.emptyTitle")}</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {t("receipts.emptyDescription")}
          </p>
        </div>
      )}
    </Card>
  );
}
