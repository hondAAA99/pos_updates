"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CreateSalePlaceholderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateSalePlaceholderSheet({
  open,
  onOpenChange,
}: CreateSalePlaceholderSheetProps) {
  const t = useTranslations("cashierDashboard");
  const locale = useLocale();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
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
          <SheetTitle>{t("createSale.title")}</SheetTitle>
          <SheetDescription>{t("createSale.description")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingCart aria-hidden="true" className="size-7" />
          </span>
          <div className="space-y-2">
            <h2 className="text-base font-semibold">{t("createSale.nextStepTitle")}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("createSale.nextStepDescription")}
            </p>
          </div>
        </div>
        <SheetFooter className="flex-row justify-end border-t border-border p-6">
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t("actions.close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
