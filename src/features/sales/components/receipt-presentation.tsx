"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type {
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";

export type ReceiptPresentationData = {
  referenceNumber: string;
  timestamp?: string;
  status?: ReceiptSaleStatus;
  salesmanName?: string;
  cashierName?: string;
  branchName?: string;
  paymentMethod?: ReceiptPaymentMethod;
  items?: Array<{
    productId?: string;
    productName: string;
    serialNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal?: number;
  discount?: number;
  totalAmount: number;
  totalLabel?: string;
};

type ReceiptPresentationProps = {
  receipt: ReceiptPresentationData;
  locale: Locale;
  discountControl?: ReactNode;
  paymentMethodControl?: ReactNode;
};

export function ReceiptPresentation({
  receipt,
  locale,
  discountControl,
  paymentMethodControl,
}: ReceiptPresentationProps) {
  const t = useTranslations("cashierDashboard");

  const statusVariant =
    receipt.status === "completed"
      ? "success"
      : receipt.status === "rejected"
        ? "destructive"
        : "warning";

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-5 rounded-lg border border-border bg-muted/20 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            {t("receipts.reference")}
          </p>
          <p dir="ltr" className="break-all font-mono text-sm font-semibold">
            {receipt.referenceNumber}
          </p>
        </div>
        {receipt.status && (
          <Badge variant={statusVariant} className="shrink-0">
            {t(`statuses.${receipt.status}`)}
          </Badge>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
        {receipt.timestamp && (
          <Detail
            label={t("receipts.dateTime")}
            value={formatDate(receipt.timestamp, locale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        )}
        {receipt.salesmanName && (
          <Detail label={t("receipts.salesman")} value={receipt.salesmanName} />
        )}
        {receipt.cashierName && (
          <Detail label={t("receipts.cashier")} value={receipt.cashierName} />
        )}
        {receipt.branchName && (
          <Detail label={t("receipts.branch")} value={receipt.branchName} />
        )}
        {receipt.paymentMethod && (
          <Detail
            label={t("receipts.paymentMethod")}
            value={t(`paymentMethods.${receipt.paymentMethod}`)}
          />
        )}
      </dl>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("receipts.itemsTitle")}</h2>
        {receipt.items && receipt.items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-start font-medium">
                    {t("receipts.product")}
                  </th>
                  <th className="w-24 px-3 py-3 text-end font-medium">
                    {t("receipts.quantity")}
                  </th>
                  <th className="w-36 px-3 py-3 text-end font-medium">
                    {t("receipts.unitPrice")}
                  </th>
                  <th className="w-36 px-4 py-3 text-end font-medium">
                    {t("receipts.lineTotal")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipt.items.map((item) => (
                  <tr key={item.productId ?? item.serialNumber}>
                    <th className="px-4 py-3 text-start font-medium">
                      <span className="block break-words">
                        {item.productName}
                      </span>
                      <span dir="ltr" className="text-xs text-muted-foreground">
                        {item.serialNumber}
                      </span>
                    </th>
                    <td className="px-3 py-3 text-end">{item.quantity}</td>
                    <td dir="ltr" className="px-3 py-3 text-end">
                      {formatCurrency(item.unitPrice, locale)}
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-end font-medium">
                      {formatCurrency(item.lineTotal, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            {t("receipts.itemsUnavailable")}
          </p>
        )}
      </section>

      <section className="ms-auto w-full max-w-md space-y-3 rounded-lg border border-border p-4">
        {receipt.subtotal !== undefined && (
          <SummaryRow
            label={t("receipts.subtotal")}
            value={formatCurrency(receipt.subtotal, locale)}
          />
        )}
        {receipt.discount !== undefined && (
          <div className="flex items-center justify-between gap-5">
            <span className="text-sm text-muted-foreground">
              {t("receipts.discount")}
            </span>
            {discountControl ?? (
              <span dir="ltr" className="text-sm">
                {formatCurrency(receipt.discount, locale)}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-5 border-t border-border pt-3">
          <span className="text-base font-semibold">
            {receipt.totalLabel ?? t("receipts.total")}
          </span>
          <span dir="ltr" className="text-base font-bold">
            {formatCurrency(receipt.totalAmount, locale)}
          </span>
        </div>
      </section>

      {paymentMethodControl}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value}</dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span dir="ltr" className="text-sm">
        {value}
      </span>
    </div>
  );
}
