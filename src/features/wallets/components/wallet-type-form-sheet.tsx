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
  isSubmitting: boolean;
  submissionError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: WalletTypeInput) => Promise<void>;
};

export function WalletTypeFormSheet({
  open,
  walletType,
  isSubmitting,
  submissionError,
  onOpenChange,
  onSubmit,
}: WalletTypeFormSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const [name, setName] = useState(walletType?.name ?? "");
  const [capacity, setCapacity] = useState(String(walletType?.capacity ?? 0));
  const [daily, setDaily] = useState(String(walletType?.daily ?? 0));
  const [monthly, setMonthly] = useState(String(walletType?.monthly ?? 0));
  const [sameWalletFee, setSameWalletFee] = useState(
    String(walletType?.transfer_fee?.sameWallet ?? 0),
  );
  const [differentWalletMinFee, setDifferentWalletMinFee] = useState(
    String(walletType?.transfer_fee?.differentWallet.min ?? 0),
  );
  const [differentWalletMaxFee, setDifferentWalletMaxFee] = useState(
    String(walletType?.transfer_fee?.differentWallet.max ?? 0),
  );
  const [errors, setErrors] = useState({ name: false, amounts: false });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawValues = [capacity, daily, monthly];
    const values = rawValues.map(Number);
    const nextErrors = {
      name: !name.trim(),
      amounts: values.some((amount, index) =>
        !Number.isFinite(amount) || amount < 0 ||
        rawValues[index].trim() === ""),
    };
    if (nextErrors.name || nextErrors.amounts) {
      setErrors(nextErrors);
      return;
    }

    void onSubmit({
      name: name.trim(),
      capacity: values[0],
      daily: values[1],
      monthly: values[2],
      transfer_fee: {
        sameWallet: Number(sameWalletFee),
        differentWallet: {
          min: Number(differentWalletMinFee),
          max: Number(differentWalletMaxFee),
        },
      },
    });
  }

  const numberField = (
    id: string,
    label: string,
    value: string,
    setValue: (value: string) => void,
    validate = true,
  ) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input
        id={id}
        type="number"
        min={validate ? "0" : undefined}
        step={validate ? "0.01" : "any"}
        inputMode="decimal"
        value={value}
        disabled={isSubmitting}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          if (validate) {
            setErrors((current) => ({ ...current, amounts: false }));
          }
        }}
        aria-invalid={validate ? errors.amounts : undefined}
        aria-required={validate || undefined}
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
              disabled={isSubmitting}
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>
              {walletType ? t("typeForm.editTitle") : t("typeForm.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("typeForm.description")}</SheetDescription>
          </SheetHeader>
          {submissionError && (
            <p role="alert" className="mx-6 mt-5 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submissionError}
            </p>
          )}
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="wallet-type-name" className="text-sm font-medium">
                {t("typeForm.nameLabel")}
              </label>
              <Input
                id="wallet-type-name"
                value={name}
                disabled={isSubmitting}
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
              {numberField("wallet-type-daily", t("typeForm.amountLabel"), daily, setDaily)}
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium">{t("typeForm.monthlyLimits")}</legend>
              {numberField("wallet-type-monthly", t("typeForm.amountLabel"), monthly, setMonthly)}
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium">
                {t("typeForm.transferFees")}
              </legend>
              {numberField(
                "wallet-type-same-wallet-fee",
                t("typeForm.sameWalletFee"),
                sameWalletFee,
                setSameWalletFee,
                false,
              )}
              {numberField(
                "wallet-type-different-wallet-min-fee",
                t("typeForm.differentWalletMinFee"),
                differentWalletMinFee,
                setDifferentWalletMinFee,
                false,
              )}
              {numberField(
                "wallet-type-different-wallet-max-fee",
                t("typeForm.differentWalletMaxFee"),
                differentWalletMaxFee,
                setDifferentWalletMaxFee,
                false,
              )}
            </fieldset>
            {errors.amounts && <p role="alert" className="text-sm text-destructive">{t("validation.amountInvalid")}</p>}
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("actions.saving")
                : walletType
                  ? t("actions.saveChanges")
                  : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
