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
import type { Branch } from "../types/branch";

type BranchFormSheetProps = {
  open: boolean;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
};

export function BranchFormSheet({
  open,
  branch,
  onOpenChange,
  onSubmit,
}: BranchFormSheetProps) {
  const t = useTranslations("branchManagement");
  const locale = useLocale();
  const [name, setName] = useState(branch?.name ?? "");
  const [hasError, setHasError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setHasError(true);
      return;
    }

    setHasError(false);
    onSubmit(normalizedName);
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
              {branch ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>{t("form.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 p-6">
            <label htmlFor="branch-name" className="text-sm font-medium">
              {t("form.nameLabel")}
            </label>
            <Input
              id="branch-name"
              name="name"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                if (hasError) setHasError(false);
              }}
              aria-invalid={hasError}
              aria-required="true"
              aria-describedby={hasError ? "branch-name-error" : undefined}
              placeholder={t("form.namePlaceholder")}
            />
            {hasError && (
              <p
                id="branch-name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t("form.validation.required")}
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
              {branch ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
