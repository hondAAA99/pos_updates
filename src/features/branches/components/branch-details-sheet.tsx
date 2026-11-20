"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Branch, BranchSupply } from "../types/branch";

type BranchDetailsSheetProps = {
  branch: Branch | null;
  supply: BranchSupply | null;
  loadState: "loading" | "ready" | "error";
  error: string;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
};

export function BranchDetailsSheet({
  branch,
  supply,
  loadState,
  error,
  canManage,
  onOpenChange,
  onRetry,
  onEdit,
  onDelete,
}: BranchDetailsSheetProps) {
  const t = useTranslations("branchManagement");
  const locale = useLocale();
  const timestamp = supply ? new Date(supply.timestamp) : null;
  const formattedTimestamp =
    timestamp && !Number.isNaN(timestamp.getTime())
      ? formatDate(timestamp, locale as Locale, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : supply?.timestamp;

  return (
    <Sheet
      open={branch !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {branch && (
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
              <SheetTitle>{branch.name}</SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("table.name")}
                </dt>
                <dd className="break-words text-sm">{branch.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {t("details.id")}
                </dt>
                <dd dir="ltr" className="break-words font-mono text-sm">
                  {branch._id}
                </dd>
              </div>
            </dl>
            <section
              aria-labelledby="branch-supply-title"
              className="space-y-5 border-t border-border p-6"
            >
              <div>
                <h3 id="branch-supply-title" className="text-base font-semibold">
                  {t("details.supply.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("details.supply.description")}
                </p>
              </div>
              {loadState === "loading" ? (
                <p role="status" className="text-sm text-muted-foreground">
                  {t("details.supply.loading")}
                </p>
              ) : loadState === "error" ? (
                <div className="space-y-3">
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                  <Button type="button" variant="outline" onClick={onRetry}>
                    {t("actions.retry")}
                  </Button>
                </div>
              ) : supply ? (
                <>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        {t("details.supply.sales")}
                      </h4>
                      <dl className="space-y-3">
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground">
                            {t("details.supply.salesSum")}
                          </dt>
                          <dd dir="ltr" className="text-sm font-medium">
                            {formatNumber(supply.salesSum, locale as Locale)}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground">
                            {t("details.supply.salesTotal")}
                          </dt>
                          <dd dir="ltr" className="text-sm font-medium">
                            {formatNumber(supply.salesTotal, locale as Locale)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        {t("details.supply.maintenance")}
                      </h4>
                      <dl className="space-y-3">
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground">
                            {t("details.supply.maintenanceSum")}
                          </dt>
                          <dd dir="ltr" className="text-sm font-medium">
                            {formatNumber(
                              supply.maintenanceSum,
                              locale as Locale,
                            )}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground">
                            {t("details.supply.maintenanceTotal")}
                          </dt>
                          <dd dir="ltr" className="text-sm font-medium">
                            {formatNumber(
                              supply.maintenanceTotal,
                              locale as Locale,
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <dl className="space-y-1 border-t border-border pt-4">
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("details.supply.timestamp")}
                      </dt>
                      <dd className="text-sm">
                        {formattedTimestamp ||
                          t("details.supply.missingTimestamp")}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("details.supply.unavailable")}
                </p>
              )}
            </section>
            {canManage && (
              <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(branch)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("actions.delete")}
                </Button>
                <Button type="button" onClick={() => onEdit(branch)}>
                  <Pencil aria-hidden="true" />
                  {t("actions.edit")}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
