"use client";

import {
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Branch } from "@/features/branches/types/branch";
import type {
  EmployeeItem,
  EmployeeListFilters,
  EmployeePage,
  EmployeeRole,
} from "../types/employee";

type EmployeesTableProps = {
  employees: EmployeePage;
  branches: Branch[];
  filters: EmployeeListFilters;
  hasEmployees: boolean;
  onFilterChange: (filters: Partial<EmployeeListFilters>) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onAdd: () => void;
  onView: (employee: EmployeeItem) => void;
  onEdit: (employee: EmployeeItem) => void;
  onDelete: (employee: EmployeeItem) => void;
  onSetActive: (employee: EmployeeItem, active: boolean) => void;
  onRegeneratePassword: (employee: EmployeeItem) => void;
};

const employeeRoles: EmployeeRole[] = [
  "admin",
  "inventory-man",
  "cashier",
  "sales-man",
];

export function EmployeesTable({
  employees,
  branches,
  filters,
  hasEmployees,
  onFilterChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onSetActive,
  onRegeneratePassword,
}: EmployeesTableProps) {
  const t = useTranslations("employees");
  const { currentPage, limit, totalDoc, totalPages } = employees.meta;
  const start = totalDoc === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalDoc);
  const hasFilters =
    Boolean(filters.branchId) ||
    Boolean(filters.role) ||
    filters.active !== undefined;
  const branchNames = new Map(branches.map((branch) => [branch._id, branch.name]));

  function actions(employee: EmployeeItem) {
    return (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: employee.name })}
          title={t("actions.view")}
          onClick={() => onView(employee)}
        >
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: employee.name })}
          title={t("actions.edit")}
          onClick={() => onEdit(employee)}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t(
            employee.active ? "actions.deactivateNamed" : "actions.activateNamed",
            { name: employee.name },
          )}
          title={t(employee.active ? "actions.deactivate" : "actions.activate")}
          onClick={() => onSetActive(employee, !employee.active)}
        >
          {employee.active ? (
            <ShieldOff aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.regeneratePasswordNamed", {
            name: employee.name,
          })}
          title={t("actions.regeneratePassword")}
          onClick={() => onRegeneratePassword(employee)}
        >
          <KeyRound aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.deleteNamed", { name: employee.name })}
          title={t("actions.delete")}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(employee)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-5 border-b border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label>
            <span className="sr-only">{t("filters.branch")}</span>
            <select
              value={filters.branchId ?? ""}
              onChange={(event) =>
                onFilterChange({ branchId: event.currentTarget.value || undefined })
              }
              aria-label={t("filters.branch")}
              className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <option value="">{t("filters.allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("filters.role")}</span>
            <select
              value={filters.role ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                const role = employeeRoles.find((item) => item === value);
                onFilterChange({ role });
              }}
              aria-label={t("filters.role")}
              className="h-10 min-w-44 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <option value="">{t("filters.allRoles")}</option>
              {employeeRoles.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">{t("filters.status")}</span>
            <select
              value={
                filters.active === undefined
                  ? ""
                  : filters.active
                    ? "active"
                    : "inactive"
              }
              onChange={(event) => {
                const value = event.currentTarget.value;
                onFilterChange({
                  active:
                    value === ""
                      ? undefined
                      : value === "active",
                });
              }}
              aria-label={t("filters.status")}
              className="h-10 min-w-40 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <option value="">{t("filters.allStatuses")}</option>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
          </label>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={onClearFilters}>
              {t("actions.clearFilters")}
            </Button>
          )}
        </div>
        <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: totalDoc })}
        </p>
      </div>

      {employees.data.length > 0 ? (
        <>
          <CardContent className="p-0">
            <table className="w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th scope="col" className="w-[20%] px-5 py-3.5 text-start font-medium">
                    {t("table.name")}
                  </th>
                  <th scope="col" data-column-align="center" className="w-[23%] px-5 py-3.5 font-medium">
                    {t("table.email")}
                  </th>
                  <th scope="col" className="w-[16%] px-5 py-3.5 text-start font-medium">
                    {t("table.role")}
                  </th>
                  <th scope="col" className="w-[16%] px-5 py-3.5 text-start font-medium">
                    {t("table.branch")}
                  </th>
                  <th scope="col" className="w-[10%] px-5 py-3.5 text-start font-medium">
                    {t("table.status")}
                  </th>
                  <th scope="col" data-column-align="actions" className="w-[15%] px-4 py-3.5 font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.data.map((employee) => (
                  <tr
                    key={employee._id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <th scope="row" className="px-5 py-4 text-start font-medium">
                      <span className="block break-words">{employee.name}</span>
                    </th>
                    <td dir="ltr" data-column-align="center" className="break-all px-5 py-4 text-muted-foreground">
                      {employee.email}
                    </td>
                    <td className="px-5 py-4">{t(`roles.${employee.role}`)}</td>
                    <td className="px-5 py-4">
                      {branchNames.get(employee.branchId) || t("notAvailable")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          employee.active
                            ? "inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                            : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {t(employee.active ? "status.active" : "status.inactive")}
                      </span>
                    </td>
                    <td data-column-align="actions" className="px-2 py-3">{actions(employee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <footer className="flex items-center justify-between gap-6 border-t border-border px-6 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {t("pagination.showing", { start, end, total: totalDoc })}
              </span>
              <label className="flex items-center gap-2">
                <span>{t("pagination.pageSize")}</span>
                <select
                  value={limit}
                  onChange={(event) =>
                    onPageSizeChange(Number(event.currentTarget.value))
                  }
                  aria-label={t("pagination.pageSize")}
                  className="h-8 rounded-md border border-input bg-background px-2 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                >
                  {[5, 10, 20].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                {t("pagination.previous")}
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                {t("pagination.page", {
                  page: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {hasEmployees ? t("empty.noMatchesTitle") : t("empty.noEmployeesTitle")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasEmployees
              ? t("empty.noMatchesDescription")
              : t("empty.noEmployeesDescription")}
          </p>
          {hasEmployees && hasFilters ? (
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={onClearFilters}
            >
              {t("actions.clearFilters")}
            </Button>
          ) : (
            !hasEmployees && (
              <Button type="button" onClick={onAdd} className="mt-5">
                <Plus aria-hidden="true" />
                {t("actions.add")}
              </Button>
            )
          )}
        </div>
      )}
    </Card>
  );
}
