"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Branch } from "../types/branch";

type BranchDetailsSheetProps = {
  branch: Branch | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
};

export function BranchDetailsSheet({
  branch,
  canManage,
  onOpenChange,
  onEdit,
  onDelete,
}: BranchDetailsSheetProps) {
  const t = useTranslations("branchManagement");
  const locale = useLocale();

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
