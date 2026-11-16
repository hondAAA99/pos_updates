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
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { Wallet, WalletType } from "../types/wallet";

type WalletDetailsSheetProps = {
  wallet: Wallet | null;
  walletType: WalletType | null;
  resolvedWalletType: WalletType | null;
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
              <Detail label={t("typeTable.dailyTransfer")} value={formatCurrency(walletType.daily.transfer, locale as Locale)} />
              <Detail label={t("typeTable.dailyWithdraw")} value={formatCurrency(walletType.daily.withdraw, locale as Locale)} />
              <Detail label={t("typeTable.monthlyTransfer")} value={formatCurrency(walletType.monthly.transfer, locale as Locale)} />
              <Detail label={t("typeTable.monthlyWithdraw")} value={formatCurrency(walletType.monthly.withdraw, locale as Locale)} />
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

export type WalletDeleteTarget =
  | { kind: "wallet"; id: string; name: string }
  | { kind: "type"; id: string; name: string; assignedWalletCount: number };

type WalletDeleteSheetProps = {
  target: WalletDeleteTarget | null;
  onClose: () => void;
  onConfirm: (target: WalletDeleteTarget) => void;
};

export function WalletDeleteSheet({
  target,
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
        <SheetFooter className="mt-6 flex-row justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!target || Boolean(typeInUse)}
            onClick={() => target && onConfirm(target)}
          >
            {t("actions.delete")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
