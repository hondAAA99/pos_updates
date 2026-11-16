"use client";

import { Eye, Plus, Search, Trash2, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import {
  deleteSupplierDeposit,
  deleteSupplierTransaction,
  getSupplierDeposit,
  getSupplierTransaction,
  listAllSupplierDeposits,
  listSupplierDeposits,
  listSupplierTransactions,
  createSupplierDeposit,
  createSupplierTransaction,
  updateSupplierDeposit,
  updateSupplierTransaction,
} from "../services/supplier-financial-service";
import { listSupplierOptionsFromApi } from "../services/suppliers-service";
import {
  getSupplierPermissions,
  type SupplierRole,
} from "../services/supplier-permissions";
import type {
  SupplierDepositDetail,
  SupplierDepositListItem,
  SupplierFinancialRecord,
  SupplierFinancialSupplier,
  SupplierRecordPage,
  SupplierTransactionDetail,
} from "../types/supplier-financial-record";
import type { SupplierListItem } from "../types/supplier";
import {
  SupplierRecordFormSheet,
  type SupplierRecordFormValues,
} from "./supplier-record-form-sheet";
import { SupplierRecordDetailsSheet } from "./supplier-record-details-sheet";
import { SupplierRecordDeleteSheet } from "./supplier-record-delete-sheet";

const pageSizes = [5, 10, 20] as const;
type RecordKind = "deposits" | "transactions";
const emptyRecords: SupplierRecordPage<SupplierFinancialRecord> = {
  meta: { totalDoc: 0, currentPage: 1, totalPages: 0, limit: 5 },
  data: [],
};
const noPermissions = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

function mergeSupplier(
  supplier: SupplierFinancialRecord["supplierId"],
  fallback: SupplierFinancialSupplier | null | undefined,
): SupplierFinancialRecord["supplierId"] {
  const resolvedSupplier = supplier ?? fallback;
  if (!resolvedSupplier) return null;

  return {
    ...resolvedSupplier,
    phoneNumber: supplier?.phoneNumber ?? fallback?.phoneNumber,
  };
}

function mapDeposit(
  detail: SupplierDepositDetail,
  listSupplier: SupplierFinancialSupplier | null,
): SupplierFinancialRecord {
  const supplierId =
    typeof detail.supplierId === "string"
      ? detail.supplierId
      : detail.supplierId?._id;
  const supplierFromList =
    listSupplier?._id === supplierId ? listSupplier : null;
  const supplierFromDetail =
    detail.supplierId && typeof detail.supplierId !== "string"
      ? detail.supplierId
      : null;

  return {
    _id: detail._id,
    supplierId: mergeSupplier(supplierFromDetail, supplierFromList),
    amount: detail.depositAmount,
    date: detail.depositDate,
  };
}

function mapTransaction(
  detail: SupplierTransactionDetail,
  suppliers: SupplierListItem[],
): SupplierFinancialRecord {
  const supplierId =
    typeof detail.supplierId === "string"
      ? detail.supplierId
      : detail.supplierId?._id;
  const supplierFromList = suppliers.find(
    (supplier) => supplier._id === supplierId,
  );
  const supplierFromDetail =
    detail.supplierId && typeof detail.supplierId !== "string"
      ? detail.supplierId
      : null;

  return {
    _id: detail._id,
    supplierId: mergeSupplier(supplierFromDetail, supplierFromList),
    amount: detail.transferredAmount,
    date: detail.timestamp,
    timestamp: detail.timestamp,
    comments: detail.comments,
  };
}

function formatDate(value: string, locale: string, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SupplierFinancialRecordsManagement({
  kind,
}: {
  kind: RecordKind;
}) {
  const t = useTranslations("supplierRecords");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const role: SupplierRole | null =
    user?.role === "admin" || user?.role === "inventory-man"
      ? user.role
      : null;
  const permissions = role ? getSupplierPermissions(role) : noPermissions;
  const canManage = Boolean(role === "admin");
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [supplierId, setSupplierId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizes)[number]>(5);
  const [result, setResult] =
    useState<SupplierRecordPage<SupplierFinancialRecord>>(emptyRecords);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDepositOptions, setIsLoadingDepositOptions] = useState(false);
  const [depositOptions, setDepositOptions] = useState<SupplierDepositListItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<SupplierFinancialRecord | null>(null);
  const [viewingRecord, setViewingRecord] =
    useState<SupplierFinancialRecord | null>(null);
  const [deletingRecord, setDeletingRecord] =
    useState<SupplierFinancialRecord | null>(null);
  const recordRequestId = useRef(0);
  const supplierRequestId = useRef(0);

  const handleApiError = useCallback(
    (caught: unknown, fallback: string) => {
      const unauthorized =
        caught instanceof ApiClientError && caught.status === 401;
      setError(
        unauthorized
          ? t("feedback.unauthorized")
          : caught instanceof ApiClientError && caught.status === 0
            ? caught.message
            : fallback,
      );
      if (unauthorized) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadSuppliers = useCallback(async () => {
    const requestId = ++supplierRequestId.current;
    if (!token) {
      setSuppliers([]);
      setSupplierError(t("feedback.unauthorized"));
      setIsSuppliersLoading(false);
      return;
    }

    try {
      setIsSuppliersLoading(true);
      setSupplierError("");
      const options = await listSupplierOptionsFromApi(token);
      if (requestId === supplierRequestId.current) setSuppliers(options);
    } catch (caught) {
      if (requestId === supplierRequestId.current) {
        const unauthorized =
          caught instanceof ApiClientError && caught.status === 401;
        setSupplierError(
          unauthorized
            ? t("feedback.unauthorized")
            : t("feedback.suppliersError"),
        );
        if (unauthorized) {
          logout();
          router.replace("/login");
        }
      }
    } finally {
      if (requestId === supplierRequestId.current) {
        setIsSuppliersLoading(false);
      }
    }
  }, [logout, router, t, token]);

  const loadRecords = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextSupplierId = supplierId,
    ) => {
      const requestId = ++recordRequestId.current;
      if (!token) {
        setIsLoading(false);
        setError(t("feedback.unauthorized"));
        return;
      }
      try {
        setIsLoading(true);
        setError("");
        const params = { page: nextPage, limit: nextPageSize };
        if (kind === "deposits") {
          const response = await listSupplierDeposits(token, params);
          const details = await Promise.all(
            response.data.map(({ _id }) => getSupplierDeposit(token, _id)),
          );
          if (requestId !== recordRequestId.current) return;
          const records = details.map((detail) => {
            const listItem = response.data.find(
              (item) => item._id === detail._id,
            );
            return mapDeposit(detail, listItem?.supplierId ?? null);
          });
          setResult({
            meta: response.meta,
            data:
              nextSupplierId === "all"
                ? records
                : records.filter(
                    (record) => record.supplierId?._id === nextSupplierId,
                  ),
          });
          setPage(response.meta.currentPage);
        } else {
          const response = await listSupplierTransactions(token, {
            ...params,
            ...(nextSupplierId !== "all"
              ? { supplierId: nextSupplierId }
              : {}),
          });
          const details = await Promise.all(
            response.data.map(({ _id }) =>
              getSupplierTransaction(token, _id),
            ),
          );
          if (requestId !== recordRequestId.current) return;
          setResult({
            meta: response.meta,
            data: details.map((detail) => mapTransaction(detail, suppliers)),
          });
          setPage(response.meta.currentPage);
        }
      } catch (caught) {
        if (requestId === recordRequestId.current) {
          handleApiError(caught, t("feedback.loadError"));
        }
      } finally {
        if (requestId === recordRequestId.current) setIsLoading(false);
      }
    },
    [handleApiError, kind, page, pageSize, supplierId, suppliers, t, token],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecords(page, pageSize, supplierId);
  }, [loadRecords, page, pageSize, supplierId]);

  async function openCreate() {
    if (!permissions.canCreate || suppliers.length === 0) return;
    setEditingRecord(null);
    setFeedback("");
    setError("");
    if (kind === "transactions") {
      if (!token) return;
      try {
        setIsLoadingDepositOptions(true);
        const deposits = await listAllSupplierDeposits(token);
        setDepositOptions(deposits);
      } catch (caught) {
        handleApiError(caught, t("feedback.loadError"));
        return;
      } finally {
        setIsLoadingDepositOptions(false);
      }
    }
    setEditorOpen(true);
  }

  function openEdit(record: SupplierFinancialRecord) {
    if (!canManage || !record.supplierId?._id) return;
    setViewingRecord(null);
    setEditingRecord(record);
    setEditorOpen(true);
    setFeedback("");
  }

  async function handleSave(values: SupplierRecordFormValues) {
    if (!token || (!editingRecord && !permissions.canCreate)) return;
    if (editingRecord && !canManage) return;
    try {
      setIsSubmitting(true);
      setError("");
      if (kind === "deposits") {
        const date = new Date(values.dateTime).toISOString();
        if (editingRecord) {
          await updateSupplierDeposit(token, editingRecord._id, {
            depositAmount: values.amount,
            depositDate: date,
          });
        } else {
          await createSupplierDeposit(token, {
            supplierId: values.supplierId,
            depositAmount: values.amount,
            depositDate: date,
          });
        }
      } else if (editingRecord) {
        await updateSupplierTransaction(token, editingRecord._id, {
          transferredAmount: values.amount,
          comments: values.comments,
        });
      } else {
        await createSupplierTransaction(token, {
          nextDepositId: values.nextDepositId,
          depositAmount: String(values.amount),
          comments: values.comments,
        });
      }

      setFeedback(
        editingRecord
          ? t(kind === "deposits" ? "feedback.depositUpdated" : "feedback.transactionUpdated")
          : t(kind === "deposits" ? "feedback.depositCreated" : "feedback.transactionCreated"),
      );
      setEditorOpen(false);
      setEditingRecord(null);
      const nextPage = editingRecord ? page : 1;
      if (!editingRecord) setPage(1);
      await loadRecords(nextPage, pageSize, supplierId);
    } catch (caught) {
      handleApiError(caught, t("feedback.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!token || !deletingRecord || !canManage) return;
    try {
      setIsDeleting(true);
      setError("");
      if (kind === "deposits") {
        await deleteSupplierDeposit(token, deletingRecord._id);
      } else {
        await deleteSupplierTransaction(token, deletingRecord._id);
      }
      setFeedback(
        t(kind === "deposits" ? "feedback.depositDeleted" : "feedback.transactionDeleted"),
      );
      setDeletingRecord(null);
      setViewingRecord(null);
      const nextPage =
        result.data.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadRecords(nextPage, pageSize, supplierId);
    } catch (caught) {
      handleApiError(caught, t("feedback.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  const totalItems = result.meta.totalDoc;
  const start = totalItems === 0 ? 0 : (result.meta.currentPage - 1) * result.meta.limit + 1;
  const end = Math.min(result.meta.currentPage * result.meta.limit, totalItems);
  const hasActiveFilter = supplierId !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="type-page-title">
            {t(kind === "deposits" ? "depositTitle" : "transactionTitle")}
          </h1>
          <p className="type-secondary mt-2">
            {t(kind === "deposits" ? "depositDescription" : "transactionDescription")}
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            type="button"
            onClick={openCreate}
            disabled={
              isSuppliersLoading ||
              isLoadingDepositOptions ||
              Boolean(supplierError) ||
              suppliers.length === 0
            }
          >
            <Plus aria-hidden="true" />
            {t(kind === "deposits" ? "actions.addDeposit" : "actions.addTransaction")}
          </Button>
        )}
      </header>

      {feedback && (
        <p role="status" className="text-sm text-success">
          {feedback}
        </p>
      )}
      {(error || supplierError) && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            {error || supplierError}
          </p>
          {!isLoading && error && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadRecords(page, pageSize, supplierId)}
            >
              {t("actions.retry")}
            </Button>
          )}
          {!isSuppliersLoading && supplierError && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSuppliers()}
            >
              {t("actions.retry")}
            </Button>
          )}
        </div>
      )}

      {isLoading || isSuppliersLoading ? (
        <Card className="min-h-64 items-center justify-center">
          <p role="status" className="text-sm text-muted-foreground">
            {t("feedback.loading")}
          </p>
        </Card>
      ) : error ? null : (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 sm:w-fit sm:min-w-72">
              <span className="shrink-0 text-sm text-muted-foreground">
                {t("fields.supplier")}
              </span>
              <select
                value={supplierId}
                onChange={(event) => {
                  setSupplierId(event.currentTarget.value);
                  setPage(1);
                }}
                aria-label={t("fields.supplier")}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none"
              >
                <option value="all">{t("filters.allSuppliers")}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            {hasActiveFilter && (
              <Button
                type="button"
                variant="ghost"
                className="self-start sm:self-auto"
                onClick={() => {
                  setSupplierId("all");
                  setPage(1);
                }}
              >
                {t("actions.clearFilter")}
              </Button>
            )}
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("resultsCount", { count: totalItems })}
            </p>
          </div>

          {result.data.length > 0 ? (
            <>
              <CardContent className="hidden p-0 md:block">
                <table className="w-full table-fixed text-start text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b border-border">
                      <th className="px-5 py-3.5 text-start font-medium">
                        {t("fields.supplier")}
                      </th>
                      <th className="px-5 py-3.5 text-end font-medium">
                        {t(kind === "deposits" ? "fields.depositAmount" : "fields.transferredAmount")}
                      </th>
                      <th className="px-5 py-3.5 text-start font-medium">
                        {t(kind === "deposits" ? "fields.depositDate" : "fields.timestamp")}
                      </th>
                      {kind === "transactions" && (
                        <th className="px-5 py-3.5 text-start font-medium">
                          {t("fields.comments")}
                        </th>
                      )}
                      <th className="w-36 px-3 py-3.5 text-end font-medium">
                        {t("fields.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.data.map((record) => (
                      <tr key={record._id} className="hover:bg-muted/30">
                        <th className="px-5 py-4 text-start font-medium">
                          <span className="block break-words">
                            {record.supplierId?.name ?? t("details.notAvailable")}
                          </span>
                          <span dir="auto" className="block text-xs text-muted-foreground">
                            {record.supplierId?.phoneNumber ?? t("details.notAvailable")}
                          </span>
                        </th>
                        <td dir="ltr" className="px-5 py-4 text-end tabular-nums">
                          {formatCurrency(record.amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDate(
                            record.date,
                            locale,
                            t("details.notAvailable"),
                          )}
                        </td>
                        {kind === "transactions" && (
                          <td className="px-5 py-4 text-muted-foreground">
                            <span className="block truncate">{record.comments || "—"}</span>
                          </td>
                        )}
                        <td className="px-2 py-3">
                          <RecordActions
                            record={record}
                            canManage={canManage}
                            onView={setViewingRecord}
                            onEdit={openEdit}
                            onDelete={setDeletingRecord}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <div className="grid gap-3 p-4 md:hidden">
                {result.data.map((record) => (
                  <article key={record._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-sm font-semibold">
                          {record.supplierId?.name ?? t("details.notAvailable")}
                        </h2>
                        <p dir="auto" className="mt-1 text-sm text-muted-foreground">
                          {record.supplierId?.phoneNumber ?? t("details.notAvailable")}
                        </p>
                      </div>
                      <RecordActions
                        record={record}
                        canManage={canManage}
                        onView={setViewingRecord}
                        onEdit={openEdit}
                        onDelete={setDeletingRecord}
                      />
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">
                          {t(kind === "deposits" ? "fields.depositAmount" : "fields.transferredAmount")}
                        </dt>
                        <dd dir="ltr" className="text-end tabular-nums">
                          {formatCurrency(record.amount, locale)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">
                          {t(kind === "deposits" ? "fields.depositDate" : "fields.timestamp")}
                        </dt>
                        <dd className="text-end">
                          {formatDate(
                            record.date,
                            locale,
                            t("details.notAvailable"),
                          )}
                        </dd>
                      </div>
                      {kind === "transactions" && record.comments && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("fields.comments")}</dt>
                          <dd className="max-w-[65%] break-words text-end">{record.comments}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                ))}
              </div>
              <footer className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{t("pagination.showing", { start, end, total: totalItems })}</span>
                  <label className="flex items-center gap-2">
                    <span>{t("pagination.pageSize")}</span>
                    <select
                      value={result.meta.limit}
                      onChange={(event) => {
                        const next = Number(event.currentTarget.value);
                        const nextSize = pageSizes.find((size) => size === next);
                        if (nextSize !== undefined) {
                          setPageSize(nextSize);
                          setPage(1);
                        }
                      }}
                      aria-label={t("pagination.pageSize")}
                      className="h-8 rounded-md border border-input bg-background px-2 text-foreground"
                    >
                      {pageSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={result.meta.currentPage <= 1}
                    onClick={() => setPage(result.meta.currentPage - 1)}
                  >
                    {t("pagination.previous")}
                  </Button>
                  <span className="min-w-20 text-center text-sm text-muted-foreground">
                    {t("pagination.page", {
                      page: result.meta.currentPage,
                      total: Math.max(1, result.meta.totalPages),
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={result.meta.currentPage >= result.meta.totalPages}
                    onClick={() => setPage(result.meta.currentPage + 1)}
                  >
                    {t("pagination.next")}
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {hasActiveFilter ? <Search aria-hidden="true" /> : <Plus aria-hidden="true" />}
              </span>
              <h2 className="mt-4 text-base font-semibold">
                {t(hasActiveFilter ? "empty.filteredTitle" : "empty.title")}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {t(hasActiveFilter ? "empty.filteredDescription" : "empty.description")}
              </p>
              {hasActiveFilter ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    setSupplierId("all");
                    setPage(1);
                  }}
                >
                  {t("actions.clearFilter")}
                </Button>
              ) : permissions.canCreate ? (
                <Button
                  type="button"
                  className="mt-5"
                  onClick={openCreate}
                  disabled={suppliers.length === 0 || isLoadingDepositOptions}
                >
                  <Plus aria-hidden="true" />
                  {t(kind === "deposits" ? "actions.addDeposit" : "actions.addTransaction")}
                </Button>
              ) : null}
            </div>
          )}
        </Card>
      )}

      <SupplierRecordFormSheet
        key={`${editorOpen}:${editingRecord?._id ?? "new"}:${kind}`}
        kind={kind}
        open={editorOpen}
        record={editingRecord}
        suppliers={suppliers}
        deposits={depositOptions}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingRecord(null);
        }}
        onSubmit={handleSave}
      />
      <SupplierRecordDetailsSheet
        kind={kind}
        record={viewingRecord}
        canManage={canManage}
        onOpenChange={(open) => {
          if (!open) setViewingRecord(null);
        }}
        onEdit={openEdit}
        onDelete={(record) => {
          if (!canManage) return;
          setViewingRecord(null);
          setDeletingRecord(record);
        }}
      />
      <SupplierRecordDeleteSheet
          kind={kind}
          record={deletingRecord}
          isDeleting={isDeleting}
          onOpenChange={(open) => {
            if (!open) setDeletingRecord(null);
          }}
          onConfirm={() => void handleDelete()}
        />
    </div>
  );
}

function RecordActions({
  record,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  record: SupplierFinancialRecord;
  canManage: boolean;
  onView: (record: SupplierFinancialRecord) => void;
  onEdit: (record: SupplierFinancialRecord) => void;
  onDelete: (record: SupplierFinancialRecord) => void;
}) {
  const t = useTranslations("supplierRecords");
  const supplierName = record.supplierId?.name ?? t("details.notAvailable");
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("actions.viewNamed", { name: supplierName })}
        title={t("actions.view")}
        onClick={() => onView(record)}
      >
        <Eye aria-hidden="true" />
      </Button>
      {canManage && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: supplierName })}
          title={t("actions.edit")}
          onClick={() => onEdit(record)}
          disabled={!record.supplierId?._id}
        >
          <Pencil aria-hidden="true" />
        </Button>
      )}
      {canManage && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.deleteNamed", { name: supplierName })}
          title={t("actions.delete")}
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(record)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
