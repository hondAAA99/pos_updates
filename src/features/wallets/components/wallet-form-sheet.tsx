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
import type { Wallet, WalletInput, WalletType } from "../types/wallet";

type WalletFormSheetProps = {
  open: boolean;
  wallet: Wallet | null;
  walletTypes: WalletType[];
  isSubmitting: boolean;
  submissionError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: WalletInput) => Promise<void>;
};

export function WalletFormSheet({
  open,
  wallet,
  walletTypes,
  isSubmitting,
  submissionError,
  onOpenChange,
  onSubmit,
}: WalletFormSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const [typeId, setTypeId] = useState(wallet?.typeId ?? walletTypes[0]?.id ?? "");
  const [phoneNumber, setPhoneNumber] = useState(wallet?.phoneNumber ?? "");
  const [balance, setBalance] = useState(
    wallet ? String(wallet.money_amount) : "0",
  );
  const [errors, setErrors] = useState({ typeId: false, phoneNumber: false, balance: false });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(balance);
    const nextErrors = {
      typeId: !typeId,
      phoneNumber: !phoneNumber.trim(),
      balance: balance.trim() === "" || !Number.isFinite(amount) || amount < 0,
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    void onSubmit({
      typeId,
      phoneNumber: phoneNumber.trim(),
      money_amount: amount,
    });
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>
              {wallet ? t("walletForm.editTitle") : t("walletForm.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("walletForm.description")}</SheetDescription>
          </SheetHeader>
          {submissionError && (
            <p role="alert" className="mx-6 mt-5 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submissionError}
            </p>
          )}
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="wallet-type" className="text-sm font-medium">
                {t("walletForm.typeLabel")}
              </label>
              <select
                id="wallet-type"
                value={typeId}
                disabled={isSubmitting}
                onChange={(event) => {
                  setTypeId(event.currentTarget.value);
                  setErrors((current) => ({ ...current, typeId: false }));
                }}
                aria-invalid={errors.typeId}
                aria-required="true"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("walletForm.selectType")}</option>
                {walletTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {errors.typeId && <p role="alert" className="text-sm text-destructive">{t("validation.typeRequired")}</p>}
              {walletTypes.length === 0 && <p className="text-sm text-muted-foreground">{t("walletForm.noTypes")}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="wallet-phone" className="text-sm font-medium">
                {t("walletForm.phoneLabel")}
              </label>
              <Input
                id="wallet-phone"
                type="tel"
                inputMode="tel"
                dir="auto"
                value={phoneNumber}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPhoneNumber(event.currentTarget.value);
                  setErrors((current) => ({ ...current, phoneNumber: false }));
                }}
                aria-invalid={errors.phoneNumber}
                aria-required="true"
                placeholder={t("walletForm.phonePlaceholder")}
              />
              {errors.phoneNumber && <p role="alert" className="text-sm text-destructive">{t("validation.phoneRequired")}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="wallet-balance" className="text-sm font-medium">
                {t("walletForm.balanceLabel")}
              </label>
              <Input
                id="wallet-balance"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={balance}
                disabled={isSubmitting}
                onChange={(event) => {
                  setBalance(event.currentTarget.value);
                  setErrors((current) => ({ ...current, balance: false }));
                }}
                aria-invalid={errors.balance}
                aria-required="true"
              />
              {errors.balance && <p role="alert" className="text-sm text-destructive">{t("validation.amountInvalid")}</p>}
            </div>
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={!walletTypes.length || isSubmitting}>
              {isSubmitting
                ? t("actions.saving")
                : wallet
                  ? t("actions.saveChanges")
                  : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
