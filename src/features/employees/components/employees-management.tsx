"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listBranchesFromApi } from "@/features/branches/services/branches-api-service";
import type { Branch } from "@/features/branches/types/branch";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import {
  createEmployeeOnApi,
  deleteEmployeeFromApi,
  getEmployeeFromApi,
  listEmployeesFromApi,
  regenerateEmployeePasswordOnApi,
  setEmployeeActiveOnApi,
  updateEmployeeOnApi,
} from "../services/employees-api-service";
import type {
  CreateEmployeeInput,
  EmployeeCredentials,
  EmployeeItem,
  EmployeeListFilters,
  EmployeePage,
  UpdateEmployeeInput,
} from "../types/employee";
import { DeleteEmployeeSheet } from "./delete-employee-sheet";
import { EmployeeCredentialsSheet } from "./employee-credentials-sheet";
import { EmployeeDetailsSheet } from "./employee-details-sheet";
import { EmployeeFormSheet } from "./employee-form-sheet";
import { EmployeesTable } from "./employees-table";
import { RegeneratePasswordSheet } from "./regenerate-password-sheet";

const initialLimit = 5;

type LoadState = "loading" | "ready" | "error";

function emptyPage(limit: number): EmployeePage {
  return {
    meta: { totalDoc: 0, currentPage: 1, totalPages: 0, limit },
    data: [],
  };
}

export function EmployeesManagement() {
  const t = useTranslations("employees");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState("");
  const [filters, setFilters] = useState<EmployeeListFilters>({
    page: 1,
    limit: initialLimit,
  });
  const [result, setResult] = useState(() => emptyPage(initialLimit));
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [branchRetryCount, setBranchRetryCount] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = useState<EmployeeItem | null>(
    null,
  );
  const [deletingEmployee, setDeletingEmployee] =
    useState<EmployeeItem | null>(null);
  const [regeneratingEmployee, setRegeneratingEmployee] =
    useState<EmployeeItem | null>(null);
  const [credentials, setCredentials] = useState<EmployeeCredentials | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const listRequestId = useRef(0);

  const handleApiError = useCallback(
    (caught: unknown, fallback: string, preserveSession = false) => {
      const unauthorized =
        caught instanceof ApiClientError && caught.status === 401;
      setError(unauthorized && !preserveSession ? t("states.unauthorized") : fallback);
      if (unauthorized && !preserveSession) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadEmployees = useCallback(
    async (nextFilters: EmployeeListFilters) => {
      const requestId = ++listRequestId.current;
      if (!token || !isAdmin) {
        setLoadState("error");
        setError(t("states.unauthorized"));
        return;
      }

      try {
        setLoadState("loading");
        setError("");
        const page = await listEmployeesFromApi(token, nextFilters);
        if (requestId !== listRequestId.current) return;
        setResult(page);
        if (nextFilters.page !== page.meta.currentPage) {
          setFilters((current) => ({
            ...current,
            page: page.meta.currentPage,
          }));
        }
        setLoadState("ready");
      } catch (caught) {
        if (requestId === listRequestId.current) {
          setLoadState("error");
          handleApiError(caught, t("states.loadError"), true);
        }
      }
    },
    [handleApiError, isAdmin, t, token],
  );

  useEffect(() => {
    let active = true;
    if (!token || !isAdmin) return;

    void listBranchesFromApi(token)
      .then((items) => {
        if (active) setBranches(items);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        const message =
          caught instanceof ApiClientError && caught.status === 401
            ? t("states.unauthorized")
            : t("states.branchesError");
        setBranchesError(message);
        handleApiError(caught, t("states.branchesError"));
      })
      .finally(() => {
        if (active) setBranchesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [branchRetryCount, handleApiError, isAdmin, t, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees(filters);
  }, [filters, loadEmployees, retryCount]);

  function reload(nextFilters = filters) {
    setFilters(nextFilters);
    setRetryCount((count) => count + 1);
  }

  function clearFeedback() {
    setFeedback("");
    setError("");
  }

  function openCreateForm() {
    if (!isAdmin) return;
    setEditingEmployee(null);
    setEditorOpen(true);
    clearFeedback();
  }

  function openEditForm(employee: EmployeeItem) {
    if (!isAdmin) return;
    setViewingEmployee(null);
    setEditingEmployee(employee);
    setEditorOpen(true);
    clearFeedback();
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingEmployee(null);
  }

  async function handleSave(values: CreateEmployeeInput) {
    if (!token || !isAdmin) return;

    try {
      setIsSubmitting(true);
      setError("");
      if (editingEmployee) {
        const updates: UpdateEmployeeInput = {};
        if (values.name !== editingEmployee.name) updates.name = values.name;
        if (values.role !== editingEmployee.role) updates.role = values.role;
        if (
          (values.role === "cashier" || values.role === "sales-man") &&
          values.branchId &&
          branches.some((branch) => branch._id === values.branchId) &&
          (values.role !== editingEmployee.role ||
            values.branchId !== editingEmployee.branchId)
        ) {
          updates.branchId = values.branchId;
        }

        if (Object.keys(updates).length > 0) {
          await updateEmployeeOnApi(token, editingEmployee._id, updates);
        }
        setFeedback(t("feedback.updated"));
      } else {
        const createdCredentials = await createEmployeeOnApi(token, values);
        setCredentials(createdCredentials);
        setFeedback(t("feedback.created"));
      }

      setEditorOpen(false);
      setEditingEmployee(null);
      reload({ ...filters, page: 1 });
    } catch (caught) {
      handleApiError(caught, t("states.operationError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingEmployee || !token || !isAdmin) return;
    try {
      setIsDeleting(true);
      setError("");
      await deleteEmployeeFromApi(token, deletingEmployee._id);
      setFeedback(t("feedback.deleted"));
      setDeletingEmployee(null);
      setViewingEmployee(null);
      const nextPage =
        result.data.length === 1 && filters.page > 1
          ? filters.page - 1
          : filters.page;
      reload({ ...filters, page: nextPage });
    } catch (caught) {
      handleApiError(caught, t("states.operationError"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSetActive(employee: EmployeeItem, active: boolean) {
    if (!token || !isAdmin) return;
    try {
      setError("");
      await setEmployeeActiveOnApi(token, employee._id, active);
      setFeedback(t(active ? "feedback.activated" : "feedback.deactivated"));
      setViewingEmployee(null);
      reload();
    } catch (caught) {
      handleApiError(caught, t("states.operationError"));
    }
  }

  async function handleRegeneratePassword() {
    if (!regeneratingEmployee || !token || !isAdmin) return;

    try {
      setIsRegenerating(true);
      setError("");
      const response = await regenerateEmployeePasswordOnApi(
        token,
        regeneratingEmployee._id,
      );
      setCredentials({
        email: regeneratingEmployee.email,
        password: response.password,
      });
      setFeedback(t("feedback.passwordRegenerated"));
      setRegeneratingEmployee(null);
      setViewingEmployee(null);
    } catch (caught) {
      handleApiError(caught, t("states.operationError"));
    } finally {
      setIsRegenerating(false);
    }
  }

  async function openDetails(employee: EmployeeItem) {
    if (!token || !isAdmin) return;
    try {
      setIsDetailLoading(true);
      setError("");
      setViewingEmployee(await getEmployeeFromApi(token, employee._id));
      clearFeedback();
    } catch (caught) {
      handleApiError(caught, t("states.detailsError"));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openDelete(employee: EmployeeItem) {
    if (!isAdmin) return;
    setViewingEmployee(null);
    setDeletingEmployee(employee);
    clearFeedback();
  }

  function openPasswordRegeneration(employee: EmployeeItem) {
    if (!isAdmin) return;
    setViewingEmployee(null);
    setRegeneratingEmployee(employee);
    clearFeedback();
  }

  function changeFilters(nextFilters: Partial<EmployeeListFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters, page: 1 }));
    clearFeedback();
  }

  function clearFilters() {
    setFilters((current) => ({
      page: 1,
      limit: current.limit,
    }));
    clearFeedback();
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-6xl p-6">
        <p role="alert" className="text-sm text-destructive">
          {t("states.unauthorized")}
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-6">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus aria-hidden="true" />
          {t("actions.add")}
        </Button>
      </header>

      {feedback && (
        <p role="status" className="text-sm text-success">
          {feedback}
        </p>
      )}
      {error && loadState !== "error" && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {branchesError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            {branchesError}
          </p>
          {!branchesLoading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBranchesLoading(true);
                setBranchesError("");
                setBranchRetryCount((count) => count + 1);
              }}
            >
              {t("actions.retry")}
            </Button>
          )}
        </div>
      )}
      {isDetailLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("states.detailsLoading")}
        </p>
      )}

      {loadState === "loading" ? (
        <Card
          aria-label={t("states.loading")}
          className="min-h-64 items-center justify-center"
        >
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.loading")}
          </p>
        </Card>
      ) : loadState === "error" ? (
        <Card className="min-h-64 items-center justify-center gap-4 text-center">
          <p role="alert" className="text-sm text-destructive">
            {error || t("states.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RefreshCw aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        </Card>
      ) : (
        <EmployeesTable
          employees={result}
          branches={branches}
          filters={filters}
          hasEmployees={
            result.meta.totalDoc > 0 ||
            Boolean(filters.branchId || filters.role || filters.active !== undefined)
          }
          onFilterChange={changeFilters}
          onClearFilters={clearFilters}
          onPageChange={(page) =>
            setFilters((current) => ({ ...current, page }))
          }
          onPageSizeChange={(limit) =>
            setFilters((current) => ({ ...current, limit, page: 1 }))
          }
          onAdd={openCreateForm}
          onView={(employee) => void openDetails(employee)}
          onEdit={openEditForm}
          onDelete={openDelete}
          onSetActive={(employee, active) =>
            void handleSetActive(employee, active)
          }
          onRegeneratePassword={openPasswordRegeneration}
        />
      )}

      <EmployeeFormSheet
        key={`${editorOpen}:${editingEmployee?._id ?? "new"}`}
        open={editorOpen}
        employee={editingEmployee}
        branches={branches}
        branchesLoading={branchesLoading}
        isSubmitting={isSubmitting}
        onOpenChange={closeEditor}
        onSubmit={handleSave}
      />
      <EmployeeDetailsSheet
        employee={viewingEmployee}
        branches={branches}
        onOpenChange={(open) => {
          if (!open) setViewingEmployee(null);
        }}
        onEdit={openEditForm}
        onDelete={openDelete}
        onSetActive={(employee, active) =>
          void handleSetActive(employee, active)
        }
        onRegeneratePassword={openPasswordRegeneration}
      />
      <DeleteEmployeeSheet
        employee={deletingEmployee}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) setDeletingEmployee(null);
        }}
        onConfirm={() => void handleDelete()}
      />
      <RegeneratePasswordSheet
        employee={regeneratingEmployee}
        isRegenerating={isRegenerating}
        onOpenChange={(open) => {
          if (!open) setRegeneratingEmployee(null);
        }}
        onConfirm={() => void handleRegeneratePassword()}
      />
      <EmployeeCredentialsSheet
        credentials={credentials}
        onOpenChange={(open) => {
          if (!open) setCredentials(null);
        }}
      />
    </div>
  );
}
