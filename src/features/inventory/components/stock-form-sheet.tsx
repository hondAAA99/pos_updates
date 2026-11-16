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
import type { ProductDetail } from "@/features/products/types/product";
import type {
  AddStockDto,
  StockRecord,
  StockCreateFormValues,
  SupplierOption,
  UpdateStockDto,
} from "../types/stock";

const numericFields = [
  "batch_purchase_price",
  "batch_selling_price_per_piece",
  "batch_wholesale_price_per_piece",
  "total_quantity",
  "supplierdepositAmount",
  "supplierNextDepositAmount",
] as const satisfies readonly (keyof StockCreateFormValues)[];

const editableFields = [
  "total_quantity",
  "current_selling_price_per_piece",
  "current_wholesale_price_per_piece",
  "current_purchase_price_per_piece",
] as const satisfies readonly (keyof UpdateStockDto)[];

type StockFormField = keyof StockCreateFormValues | keyof UpdateStockDto;
type StockFormState = Record<StockFormField, string>;
type StockFormErrors = Partial<Record<StockFormField | "form", string>>;

type StockFormSheetProps = {
  open: boolean;
  stock: StockRecord | null;
  products: ProductDetail[];
  suppliers: SupplierOption[];
  onOpenChange: (open: boolean) => void;
  onCreate: (dto: AddStockDto) => void;
  onUpdate: (dto: UpdateStockDto) => void;
};

function getInitialValues(stock: StockRecord | null): StockFormState {
  return {
    productId: stock?.product_id?._id ?? "",
    batch_purchase_price: stock
      ? String(stock.current_purchase_price_per_piece)
      : "",
    batch_selling_price_per_piece: stock
      ? String(stock.current_selling_price_per_piece)
      : "",
    batch_wholesale_price_per_piece: stock
      ? String(stock.current_wholesale_price_per_piece)
      : "",
    total_quantity: stock ? String(stock.total_quantity) : "",
    supplierId: "",
    supplierdepositAmount: "",
    supplierNextDepositAmount: "",
    NextdeositDate: "",
    comments: "",
    current_selling_price_per_piece: stock
      ? String(stock.current_selling_price_per_piece)
      : "",
    current_wholesale_price_per_piece: stock
      ? String(stock.current_wholesale_price_per_piece)
      : "",
    current_purchase_price_per_piece: stock
      ? String(stock.current_purchase_price_per_piece)
      : "",
  };
}

function parseNonNegativeNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
  step = "any",
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={Boolean(error)}
        aria-required="true"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function StockFormSheet({
  open,
  stock,
  products,
  suppliers,
  onOpenChange,
  onCreate,
  onUpdate,
}: StockFormSheetProps) {
  const t = useTranslations("inventory");
  const locale = useLocale();
  const [values, setValues] = useState(() => getInitialValues(stock));
  const [errors, setErrors] = useState<StockFormErrors>({});

  function setValue(field: StockFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function handleCreate() {
    const nextErrors: StockFormErrors = {};
    const selectedProduct = products.find(
      (product) => product._id === values.productId,
    );

    if (!selectedProduct) {
      nextErrors.productId = t("form.validation.productRequired");
    } else if (!selectedProduct.serialNumber.trim()) {
      nextErrors.productId = t("form.validation.productSerialRequired");
    }
    if (!suppliers.some((supplier) => supplier._id === values.supplierId)) {
      nextErrors.supplierId = t("form.validation.supplierRequired");
    }

    for (const field of numericFields) {
      const value = values[field];
      if (!value.trim()) {
        nextErrors[field] = t("form.validation.required");
      } else if (parseNonNegativeNumber(value) === undefined) {
        nextErrors[field] = t("form.validation.nonNegative");
      } else if (
        field === "total_quantity" &&
        !Number.isInteger(Number(value))
      ) {
        nextErrors[field] = t("form.validation.integerRequired");
      }
    }

    if (!values.NextdeositDate) {
      nextErrors.NextdeositDate = t("form.validation.dateRequired");
    } else if (Number.isNaN(new Date(values.NextdeositDate).getTime())) {
      nextErrors.NextdeositDate = t("form.validation.dateInvalid");
    }
    if (!values.comments.trim()) {
      nextErrors.comments = t("form.validation.commentsRequired");
    }

    if (Object.keys(nextErrors).length > 0 || !selectedProduct) {
      setErrors(nextErrors);
      return;
    }

    const purchasePrice = parseNonNegativeNumber(values.batch_purchase_price);
    const sellingPrice = parseNonNegativeNumber(
      values.batch_selling_price_per_piece,
    );
    const wholesalePrice = parseNonNegativeNumber(
      values.batch_wholesale_price_per_piece,
    );
    const quantity = parseNonNegativeNumber(values.total_quantity);
    const depositAmount = parseNonNegativeNumber(values.supplierdepositAmount);
    const nextDepositAmount = parseNonNegativeNumber(
      values.supplierNextDepositAmount,
    );

    if (
      purchasePrice === undefined ||
      sellingPrice === undefined ||
      wholesalePrice === undefined ||
      quantity === undefined ||
      depositAmount === undefined ||
      nextDepositAmount === undefined
    ) {
      setErrors({ form: t("form.validation.nonNegative") });
      return;
    }

    onCreate({
      batch_purchase_price: purchasePrice,
      batch_selling_price_per_piece: sellingPrice,
      batch_wholesale_price_per_piece: wholesalePrice,
      total_quantity: quantity,
      supplierId: values.supplierId,
      supplierdepositAmount: depositAmount,
      supplierNextDepositAmount: nextDepositAmount,
      NextdeositDate: new Date(values.NextdeositDate).toISOString(),
      comments: values.comments.trim(),
      serialNumber: selectedProduct.serialNumber,
    });
  }

  function handleUpdate() {
    if (!stock) return;

    const nextErrors: StockFormErrors = {};
    const dto: UpdateStockDto = {};
    const stockValues: Record<(typeof editableFields)[number], number> = {
      total_quantity: stock.total_quantity,
      current_selling_price_per_piece:
        stock.current_selling_price_per_piece,
      current_wholesale_price_per_piece:
        stock.current_wholesale_price_per_piece,
      current_purchase_price_per_piece:
        stock.current_purchase_price_per_piece,
    };

    for (const field of editableFields) {
      const value = values[field];
      if (!value.trim()) continue;
      const parsed = parseNonNegativeNumber(value);
      if (parsed === undefined) {
        nextErrors[field === "total_quantity" ? field : "form"] =
          t("form.validation.nonNegative");
        continue;
      }
      if (field === "total_quantity" && !Number.isInteger(parsed)) {
        nextErrors.total_quantity = t("form.validation.integerRequired");
        continue;
      }
      if (parsed !== stockValues[field]) {
        dto[field] = parsed;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onUpdate(dto);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    if (stock) {
      handleUpdate();
    } else {
      handleCreate();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        <form
          noValidate
          onSubmit={handleSubmit}
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
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <SheetTitle>
              {stock ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>
              {stock ? t("form.editDescription") : t("form.addDescription")}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 p-6">
            {!stock ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="stock-product" className="text-sm font-medium">
                    {t("form.product")}
                  </label>
                  <select
                    id="stock-product"
                    value={values.productId}
                    onChange={(event) =>
                      setValue("productId", event.currentTarget.value)
                    }
                    aria-invalid={Boolean(errors.productId)}
                    aria-required="true"
                    className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
                  >
                    <option value="">{t("form.selectProduct")}</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName} · {product.serialNumber}
                      </option>
                    ))}
                  </select>
                  {errors.productId && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.productId}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="stock-quantity"
                    label={t("form.quantity")}
                    value={values.total_quantity}
                    error={errors.total_quantity}
                    onChange={(value) => setValue("total_quantity", value)}
                    step="1"
                  />
                  <NumberField
                    id="stock-purchase-price"
                    label={t("form.purchasePrice")}
                    value={values.batch_purchase_price}
                    error={errors.batch_purchase_price}
                    onChange={(value) => setValue("batch_purchase_price", value)}
                  />
                  <NumberField
                    id="stock-selling-price"
                    label={t("form.sellingPrice")}
                    value={values.batch_selling_price_per_piece}
                    error={errors.batch_selling_price_per_piece}
                    onChange={(value) =>
                      setValue("batch_selling_price_per_piece", value)
                    }
                  />
                  <NumberField
                    id="stock-wholesale-price"
                    label={t("form.wholesalePrice")}
                    value={values.batch_wholesale_price_per_piece}
                    error={errors.batch_wholesale_price_per_piece}
                    onChange={(value) =>
                      setValue("batch_wholesale_price_per_piece", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="stock-supplier" className="text-sm font-medium">
                    {t("form.supplier")}
                  </label>
                  <select
                    id="stock-supplier"
                    value={values.supplierId}
                    onChange={(event) =>
                      setValue("supplierId", event.currentTarget.value)
                    }
                    aria-invalid={Boolean(errors.supplierId)}
                    aria-required="true"
                    className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
                  >
                    <option value="">{t("form.selectSupplier")}</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.supplierId}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="stock-deposit"
                    label={t("form.depositAmount")}
                    value={values.supplierdepositAmount}
                    error={errors.supplierdepositAmount}
                    onChange={(value) =>
                      setValue("supplierdepositAmount", value)
                    }
                  />
                  <NumberField
                    id="stock-next-deposit"
                    label={t("form.nextDepositAmount")}
                    value={values.supplierNextDepositAmount}
                    error={errors.supplierNextDepositAmount}
                    onChange={(value) =>
                      setValue("supplierNextDepositAmount", value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="stock-next-deposit-date" className="text-sm font-medium">
                    {t("form.nextDepositDate")}
                  </label>
                  <Input
                    id="stock-next-deposit-date"
                    type="datetime-local"
                    value={values.NextdeositDate}
                    onChange={(event) =>
                      setValue("NextdeositDate", event.currentTarget.value)
                    }
                    aria-invalid={Boolean(errors.NextdeositDate)}
                    aria-required="true"
                  />
                  {errors.NextdeositDate && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.NextdeositDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="stock-comments" className="text-sm font-medium">
                    {t("form.comments")}
                  </label>
                  <textarea
                    id="stock-comments"
                    value={values.comments}
                    onChange={(event) =>
                      setValue("comments", event.currentTarget.value)
                    }
                    aria-invalid={Boolean(errors.comments)}
                    aria-required="true"
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
                    placeholder={t("form.commentsPlaceholder")}
                  />
                  {errors.comments && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.comments}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  {stock.product_id?.productName ?? t("details.notAvailable")}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="stock-quantity"
                    label={t("form.quantity")}
                    value={values.total_quantity}
                    error={errors.total_quantity}
                    onChange={(value) => setValue("total_quantity", value)}
                    step="1"
                  />
                  <NumberField
                    id="stock-selling-price"
                    label={t("form.currentSellingPrice")}
                    value={values.current_selling_price_per_piece}
                    error={errors.form}
                    onChange={(value) =>
                      setValue("current_selling_price_per_piece", value)
                    }
                  />
                  <NumberField
                    id="stock-wholesale-price"
                    label={t("form.currentWholesalePrice")}
                    value={values.current_wholesale_price_per_piece}
                    error={errors.form}
                    onChange={(value) =>
                      setValue("current_wholesale_price_per_piece", value)
                    }
                  />
                  <NumberField
                    id="stock-purchase-price"
                    label={t("form.currentPurchasePrice")}
                    value={values.current_purchase_price_per_piece}
                    error={errors.form}
                    onChange={(value) =>
                      setValue("current_purchase_price_per_piece", value)
                    }
                  />
                </div>
              </div>
            )}
            {errors.form && (
              <p role="alert" className="text-sm text-destructive">
                {errors.form}
              </p>
            )}
          </div>

          <SheetFooter className="mt-auto flex-row justify-end border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit">
              {stock ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
