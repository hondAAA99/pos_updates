"use client";

import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { ReceiptPrintData } from "../services/receipt-adapter";
import { ReceiptPresentation } from "./receipt-presentation";

type ReceiptPrintDocumentProps = {
  receipt: ReceiptPrintData;
  locale: Locale;
};

export function ReceiptPrintDocument({
  receipt,
  locale,
}: ReceiptPrintDocumentProps) {
  const common = useTranslations("common");
  const t = useTranslations("cashierDashboard");

  return (
    <article
      className="receipt-print-root hidden print:block"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <header className="mb-6 border-b border-border pb-4 text-center">
        <h1 className="text-xl font-bold">{common("appTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("receipts.printTitle")}
        </p>
      </header>
      <ReceiptPresentation receipt={receipt} locale={locale} />
    </article>
  );
}
