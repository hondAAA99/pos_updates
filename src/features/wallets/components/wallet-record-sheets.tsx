"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { Wallet, WalletTransaction, WalletType } from "../types/wallet";

type WalletDetailsSheetProps = {
  wallet: Wallet | null;
  walletType: WalletType | null;
  resolvedWalletType: WalletType | null;
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium">{value}</dd>
    </div>
  );
}

function RemainingLimitCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function WalletDetailsSheet({
  wallet,
  walletType,
  resolvedWalletType,
  isLoading,
  error,
  onRetry,
  onClose,
}: WalletDetailsSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const record = wallet ?? walletType;
  const isWallet = Boolean(wallet);

  return (
    <Sheet open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
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
            onClick={onClose}
            className="absolute end-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{isWallet ? t("details.walletTitle") : t("details.typeTitle")}</SheetTitle>
          <SheetDescription>
            {isWallet ? t("details.walletDescription") : t("details.typeDescription")}
          </SheetDescription>
        </SheetHeader>
        {isLoading && (
          <p role="status" className="px-6 pt-4 text-sm text-muted-foreground">
            {t("feedback.loadingDetails")}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("actions.retry")}
            </Button>
          </div>
        )}
        <dl className="px-6 py-3">
          {wallet ? (
            <>
              <Detail label={t("table.phone")} value={<span dir="auto">{wallet.phoneNumber}</span>} />
              <Detail label={t("table.type")} value={resolvedWalletType?.name ?? t("unknownType")} />
              <Detail label={t("table.balance")} value={formatCurrency(wallet.money_amount, locale as Locale)} />
              <Detail
                label={t("details.capacity")}
                value={resolvedWalletType ? formatCurrency(resolvedWalletType.capacity, locale as Locale) : t("unknownType")}
              />
              <Detail
                label={t("details.remainingCapacity")}
                value={resolvedWalletType ? formatCurrency(resolvedWalletType.capacity - wallet.money_amount, locale as Locale) : t("unknownType")}
              />
              <section
                aria-labelledby="wallet-remaining-limits-heading"
                className="mt-5 border-t border-border pt-5"
              >
                <h3 id="wallet-remaining-limits-heading" className="text-base font-semibold">
                  {t("details.remainingLimits")}
                </h3>
                <div className="mt-4 space-y-4">
                  <section aria-labelledby="wallet-daily-remaining-limits-heading">
                    <h4 id="wallet-daily-remaining-limits-heading" className="mb-2 text-sm font-medium">
                      {t("details.dailyRemainingLimits")}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RemainingLimitCard
                        label={t("details.remainingDepositAmount")}
                        value={typeof wallet.remainingLimits?.daily?.depositAmount === "number"
                          ? formatCurrency(wallet.remainingLimits.daily.depositAmount, locale as Locale)
                          : t("details.notAvailable")}
                      />
                      <RemainingLimitCard
                        label={t("details.remainingTransferAmount")}
                        value={typeof wallet.remainingLimits?.daily?.transferAmount === "number"
                          ? formatCurrency(wallet.remainingLimits.daily.transferAmount, locale as Locale)
                          : t("details.notAvailable")}
                      />
                    </div>
                  </section>
                  <section aria-labelledby="wallet-monthly-remaining-limits-heading">
                    <h4 id="wallet-monthly-remaining-limits-heading" className="mb-2 text-sm font-medium">
                      {t("details.monthlyRemainingLimits")}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RemainingLimitCard
                        label={t("details.remainingDepositAmount")}
                        value={typeof wallet.remainingLimits?.monthly?.depositAmount === "number"
                          ? formatCurrency(wallet.remainingLimits.monthly.depositAmount, locale as Locale)
                          : t("details.notAvailable")}
                      />
                      <RemainingLimitCard
                        label={t("details.remainingTransferAmount")}
                        value={typeof wallet.remainingLimits?.monthly?.transferAmount === "number"
                          ? formatCurrency(wallet.remainingLimits.monthly.transferAmount, locale as Locale)
                          : t("details.notAvailable")}
                      />
                    </div>
                  </section>
                </div>
              </section>
            </>
          ) : walletType ? (
            <>
              <Detail label={t("typeTable.name")} value={walletType.name} />
              <Detail label={t("typeTable.capacity")} value={formatCurrency(walletType.capacity, locale as Locale)} />
              <Detail label={t("typeTable.daily")} value={formatCurrency(walletType.daily, locale as Locale)} />
              <Detail label={t("typeTable.monthly")} value={formatCurrency(walletType.monthly, locale as Locale)} />
            </>
          ) : null}
        </dl>
        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={onClose}>{t("actions.close")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type WalletTransactionDetailsSheetProps = {
  transaction: WalletTransaction | null;
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
};

export function WalletTransactionDetailsSheet({
  transaction,
  isLoading,
  error,
  onRetry,
  onClose,
}: WalletTransactionDetailsSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();

  return (
    <Sheet open={Boolean(transaction)} onOpenChange={(open) => !open && onClose()}>
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
            onClick={onClose}
            className="absolute end-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("transactions.detailsTitle")}</SheetTitle>
          <SheetDescription>{t("transactions.detailsDescription")}</SheetDescription>
        </SheetHeader>
        {isLoading && (
          <p role="status" className="px-6 pt-4 text-sm text-muted-foreground">
            {t("feedback.loadingDetails")}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("actions.retry")}
            </Button>
          </div>
        )}
        {transaction && (
          <dl className="px-6 py-3">
            <Detail label={t("transactions.date")} value={formatDate(transaction.timestamp, locale as Locale, { dateStyle: "medium", timeStyle: "short" })} />
            <Detail label={t("transactions.wallet")} value={transaction.walletId || t("details.notAvailable")} />
            <Detail label={t("transactions.type")} value={transaction.transactionType} />
            <Detail label={t("transactions.amount")} value={formatCurrency(transaction.moneyAmount, locale as Locale)} />
            <Detail label={t("transactions.fee")} value={formatCurrency(transaction.transaction_fee, locale as Locale)} />
            <Detail label={t("transactions.phone")} value={transaction.phoneNumber || t("details.notAvailable")} />
          </dl>
        )}
        <SheetFooter className="border-t border-border p-6">
          <Button type="button" variant="outline" onClick={onClose}>{t("actions.close")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type WalletTransactionDeleteSheetProps = {
  transaction: WalletTransaction | null;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function WalletTransactionDeleteSheet({
  transaction,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: WalletTransactionDeleteSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();

  return (
    <Sheet open={Boolean(transaction)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="relative pe-12">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.close")}
            onClick={onClose}
            disabled={isDeleting}
            className="absolute end-0 top-0"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("transactions.deleteTitle")}</SheetTitle>
          <SheetDescription>
            {transaction ? t("transactions.deleteDescription", { id: transaction.id }) : ""}
          </SheetDescription>
        </SheetHeader>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <SheetFooter className="mt-6 flex-row justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!transaction || isDeleting}
            onClick={() => void onConfirm()}
          >
            {isDeleting ? t("actions.deleting") : t("actions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export type WalletDeleteTarget =
  | { kind: "wallet"; id: string; name: string }
  | { kind: "type"; id: string; name: string; assignedWalletCount: number };

type WalletDeleteSheetProps = {
  target: WalletDeleteTarget | null;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (target: WalletDeleteTarget) => Promise<void>;
};

export function WalletDeleteSheet({
  target,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: WalletDeleteSheetProps) {
  const t = useTranslations("wallets");
  const locale = useLocale();
  const typeInUse = target?.kind === "type" && target.assignedWalletCount > 0;

  return (
    <Sheet open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-md"
      >
        <SheetHeader className="relative pe-12">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("actions.close")}
            onClick={onClose}
            disabled={isDeleting}
            className="absolute end-0 top-0"
          >
            <X aria-hidden="true" />
          </Button>
          <SheetTitle>{t("delete.title")}</SheetTitle>
          <SheetDescription>
            {target?.kind === "wallet"
              ? t("delete.walletDescription", { name: target.name })
              : target
                ? t("delete.typeDescription", { name: target.name })
                : ""}
          </SheetDescription>
        </SheetHeader>
        {typeInUse && (
          <p role="alert" className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            {t("delete.typeInUse", { count: target.assignedWalletCount })}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <SheetFooter className="mt-6 flex-row justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!target || Boolean(typeInUse) || isDeleting}
            onClick={() => target && void onConfirm(target)}
          >
            {isDeleting ? t("actions.deleting") : t("actions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
