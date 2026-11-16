"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
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
import type {
  SupplierDepositListItem,
  SupplierFinancialRecord,
} from "../types/supplier-financial-record";
import type { SupplierListItem } from "../types/supplier";

export type SupplierRecordFormValues = {
  supplierId: string;
  amount: number;
  dateTime: string;
  comments: string;
  nextDepositId: string;
};

type SupplierRecordFormSheetProps = {
  kind: "deposits" | "transactions";
  open: boolean;
  record: SupplierFinancialRecord | null;
  suppliers: SupplierListItem[];
  deposits: SupplierDepositListItem[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierRecordFormValues) => Promise<void>;
};

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDepositDate(value: string, locale: string, fallback: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function SupplierRecordFormSheet({
  kind,
  open,
  record,
  suppliers,
  deposits,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SupplierRecordFormSheetProps) {
  const t = useTranslations("supplierRecords");
  const locale = useLocale();
  const [supplierId, setSupplierId] = useState(record?.supplierId?._id ?? "");
  const [amount, setAmount] = useState(
    record ? String(record.amount) : "",
  );
  const [dateTime, setDateTime] = useState(
    kind === "deposits" ? toLocalDateTime(record?.date) : "",
  );
  const [comments, setComments] = useState(record?.comments ?? "");
  const [nextDepositId, setNextDepositId] = useState("");
  const [validationError, setValidationError] = useState<
    | "validation.supplierRequired"
    | "validation.amountRequired"
    | "validation.dateRequired"
    | "validation.dateInvalid"
    | "validation.nextDepositRequired"
    | ""
  >("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!record && !suppliers.some((supplier) => supplier._id === supplierId)) {
      setValidationError("validation.supplierRequired");
      return;
    }
    if (!amount.trim() || !Number.isFinite(parsedAmount)) {
      setValidationError("validation.amountRequired");
      return;
    }
    if (kind === "deposits") {
      if (!dateTime) {
        setValidationError("validation.dateRequired");
        return;
      }
      if (Number.isNaN(new Date(dateTime).getTime())) {
        setValidationError("validation.dateInvalid");
        return;
      }
    }
    if (
      kind === "transactions" &&
      !record &&
      !deposits.some(
        (deposit) =>
          deposit._id === nextDepositId &&
          (typeof deposit.supplierId === "string"
            ? deposit.supplierId
            : deposit.supplierId?._id) === supplierId,
      )
    ) {
      setValidationError("validation.nextDepositRequired");
      return;
    }

    setValidationError("");
    await onSubmit({
      supplierId,
      amount: parsedAmount,
      dateTime,
      comments,
      nextDepositId,
    });
  }

  const availableDeposits = deposits.filter(
    (deposit) =>
      (typeof deposit.supplierId === "string"
        ? deposit.supplierId
        : deposit.supplierId?._id) === supplierId,
  );
  const title =
    kind === "deposits"
      ? record
        ? t("depositForm.editTitle")
        : t("depositForm.createTitle")
      : record
        ? t("transactionForm.editTitle")
        : t("transactionForm.createTitle");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <form
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-full flex-col"
        >
          <SheetHeader className="relative border-b border-border p-6 pe-14">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("actions.close")}
              title={t("actions.close")}
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              {kind === "deposits"
                ? t("depositForm.description")
                : t("transactionForm.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            {!record && (
              <div className="space-y-2">
                <label htmlFor="supplier-record-supplier" className="text-sm font-medium">
                  {t("fields.supplier")}
                </label>
                <select
                  id="supplier-record-supplier"
                  value={supplierId}
                  onChange={(event) => {
                    setSupplierId(event.currentTarget.value);
                    setNextDepositId("");
                  }}
                  disabled={isSubmitting || suppliers.length === 0}
                  aria-required="true"
                  className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                >
                  <option value="" disabled>
                    {t("form.selectSupplier")}
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} · {supplier.phoneNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {record && (
              <p className="text-sm text-muted-foreground">
                {t("fields.supplier")}:{" "}
                {record.supplierId?.name ?? t("details.notAvailable")}
              </p>
            )}
            <div className="space-y-2">
              <label htmlFor="supplier-record-amount" className="text-sm font-medium">
                {kind === "deposits"
                  ? t("fields.depositAmount")
                  : t("fields.transferredAmount")}
              </label>
              <Input
                id="supplier-record-amount"
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.currentTarget.value)}
                disabled={isSubmitting}
                aria-required="true"
              />
            </div>
            {kind === "deposits" && (
              <div className="space-y-2">
                <label htmlFor="supplier-record-date" className="text-sm font-medium">
                  {t("fields.depositDate")}
                </label>
                <Input
                  id="supplier-record-date"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.currentTarget.value)}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </div>
            )}
            {kind === "transactions" && (
              <>
                {!record && (
                  <div className="space-y-2">
                    <label htmlFor="supplier-record-next-deposit" className="text-sm font-medium">
                      {t("fields.nextDeposit")}
                    </label>
                    <select
                      id="supplier-record-next-deposit"
                      value={nextDepositId}
                      onChange={(event) =>
                        setNextDepositId(event.currentTarget.value)
                      }
                      disabled={isSubmitting || availableDeposits.length === 0}
                      aria-required="true"
                      className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                    >
                      <option value="" disabled>
                        {availableDeposits.length
                          ? t("form.selectNextDeposit")
                          : t("form.noNextDeposits")}
                      </option>
                      {availableDeposits.map((deposit) => (
                        <option key={deposit._id} value={deposit._id}>
                          {formatDepositDate(
                            deposit.depositDate,
                            locale,
                            t("details.notAvailable"),
                          )}
                          {" · "}
                          {deposit.depositAmount}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="supplier-record-comments" className="text-sm font-medium">
                    {t("fields.comments")}
                  </label>
                  <textarea
                    id="supplier-record-comments"
                    value={comments}
                    onChange={(event) => setComments(event.currentTarget.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                  />
                </div>
              </>
            )}
            {validationError && (
              <p role="alert" className="text-sm text-destructive">
                {t(validationError)}
              </p>
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
              {record ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
