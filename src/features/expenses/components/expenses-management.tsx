"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  createExpense,
  deleteExpense,
  ExpenseServiceError,
  getExpenseById,
  listExpenses,
  serializeExpenseTimestampFilter,
  updateExpense,
} from "../services/expenses-service";
import type { Expense, ExpenseInput, ExpensePage } from "../types/expense";
import { DeleteExpenseSheet } from "./delete-expense-sheet";
import { ExpenseDetailsSheet } from "./expense-details-sheet";
import { ExpenseFormSheet } from "./expense-form-sheet";
import { ExpensesTable } from "./expenses-table";

const EMPTY_PAGE: ExpensePage = {
  meta: { totalDoc: 0, currentPage: 1, totalPages: 1, limit: 10 },
  data: [],
};

export function ExpensesManagement() {
  const t = useTranslations("expenses");
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [expenses, setExpenses] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [timestamp, setTimestamp] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const requestKey = `${page}:${limit}:${timestamp}:${reloadCounter}`;
  const isLoading = canManage && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (!canManage) return;

    let cancelled = false;
    void Promise.resolve()
      .then(() =>
        listExpenses({
          page,
          limit,
          timestamp: serializeExpenseTimestampFilter(timestamp),
        }),
      )
      .then((result) => {
        if (!cancelled) {
          setExpenses(result);
          setLoadError("");
          setLoadedRequestKey(requestKey);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t("feedback.loadError"));
          setLoadedRequestKey(requestKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canManage, limit, page, requestKey, t, timestamp]);

  function openCreate() {
    if (!canManage) return;
    setFeedback(null);
    setEditingExpense(null);
    setFormOpen(true);
  }

  async function openView(expense: Expense) {
    if (!canManage) return;
    try {
      setFeedback(null);
      setViewingExpense(await getExpenseById(expense._id));
    } catch {
      setFeedback({ kind: "error", message: t("feedback.loadOneError") });
    }
  }

  async function openEdit(expense: Expense) {
    if (!canManage) return;
    try {
      setFeedback(null);
      const current = await getExpenseById(expense._id);
      setViewingExpense(null);
      setEditingExpense(current);
      setFormOpen(true);
    } catch {
      setFeedback({ kind: "error", message: t("feedback.loadOneError") });
    }
  }

  function openDelete(expense: Expense) {
    if (!canManage) return;
    setViewingExpense(null);
    setDeletingExpense(expense);
    setFeedback(null);
  }

  async function handleSave(input: ExpenseInput) {
    if (!canManage || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, input);
        setFeedback({ kind: "success", message: t("feedback.updated") });
      } else {
        await createExpense(input);
        setFeedback({ kind: "success", message: t("feedback.created") });
      }
      setFormOpen(false);
      setEditingExpense(null);
      setPage(1);
      setReloadCounter((current) => current + 1);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ExpenseServiceError && error.code === "expense-invalid"
            ? t("feedback.invalid")
            : t("feedback.saveError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDelete = useCallback(async () => {
    if (!canManage || !deletingExpense || isDeleting) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteExpense(deletingExpense._id);
      setDeletingExpense(null);
      setFeedback({ kind: "success", message: t("feedback.deleted") });
      if (expenses.data.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadCounter((current) => current + 1);
      }
    } catch {
      setFeedback({ kind: "error", message: t("feedback.deleteError") });
    } finally {
      setIsDeleting(false);
    }
  }, [canManage, deletingExpense, expenses.data.length, isDeleting, page, t]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </header>

      {feedback && !(formOpen && feedback.kind === "error") && !deletingExpense && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.kind === "error"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-border bg-muted/40 text-foreground"
          }`}
        >
          {feedback.message}
        </p>
      )}
      {loadError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <span>{loadError}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadCounter((current) => current + 1)}
          >
            {t("actions.retry")}
          </Button>
        </div>
      )}

      <ExpensesTable
        expenses={expenses}
        timestamp={timestamp}
        isLoading={isLoading}
        canManage={canManage}
        onTimestampChange={(value) => {
          setTimestamp(value);
          setPage(1);
        }}
        onClearFilter={() => {
          setTimestamp("");
          setPage(1);
        }}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
        onAdd={openCreate}
        onView={(expense) => void openView(expense)}
        onEdit={(expense) => void openEdit(expense)}
        onDelete={openDelete}
      />

      <ExpenseFormSheet
        key={`${formOpen}-${editingExpense?._id ?? "new"}`}
        open={formOpen}
        expense={editingExpense}
        isSubmitting={isSubmitting}
        submissionError={feedback?.kind === "error" ? feedback.message : ""}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setFormOpen(false);
            setEditingExpense(null);
          }
        }}
        onSubmit={handleSave}
      />
      <ExpenseDetailsSheet
        expense={viewingExpense}
        canManage={canManage}
        onOpenChange={(open) => {
          if (!open) setViewingExpense(null);
        }}
        onEdit={(expense) => void openEdit(expense)}
        onDelete={openDelete}
      />
      <DeleteExpenseSheet
        expense={deletingExpense}
        isDeleting={isDeleting}
        error={feedback?.kind === "error" ? feedback.message : ""}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingExpense(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
}
