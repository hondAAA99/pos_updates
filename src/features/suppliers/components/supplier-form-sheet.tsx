"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SupplierListItem } from "../types/supplier";

type SupplierFormSheetProps = {
  open: boolean;
  supplier: SupplierListItem | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; phoneNumber: string }) => Promise<void>;
};

export function SupplierFormSheet({
  open,
  supplier,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SupplierFormSheetProps) {
  const t = useTranslations("suppliers");
  const locale = useLocale();
  const [name, setName] = useState(supplier?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    supplier?.phoneNumber ?? "",
  );
  const [errors, setErrors] = useState<{
    name?: boolean;
    phoneNumber?: boolean;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedPhone = phoneNumber.trim();
    const nextErrors = {
      name: !normalizedName,
      phoneNumber: !normalizedPhone,
    };

    if (nextErrors.name || nextErrors.phoneNumber) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void onSubmit({ name: normalizedName, phoneNumber: normalizedPhone });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <form noValidate onSubmit={handleSubmit} className="flex min-h-full flex-col">
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
              {supplier ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("form.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="supplier-name" className="text-sm font-medium">
                {t("form.nameLabel")}
              </label>
              <Input
                id="supplier-name"
                name="name"
                autoFocus
                value={name}
                disabled={isSubmitting}
                onChange={(event) => {
                  setName(event.currentTarget.value);
                  setErrors((current) => ({ ...current, name: false }));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-required="true"
                aria-describedby={errors.name ? "supplier-name-error" : undefined}
                placeholder={t("form.namePlaceholder")}
              />
              {errors.name && (
                <p id="supplier-name-error" role="alert" className="text-sm text-destructive">
                  {t("form.validation.nameRequired")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="supplier-phone" className="text-sm font-medium">
                {t("form.phoneNumberLabel")}
              </label>
              <Input
                id="supplier-phone"
                name="phoneNumber"
                type="tel"
                inputMode="tel"
                dir="auto"
                value={phoneNumber}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPhoneNumber(event.currentTarget.value);
                  setErrors((current) => ({
                    ...current,
                    phoneNumber: false,
                  }));
                }}
                aria-invalid={Boolean(errors.phoneNumber)}
                aria-required="true"
                aria-describedby={
                  errors.phoneNumber ? "supplier-phone-error" : undefined
                }
                placeholder={t("form.phoneNumberPlaceholder")}
              />
              {errors.phoneNumber && (
                <p id="supplier-phone-error" role="alert" className="text-sm text-destructive">
                  {t("form.validation.phoneRequired")}
                </p>
              )}
            </div>
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {supplier ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
