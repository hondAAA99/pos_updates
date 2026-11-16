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
import type { ProductType } from "../types/product-type";

type ProductTypeFormSheetProps = {
  open: boolean;
  productType: ProductType | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
};

export function ProductTypeFormSheet({
  open,
  productType,
  onOpenChange,
  onSubmit,
}: ProductTypeFormSheetProps) {
  const t = useTranslations("productTypes");
  const locale = useLocale();
  const [name, setName] = useState(productType?.name ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError(t("form.validation.required"));
      return;
    }

    setError("");
    onSubmit(normalizedName);
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
              {productType ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("form.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 p-6">
            <label htmlFor="product-type-name" className="text-sm font-medium">
              {t("form.nameLabel")}
            </label>
            <Input
              id="product-type-name"
              name="name"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-required="true"
              aria-describedby={error ? "product-type-name-error" : undefined}
              placeholder={t("form.namePlaceholder")}
            />
            {error && (
              <p
                id="product-type-name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <SheetFooter className="flex-row justify-end border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit">
              {productType ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
