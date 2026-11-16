"use client";

import { useLocale, useTranslations } from "next-intl";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EmployeeItem } from "../types/employee";

type RegeneratePasswordSheetProps = {
  employee: EmployeeItem | null;
  isRegenerating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RegeneratePasswordSheet({
  employee,
  isRegenerating,
  onOpenChange,
  onConfirm,
}: RegeneratePasswordSheetProps) {
  const t = useTranslations("employees");
  const locale = useLocale();

  return (
    <Sheet
      open={employee !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="relative border-b border-border p-6 pe-14">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.close")}
            title={t("actions.close")}
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
            className="absolute end-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("password.confirmTitle")}</SheetTitle>
          <SheetDescription>
            {t("password.confirmDescription", { name: employee?.name ?? "" })}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex-row justify-end p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isRegenerating}>
            <KeyRound aria-hidden="true" />
            {t("actions.regeneratePassword")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
