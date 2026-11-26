"use client";

import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { formatCurrency, formatDate } from "@/lib/format";

export type ReceiptPrintDocumentData = {
  referenceNumber: string;
  timestamp?: string;
  salesmanName?: string;
  clientName?: string;
  clientPhoneNumber?: string;
  paymentMethod?: string;
  comments?: string;
  subtotal?: number;
  items: Array<{
    productId?: string;
    productName?: string;
    serialNumber?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
};

type ReceiptPrintDocumentProps = {
  receipt: ReceiptPrintDocumentData;
  locale: Locale;
};

export function ReceiptPrintDocument({
  receipt,
  locale,
}: ReceiptPrintDocumentProps) {
  const common = useTranslations("common");
  const t = useTranslations("cashierDashboard");
  const workflow = useTranslations("saleWorkflow");
  const paymentMethodLabels: Record<string, string> = {
    cash: t("paymentMethods.cash"),
    card: t("paymentMethods.card"),
    mobileWallet: t("paymentMethods.mobileWallet"),
    wallet: t("paymentMethods.wallet"),
  };
  const paymentMethodLabel = receipt.paymentMethod
    ? paymentMethodLabels[receipt.paymentMethod] ?? receipt.paymentMethod
    : undefined;

  return (
    <article
      className="receipt-print-root hidden print:block"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <header className="receipt-print-header">
        <h1>{common("appTitle")}</h1>
        <p>{t("receipts.printTitle")}</p>
      </header>
      <section className="receipt-print-meta">
        <ReceiptField
          label={t("receipts.reference")}
          value={receipt.referenceNumber}
          direction="ltr"
        />
        {receipt.timestamp && (
          <ReceiptField
            label={t("receipts.dateTime")}
            value={formatDate(receipt.timestamp, locale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        )}
        {receipt.salesmanName && (
          <ReceiptField
            label={workflow("salesman")}
            value={receipt.salesmanName}
          />
        )}
        {receipt.clientName && (
          <ReceiptField
            label={workflow("clientName")}
            value={receipt.clientName}
          />
        )}
        {receipt.clientPhoneNumber && (
          <ReceiptField
            label={workflow("clientPhone")}
            value={receipt.clientPhoneNumber}
            direction="ltr"
          />
        )}
        {paymentMethodLabel && (
          <ReceiptField
            label={t("receipts.paymentMethod")}
            value={paymentMethodLabel}
          />
        )}
      </section>

      <section className="receipt-print-items">
        <h2>{t("receipts.itemsTitle")}</h2>
        {receipt.items.map((item, index) => (
          <div
            className="receipt-print-item"
            key={item.productId ?? item.serialNumber ?? index}
          >
            <div className="receipt-print-item-main">
              <span className="receipt-print-product">
                {item.productName}
              </span>
              {item.lineTotal !== undefined && (
                <span dir="ltr">{formatCurrency(item.lineTotal, locale)}</span>
              )}
            </div>
            {(item.quantity !== undefined ||
              item.unitPrice !== undefined ||
              item.serialNumber) && (
              <div className="receipt-print-item-details">
                {item.serialNumber && (
                  <span dir="ltr">{item.serialNumber}</span>
                )}
                {item.quantity !== undefined && (
                  <span>
                    {t("receipts.quantity")}: {item.quantity}
                  </span>
                )}
                {item.unitPrice !== undefined && (
                  <span dir="ltr">
                    {t("receipts.unitPrice")}:{" "}
                    {formatCurrency(item.unitPrice, locale)}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </section>

      {receipt.subtotal !== undefined && (
        <section className="receipt-print-total">
          <ReceiptField
            label={workflow("receipt.receiptPrice")}
            value={formatCurrency(receipt.subtotal, locale)}
            direction="ltr"
          />
        </section>
      )}

      {receipt.comments && (
        <section className="receipt-print-comments">
          <h2>{t("receipts.comments")}</h2>
          <p>{receipt.comments}</p>
        </section>
      )}
    </article>
  );
}

function ReceiptField({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction?: "ltr";
}) {
  return (
    <div className="receipt-print-field">
      <span>{label}</span>
      <span dir={direction}>{value}</span>
    </div>
  );
}
