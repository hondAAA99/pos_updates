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
import type { WalletType, WalletTypeInput } from "../types/wallet";

type WalletTypeFormSheetProps = {
  open: boolean;
  walletType: WalletType | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: WalletTypeInput) => void;
};

export function WalletTypeFormSheet({
  open,
  walletType,
  onOpenChange,
  onSubmit,
}: WalletTypeFormSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const [name, setName] = useState(walletType?.name ?? "");
  const [capacity, setCapacity] = useState(String(walletType?.capacity ?? 0));
  const [dailyTransfer, setDailyTransfer] = useState(String(walletType?.daily.transfer ?? 0));
  const [dailyWithdraw, setDailyWithdraw] = useState(String(walletType?.daily.withdraw ?? 0));
  const [monthlyTransfer, setMonthlyTransfer] = useState(String(walletType?.monthly.transfer ?? 0));
  const [monthlyWithdraw, setMonthlyWithdraw] = useState(String(walletType?.monthly.withdraw ?? 0));
  const [errors, setErrors] = useState({ name: false, amounts: false });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = [capacity, dailyTransfer, dailyWithdraw, monthlyTransfer, monthlyWithdraw].map(Number);
    const nextErrors = {
      name: !name.trim(),
      amounts: values.some((amount, index) =>
        !Number.isFinite(amount) || amount < 0 ||
        [capacity, dailyTransfer, dailyWithdraw, monthlyTransfer, monthlyWithdraw][index].trim() === ""),
    };
    if (nextErrors.name || nextErrors.amounts) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      capacity: values[0],
      daily: { transfer: values[1], withdraw: values[2] },
      monthly: { transfer: values[3], withdraw: values[4] },
    });
  }

  const numberField = (
    id: string,
    label: string,
    value: string,
    setValue: (value: string) => void,
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          setErrors((current) => ({ ...current, amounts: false }));
        }}
        aria-invalid={errors.amounts}
        aria-required="true"
      />
    </div>
  );

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
              onClick={() => onOpenChange(false)}
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>
              {walletType ? t("typeForm.editTitle") : t("typeForm.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("typeForm.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="wallet-type-name" className="text-sm font-medium">
                {t("typeForm.nameLabel")}
              </label>
              <Input
                id="wallet-type-name"
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value);
                  setErrors((current) => ({ ...current, name: false }));
                }}
                aria-invalid={errors.name}
                aria-required="true"
              />
              {errors.name && <p role="alert" className="text-sm text-destructive">{t("validation.nameRequired")}</p>}
            </div>
            {numberField("wallet-type-capacity", t("typeForm.capacityLabel"), capacity, setCapacity)}
            <fieldset className="space-y-3 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium">{t("typeForm.dailyLimits")}</legend>
              {numberField("wallet-type-daily-transfer", t("typeForm.transferLimit"), dailyTransfer, setDailyTransfer)}
              {numberField("wallet-type-daily-withdraw", t("typeForm.withdrawLimit"), dailyWithdraw, setDailyWithdraw)}
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium">{t("typeForm.monthlyLimits")}</legend>
              {numberField("wallet-type-monthly-transfer", t("typeForm.transferLimit"), monthlyTransfer, setMonthlyTransfer)}
              {numberField("wallet-type-monthly-withdraw", t("typeForm.withdrawLimit"), monthlyWithdraw, setMonthlyWithdraw)}
            </fieldset>
            {errors.amounts && <p role="alert" className="text-sm text-destructive">{t("validation.amountInvalid")}</p>}
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">
              {walletType ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
