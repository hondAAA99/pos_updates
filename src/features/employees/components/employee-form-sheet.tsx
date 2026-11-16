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
import type { Branch } from "@/features/branches/types/branch";
import type {
  CreateEmployeeInput,
  EmployeeItem,
  EmployeeRole,
} from "../types/employee";

type EmployeeFormSheetProps = {
  open: boolean;
  employee: EmployeeItem | null;
  branches: Branch[];
  branchesLoading: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateEmployeeInput) => Promise<void>;
};

const employeeRoles: EmployeeRole[] = [
  "admin",
  "inventory-man",
  "cashier",
  "sales-man",
];

export function EmployeeFormSheet({
  open,
  employee,
  branches,
  branchesLoading,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EmployeeFormSheetProps) {
  const t = useTranslations("employees");
  const locale = useLocale();
  const [name, setName] = useState(employee?.name ?? "");
  const [role, setRole] = useState<EmployeeRole | "">(employee?.role ?? "");
  const [branchId, setBranchId] = useState(employee?.branchId ?? "");
  const [errors, setErrors] = useState({
    name: false,
    role: false,
    branch: false,
  });
  const branchRequired = role === "cashier" || role === "sales-man";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      name: !name.trim(),
      role: !role,
      branch:
        branchRequired &&
        !branches.some((branch) => branch._id === branchId),
    };

    if (nextErrors.name || nextErrors.role || nextErrors.branch || !role) {
      setErrors(nextErrors);
      return;
    }

    setErrors({ name: false, role: false, branch: false });
    onSubmit({
      name: name.trim(),
      role,
      ...(branchRequired && { branchId }),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        showCloseButton={false}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
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
              {employee ? t("form.editTitle") : t("form.addTitle")}
            </SheetTitle>
            <SheetDescription>
              {employee ? t("form.editDescription") : t("form.createDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label htmlFor="employee-name" className="text-sm font-medium">
                {t("form.name")}
              </label>
              <Input
                id="employee-name"
                name="name"
                autoFocus
                value={name}
                disabled={isSubmitting}
                onChange={(event) => {
                  setName(event.currentTarget.value);
                  setErrors((current) => ({ ...current, name: false }));
                }}
                aria-invalid={errors.name}
                aria-required="true"
                aria-describedby={errors.name ? "employee-name-error" : undefined}
                placeholder={t("form.namePlaceholder")}
              />
              {errors.name && (
                <p id="employee-name-error" role="alert" className="text-sm text-destructive">
                  {t("form.validation.nameRequired")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="employee-role" className="text-sm font-medium">
                {t("form.role")}
              </label>
              <select
                id="employee-role"
                name="role"
                value={role}
                disabled={isSubmitting}
                onChange={(event) => {
                  const selectedRole = employeeRoles.find(
                    (item) => item === event.currentTarget.value,
                  );
                  setRole(selectedRole ?? "");
                  setErrors((current) => ({ ...current, role: false }));
                }}
                aria-required="true"
                aria-invalid={errors.role}
                aria-describedby={errors.role ? "employee-role-error" : undefined}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              >
                <option value="">{t("form.selectRole")}</option>
                {employeeRoles.map((employeeRole) => (
                  <option key={employeeRole} value={employeeRole}>
                    {t(`roles.${employeeRole}`)}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p id="employee-role-error" role="alert" className="text-sm text-destructive">
                  {t("form.validation.roleRequired")}
                </p>
              )}
            </div>
            {branchRequired && (
              <div className="space-y-2">
                <label htmlFor="employee-branch" className="text-sm font-medium">
                  {t("form.branch")}
                </label>
                <select
                  id="employee-branch"
                  name="branchId"
                  value={branchId}
                  disabled={isSubmitting || branchesLoading || branches.length === 0}
                  onChange={(event) => {
                    setBranchId(event.currentTarget.value);
                    setErrors((current) => ({ ...current, branch: false }));
                  }}
                  aria-required="true"
                  aria-invalid={errors.branch}
                  aria-describedby={
                    errors.branch ? "employee-branch-error" : undefined
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                >
                  <option value="">{t("form.selectBranch")}</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch && (
                  <p id="employee-branch-error" role="alert" className="text-sm text-destructive">
                    {t("form.validation.branchRequired")}
                  </p>
                )}
              </div>
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (branchRequired &&
                  (branchesLoading || branches.length === 0))
              }
            >
              {employee ? t("actions.saveChanges") : t("actions.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
