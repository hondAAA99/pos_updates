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
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type {
  Wallet,
  WalletOperationInput,
  WalletTransferInput,
  WalletTransferResponse,
} from "../types/wallet";

export type WalletOperationKind = "deposit" | "withdraw" | "transfer";

export type WalletOperationSubmission =
  | {
      operation: "deposit" | "withdraw";
      input: WalletOperationInput;
    }
  | {
      operation: "transfer";
      input: WalletTransferInput;
    };

type WalletOperationSheetProps = {
  wallet: Wallet;
  operation: WalletOperationKind;
  isSubmitting: boolean;
  submissionError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    submission: WalletOperationSubmission,
  ) => Promise<WalletTransferResponse | void>;
};

export function WalletOperationSheet({
  wallet,
  operation,
  isSubmitting,
  submissionError,
  onOpenChange,
  onSubmit,
}: WalletOperationSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const [amount, setAmount] = useState("");
  const [transactionFee, setTransactionFee] = useState("0");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transferSentAmount, setTransferSentAmount] = useState<number | null>(null);
  const [errors, setErrors] = useState({
    amount: false,
    transactionFee: false,
    phoneNumber: false,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransferSentAmount(null);

    const parsedAmount = Number(amount);
    const showTransactionFee = operation === "withdraw";
    const parsedTransactionFee = showTransactionFee ? Number(transactionFee) : 0;
    const nextErrors = {
      amount:
        amount.trim() === "" ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0,
      transactionFee: showTransactionFee && (
        transactionFee.trim() === "" ||
        !Number.isFinite(parsedTransactionFee) ||
        parsedTransactionFee < 0
      ),
      phoneNumber: operation === "transfer" && !phoneNumber.trim(),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const input: WalletOperationInput = {
      moneyAmount: parsedAmount,
      transaction_fee: parsedTransactionFee,
    };

    if (operation === "transfer") {
      const response = await onSubmit({
        operation,
        input: { ...input, phoneNumber: phoneNumber.trim() },
      });
      if (response) {
        setTransferSentAmount(response.send);
      }
      return;
    }

    void onSubmit({ operation, input });
  }

  const operationTitle = {
    deposit: t("operationForm.depositTitle"),
    withdraw: t("operationForm.withdrawTitle"),
    transfer: t("operationForm.transferTitle"),
  }[operation];
  const operationDescription = {
    deposit: t("operationForm.depositDescription"),
    withdraw: t("operationForm.withdrawDescription"),
    transfer: t("operationForm.transferDescription"),
  }[operation];

  return (
    <Sheet open onOpenChange={onOpenChange}>
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
            <SheetTitle>{operationTitle}</SheetTitle>
            <SheetDescription>{operationDescription}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <dl className="rounded-lg border border-border bg-muted/30 px-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3">
                <dt className="text-sm text-muted-foreground">{t("table.phone")}</dt>
                <dd dir="auto" className="text-end text-sm font-medium">{wallet.phoneNumber}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <dt className="text-sm text-muted-foreground">{t("table.balance")}</dt>
                <dd className="text-end text-sm font-medium">
                  {formatCurrency(wallet.money_amount, locale as Locale)}
                </dd>
              </div>
            </dl>

            {submissionError && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submissionError}
              </p>
            )}
            {transferSentAmount !== null && (
              <p role="status" className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
                {t("operationFeedback.transferSuccess", {
                  send: formatCurrency(transferSentAmount, locale as Locale),
                })}
              </p>
            )}

            {operation === "transfer" && (
              <div className="space-y-2">
                <label htmlFor="wallet-operation-phone" className="text-sm font-medium">
                  {t("operationForm.phoneLabel")}
                </label>
                <Input
                  id="wallet-operation-phone"
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
                  placeholder={t("operationForm.phonePlaceholder")}
                />
                {errors.phoneNumber && (
                  <p role="alert" className="text-sm text-destructive">
                    {t("operationForm.phoneRequired")}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="wallet-operation-amount" className="text-sm font-medium">
                {t("operationForm.amountLabel")}
              </label>
              <Input
                id="wallet-operation-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                disabled={isSubmitting}
                onChange={(event) => {
                  setAmount(event.currentTarget.value);
                  setErrors((current) => ({ ...current, amount: false }));
                }}
                aria-invalid={errors.amount}
                aria-required="true"
              />
              {errors.amount && (
                <p role="alert" className="text-sm text-destructive">
                  {t("operationForm.amountInvalid")}
                </p>
              )}
            </div>

            {operation === "withdraw" && (
              <div className="space-y-2">
                <label htmlFor="wallet-operation-fee" className="text-sm font-medium">
                  {t("operationForm.transactionFeeLabel")}
                </label>
                <Input
                  id="wallet-operation-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={transactionFee}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setTransactionFee(event.currentTarget.value);
                    setErrors((current) => ({ ...current, transactionFee: false }));
                  }}
                  aria-invalid={errors.transactionFee}
                  aria-required="true"
                />
                {errors.transactionFee && (
                  <p role="alert" className="text-sm text-destructive">
                    {t("operationForm.transactionFeeInvalid")}
                  </p>
                )}
              </div>
            )}
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
              {isSubmitting ? t("actions.saving") : t("operationForm.submit")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
