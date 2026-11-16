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
import type { Locale } from "@/i18n/routing";
import { ReceiptPresentation } from "@/features/sales/components/receipt-presentation";
import type { CashierReceipt } from "../types/cashier-dashboard";

type CashierReceiptDetailsSheetProps = {
  receipt: CashierReceipt | null;
  branchName?: string;
  cashierName?: string;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
};

export function CashierReceiptDetailsSheet({
  receipt,
  branchName,
  cashierName,
  locale,
  onOpenChange,
}: CashierReceiptDetailsSheetProps) {
  const t = useTranslations("cashierDashboard");
  const currentLocale = useLocale();

  return (
    <Sheet
      open={receipt !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={currentLocale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-3xl"
      >
        {receipt && (
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
              <SheetTitle dir="ltr" className="text-start">
                {receipt.referenceNumber}
              </SheetTitle>
              <SheetDescription>{t("receipts.detailsDescription")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-6">
              <ReceiptPresentation
                receipt={{ ...receipt, branchName, cashierName }}
                locale={locale}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
