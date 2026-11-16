"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  KeyRound,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Branch } from "@/features/branches/types/branch";
import type { EmployeeItem } from "../types/employee";

type EmployeeDetailsSheetProps = {
  employee: EmployeeItem | null;
  branches: Branch[];
  onOpenChange: (open: boolean) => void;
  onEdit: (employee: EmployeeItem) => void;
  onDelete: (employee: EmployeeItem) => void;
  onSetActive: (employee: EmployeeItem, active: boolean) => void;
  onRegeneratePassword: (employee: EmployeeItem) => void;
};

export function EmployeeDetailsSheet({
  employee,
  branches,
  onOpenChange,
  onEdit,
  onDelete,
  onSetActive,
  onRegeneratePassword,
}: EmployeeDetailsSheetProps) {
  const t = useTranslations("employees");
  const locale = useLocale();
  const branch = branches.find((item) => item._id === employee?.branchId);

  return (
    <Sheet
      open={employee !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {employee && (
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
              <SheetTitle>{employee.name}</SheetTitle>
              <SheetDescription>{t("details.description")}</SheetDescription>
            </SheetHeader>
            <dl className="grid gap-5 p-6">
              <Detail label={t("table.name")} value={employee.name} />
              <Detail label={t("table.email")} value={employee.email} direction="ltr" />
              <Detail
                label={t("table.role")}
                value={t(`roles.${employee.role}`)}
              />
              {employee.role !== "inventory-man" && (
                <Detail
                  label={t("table.branch")}
                  value={branch?.name || t("notAvailable")}
                />
              )}
              <Detail
                label={t("table.status")}
                value={t(employee.active ? "status.active" : "status.inactive")}
              />
              <Detail label={t("details.id")} value={employee._id} direction="ltr" />
            </dl>
            <SheetFooter className="mt-auto flex-row flex-wrap justify-end border-t border-border p-6">
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(employee)}
              >
                <Trash2 aria-hidden="true" />
                {t("actions.delete")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onRegeneratePassword(employee)}
              >
                <KeyRound aria-hidden="true" />
                {t("actions.regeneratePassword")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSetActive(employee, !employee.active)}
              >
                {employee.active ? (
                  <ShieldOff aria-hidden="true" />
                ) : (
                  <ShieldCheck aria-hidden="true" />
                )}
                {t(employee.active ? "actions.deactivate" : "actions.activate")}
              </Button>
              <Button type="button" onClick={() => onEdit(employee)}>
                <Pencil aria-hidden="true" />
                {t("actions.edit")}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction?: "ltr";
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd dir={direction} className="break-words text-sm">
        {value}
      </dd>
    </div>
  );
}
