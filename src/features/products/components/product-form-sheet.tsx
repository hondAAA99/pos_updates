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
import type { ProductType } from "@/features/product-types/types/product-type";
import type { ProductDetail, ProductFormValues } from "../types/product";

type ProductFormSheetProps = {
  open: boolean;
  product: ProductDetail | null;
  productTypes: ProductType[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => void;
};

export function ProductFormSheet({
  open,
  product,
  productTypes,
  onOpenChange,
  onSubmit,
}: ProductFormSheetProps) {
  const t = useTranslations("products");
  const locale = useLocale();
  const [productName, setProductName] = useState(product?.productName ?? "");
  const [productType, setProductType] = useState(product?.productType?._id ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = productName.trim();

    if (!normalizedName) {
      setError(t("form.validation.nameRequired"));
      return;
    }

    if (!productType || !productTypes.some((item) => item._id === productType)) {
      setError(t("form.validation.typeRequired"));
      return;
    }

    if (
      product &&
      normalizedName === product.productName.trim() &&
      productType === (product.productType?._id ?? "")
    ) {
      setError(t("form.validation.noChanges"));
      return;
    }

    setError("");
    onSubmit({
      productName: normalizedName,
      productType,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
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
              {product ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>
              {product ? t("form.editDescription") : t("form.createDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-sm font-medium">
                {t("form.nameLabel")}
              </label>
              <Input
                id="product-name"
                name="productName"
                autoFocus
                value={productName}
                onChange={(event) => {
                  setProductName(event.currentTarget.value);
                  if (error) setError("");
                }}
                aria-invalid={Boolean(error)}
                aria-required="true"
                placeholder={t("form.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-type" className="text-sm font-medium">
                {t("form.typeLabel")}
              </label>
              <select
                id="product-type"
                name="productType"
                value={productType}
                onChange={(event) => {
                  setProductType(event.currentTarget.value);
                  if (error) setError("");
                }}
                aria-invalid={Boolean(error)}
                aria-required="true"
                className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  {t("form.typePlaceholder")}
                </option>
                {productTypes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {product && (
              <div className="space-y-2">
                <label htmlFor="product-serial-number" className="text-sm font-medium">
                  {t("form.serialNumberLabel")}
                </label>
                <Input
                  id="product-serial-number"
                  name="serialNumber"
                  value={product.serialNumber}
                  readOnly
                  placeholder={t("form.serialNumberPlaceholder")}
                />
              </div>
            )}
            {!product && (
              <p className="text-xs leading-5 text-muted-foreground">
                {t("form.mockSerialNote")}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
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
              {product ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
