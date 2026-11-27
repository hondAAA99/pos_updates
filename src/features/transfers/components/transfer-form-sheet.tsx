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
import { formatNumber } from "@/lib/format";
import type {
  TransferBranchReference,
  TransferFormValues,
  TransferItem,
  TransferProductReference,
} from "../types/transfer";

type TransferFormSheetProps = {
  open: boolean;
  transfer: TransferItem | null;
  branches: TransferBranchReference[];
  products: TransferProductReference[];
  inventoryQuantities: Record<string, number>;
  isInventoryLoading: boolean;
  inventoryLoadError: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransferFormValues) => Promise<void>;
};

export function TransferFormSheet({
  open,
  transfer,
  branches,
  products,
  inventoryQuantities,
  isInventoryLoading,
  inventoryLoadError,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TransferFormSheetProps) {
  const t = useTranslations("transfers");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const [branchId, setBranchId] = useState(transfer?.branchId?._id ?? "");
  const [productId, setProductId] = useState(transfer?.productId?._id ?? "");
  const [quantity, setQuantity] = useState(
    transfer ? String(transfer.quantity) : "",
  );
  const [error, setError] = useState<
    "branchRequired" | "productRequired" | "quantityRequired" | "quantityInvalid" | ""
  >("");

  const selectedBranch = branches.find((branch) => branch._id === branchId);
  const selectedProduct = products.find((product) => product._id === productId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);

    if (!branchId || !branches.some((branch) => branch._id === branchId)) {
      setError("branchRequired");
      return;
    }

    if (!productId || !products.some((product) => product._id === productId)) {
      setError("productRequired");
      return;
    }

    if (!quantity.trim()) {
      setError("quantityRequired");
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("quantityInvalid");
      return;
    }

    setError("");
    void onSubmit({ branchId, productId, quantity: parsedQuantity });
  }

  function clearError() {
    if (error) setError("");
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
              {transfer ? t("form.editTitle") : t("form.createTitle")}
            </SheetTitle>
            <SheetDescription>
              {transfer ? t("form.editDescription") : t("form.createDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="transfer-branch" className="text-sm font-medium">
                {t("form.branch")}
              </label>
              <select
                id="transfer-branch"
                value={branchId}
                disabled={isSubmitting || branches.length === 0}
                onChange={(event) => {
                  setBranchId(event.currentTarget.value);
                  clearError();
                }}
                aria-invalid={error === "branchRequired"}
                aria-required="true"
                className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  {t("form.selectBranch")}
                </option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="transfer-product" className="text-sm font-medium">
                {t("form.product")}
              </label>
              <select
                id="transfer-product"
                value={productId}
                disabled={isSubmitting || products.length === 0}
                onChange={(event) => {
                  setProductId(event.currentTarget.value);
                  clearError();
                }}
                aria-invalid={error === "productRequired"}
                aria-required="true"
                className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  {t("form.selectProduct")}
                </option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </div>
            {!transfer && selectedProduct && (
              <section
                aria-live="polite"
                className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm"
              >
                {isInventoryLoading ? (
                  <p role="status" className="text-muted-foreground">
                    {t("form.loadingAvailableQuantity")}
                  </p>
                ) : inventoryLoadError ? (
                  <p role="alert" className="text-destructive">
                    {t("form.availableQuantityError")}
                  </p>
                ) : (
                  <p>
                    {t("form.availableQuantity", {
                      quantity: formatNumber(
                        inventoryQuantities[selectedProduct._id] ?? 0,
                        locale,
                      ),
                    })}
                  </p>
                )}
              </section>
            )}
            <div className="space-y-2">
              <label htmlFor="transfer-quantity" className="text-sm font-medium">
                {t("form.quantity")}
              </label>
              <Input
                id="transfer-quantity"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantity}
                disabled={isSubmitting}
                onChange={(event) => {
                  setQuantity(event.currentTarget.value);
                  clearError();
                }}
                aria-invalid={error === "quantityRequired" || error === "quantityInvalid"}
                aria-required="true"
                placeholder={t("form.quantityPlaceholder")}
              />
            </div>
            {(selectedBranch || selectedProduct || quantity) && (
              <section className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold">{t("form.summaryTitle")}</h3>
                <dl className="mt-3 grid gap-2 text-sm">
                  <SummaryRow
                    label={t("form.branch")}
                    value={selectedBranch?.name ?? t("details.notAvailable")}
                  />
                  <SummaryRow
                    label={t("form.product")}
                    value={selectedProduct?.productName ?? t("details.notAvailable")}
                  />
                  <SummaryRow
                    label={t("form.quantity")}
                    value={
                      quantity && Number.isFinite(Number(quantity))
                        ? formatNumber(Number(quantity), locale)
                        : t("details.notAvailable")
                    }
                  />
                </dl>
              </section>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error ? t(`form.validation.${error}`) : null}
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
              {transfer ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd dir="auto" className="break-words text-end">
        {value}
      </dd>
    </div>
  );
}
