"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Branch } from "../types/branch";

type BranchesTableProps = {
  branches: Branch[];
  canManage: boolean;
  onAdd: () => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
};

export function BranchesTable({
  branches,
  canManage,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: BranchesTableProps) {
  const t = useTranslations("branchManagement");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-b border-border px-6 py-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("resultsCount", { count: branches.length })}
        </p>
      </div>

      {branches.length > 0 ? (
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[42rem] text-start text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th scope="col" className="px-6 py-3.5 text-start font-medium">
                  {t("table.name")}
                </th>
                <th scope="col" data-column-align="actions" className="w-40 px-6 py-3.5 font-medium">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branches.map((branch) => (
                <tr
                  key={branch._id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 text-start font-medium text-foreground"
                  >
                    {branch.name}
                  </th>
                  <td data-column-align="actions" className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("actions.viewNamed", {
                          name: branch.name,
                        })}
                        title={t("actions.view")}
                        onClick={() => onView(branch)}
                      >
                        <Eye aria-hidden="true" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("actions.editNamed", {
                              name: branch.name,
                            })}
                            title={t("actions.edit")}
                            onClick={() => onEdit(branch)}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("actions.deleteNamed", {
                              name: branch.name,
                            })}
                            title={t("actions.delete")}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onDelete(branch)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {t("empty.title")}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {t("empty.description")}
          </p>
          {canManage && (
            <Button type="button" onClick={onAdd} className="mt-5">
              <Plus aria-hidden="true" />
              {t("actions.add")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
