"use client";

import { Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { listBranchesFromApi } from "@/features/branches/services/branches-api-service";
import type { Branch } from "@/features/branches/types/branch";
import {
  getReceiptPaymentTranslationKey,
  getReceiptStatusTranslationKey,
} from "@/features/dashboard/utils/receipt-labels";
import type {
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";
import type { Locale } from "@/i18n/routing";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getReceiptRelationshipId,
  getReceiptRelationshipName,
  mapReceiptDetails,
  type ReceiptPrintData,
} from "../services/receipt-adapter";
import {
  deleteReceipt,
  getReceiptDetails,
  listReceiptDocuments,
  searchReceipt,
  updateReceipt,
} from "../services/sales-api-service";
import type {
  ReceiptApiDocument,
  ReceiptUpdateRequest,
} from "../services/sales-api-service";
import type {
  SalesManagementFilters,
  SalesManagementPage,
  SalesManagementRecord,
} from "../types/sales-management";
import { SalesReceiptDeleteDialog } from "./sales-receipt-delete-dialog";
import { SalesReceiptDetailsSheet } from "./sales-receipt-details-sheet";
import { SalesReceiptEditDialog } from "./sales-receipt-edit-dialog";

type SalesManagementProps = {
  locale: Locale;
};

type LoadState = "loading" | "ready" | "error";
type DetailsState = "loading" | "ready" | "error";

const initialFilters: SalesManagementFilters = {
  search: "",
  branchId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const statuses = ["pending", "paid", "canceled"] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getPaymentLabel(
  method: string | undefined,
  t: ReturnType<typeof useTranslations<"cashierDashboard">>,
  unavailable: string,
): string {
  if (!method) return unavailable;
  const normalized = method.toLocaleLowerCase();
  const key = getReceiptPaymentTranslationKey(
    normalized as ReceiptPaymentMethod,
  );
  return key ? t(key) : method;
}

export function SalesManagement({ locale }: SalesManagementProps) {
  const t = useTranslations("salesManagement");
  const cashier = useTranslations("cashierDashboard");
  const router = useRouter();
  const { token, user, isLoading: authLoading, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] =
    useState<SalesManagementFilters>(initialFilters);
  const [data, setData] = useState<SalesManagementPage | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesError, setBranchesError] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedReceipt, setSelectedReceipt] =
    useState<SalesManagementRecord | null>(null);
  const [receiptDetails, setReceiptDetails] =
    useState<ReceiptPrintData | null>(null);
  const [detailsState, setDetailsState] = useState<DetailsState>("loading");
  const [detailsError, setDetailsError] = useState("");
  const detailsRequestId = useRef(0);
  const [editingReceipt, setEditingReceipt] =
    useState<ReceiptApiDocument | null>(null);
  const [deletingReceipt, setDeletingReceipt] =
    useState<ReceiptApiDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [operationError, setOperationError] = useState("");

  const handleUnauthorized = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiClientError) || error.status !== 401) {
        return false;
      }
      logout();
      router.replace("/login");
      return true;
    },
    [logout, router],
  );

  useEffect(() => {
    let active = true;

    async function loadBranches() {
      setBranchesError("");
      if (!token || !isAdmin) {
        setBranches(user?.branch ? [user.branch] : []);
        return;
      }

      try {
        const result = await listBranchesFromApi(token);
        if (active) setBranches(result);
      } catch (error) {
        if (!active) return;
        if (handleUnauthorized(error)) return;
        setBranchesError(t("states.branchesError"));
      }
    }

    if (!authLoading) void loadBranches();
    return () => {
      active = false;
    };
  }, [
    authLoading,
    handleUnauthorized,
    isAdmin,
    retryCount,
    t,
    token,
    user?.branch,
  ]);

  useEffect(() => {
    let active = true;

    async function loadReceipts() {
      if (authLoading) return;
      if (!token) {
        setLoadState("error");
        setLoadError(t("states.unauthorized"));
        return;
      }

      setLoadState("loading");
      setLoadError("");
      try {
        if (filters.search.trim()) {
          if (!isAdmin) {
            setData({
              meta: {
                totalDoc: 0,
                currentPage: 1,
                totalPages: 0,
                limit: filters.limit,
              },
              data: [],
            });
            setLoadState("ready");
            return;
          }

          let foundReceipt: ReceiptApiDocument;
          try {
            foundReceipt = await searchReceipt(token, filters.search);
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 404) {
              if (!active) return;
              setData({
                meta: {
                  totalDoc: 0,
                  currentPage: 1,
                  totalPages: 0,
                  limit: filters.limit,
                },
                data: [],
              });
              setLoadState("ready");
              return;
            }
            throw error;
          }

          if (!active) return;
          const branchId = getReceiptRelationshipId(foundReceipt.branchId);
          const timestampDate = foundReceipt.timestamp?.slice(0, 10) ?? "";
          const matchesFilters =
            (!filters.branchId || branchId === filters.branchId) &&
            (!filters.status || foundReceipt.status === filters.status) &&
            (!filters.dateFrom || timestampDate >= filters.dateFrom) &&
            (!filters.dateTo || timestampDate <= filters.dateTo);
          const matchingReceipts = matchesFilters ? [foundReceipt] : [];
          setData({
            meta: {
              totalDoc: matchingReceipts.length,
              currentPage: 1,
              totalPages: matchingReceipts.length ? 1 : 0,
              limit: filters.limit,
            },
            data: matchingReceipts,
          });
          setLoadState("ready");
          return;
        }

        const result = await listReceiptDocuments(token, {
          page: filters.page,
          limit: filters.limit,
          ...(isAdmin && filters.branchId
            ? { branchId: filters.branchId }
            : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
          ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
        });
        if (!active) return;

        if (
          filters.page > 1 &&
          result.data.length === 0 &&
          result.meta.totalDoc <= (filters.page - 1) * filters.limit
        ) {
          setFilters((current) => ({ ...current, page: current.page - 1 }));
          return;
        }

        setData(result);
        setLoadState("ready");
      } catch (error) {
        if (!active) return;
        if (handleUnauthorized(error)) return;
        setLoadState("error");
        setLoadError(getErrorMessage(error, t("states.error")));
      }
    }

    const timer = window.setTimeout(
      () => void loadReceipts(),
      filters.search.trim() ? 300 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    authLoading,
    filters,
    handleUnauthorized,
    isAdmin,
    retryCount,
    t,
    token,
  ]);

  const loadDetails = useCallback(
    async (receiptId: string) => {
      const requestId = ++detailsRequestId.current;
      if (!token) {
        setDetailsState("error");
        setDetailsError(t("states.unauthorized"));
        return;
      }

      setDetailsState("loading");
      setDetailsError("");
      try {
        const response = await getReceiptDetails(token, receiptId);
        if (requestId !== detailsRequestId.current) return;
        setReceiptDetails(mapReceiptDetails(response, receiptId));
        setDetailsState("ready");
      } catch (error) {
        if (requestId !== detailsRequestId.current) return;
        if (handleUnauthorized(error)) return;
        setDetailsState("error");
        setDetailsError(getErrorMessage(error, t("states.detailsError")));
      }
    },
    [handleUnauthorized, t, token],
  );

  function updateFilters(update: Partial<SalesManagementFilters>) {
    setFeedback("");
    setOperationError("");
    setFilters((current) => ({ ...current, ...update, page: 1 }));
  }

  function openReceipt(receipt: SalesManagementRecord) {
    setSelectedReceipt(receipt);
    setReceiptDetails(null);
    void loadDetails(receipt._id);
  }

  function getBranchName(receipt: ReceiptApiDocument): string {
    const populatedName = getReceiptRelationshipName(receipt.branchId);
    if (populatedName) return populatedName;

    const branchId =
      getReceiptRelationshipId(receipt.branchId) ?? user?.branchId;
    const branch = branches.find((item) => item._id === branchId);
    return branch?.name ?? user?.branch?.name ?? t("table.unavailable");
  }

  async function saveReceipt(request: ReceiptUpdateRequest) {
    if (!token || !editingReceipt) {
      throw new Error(t("states.unauthorized"));
    }

    try {
      await updateReceipt(token, editingReceipt._id, request);
      const savedReceiptId = editingReceipt._id;
      setEditingReceipt(null);
      setFeedback(t("feedback.updated"));
      setOperationError("");
      setRetryCount((count) => count + 1);
      if (selectedReceipt?._id === savedReceiptId) {
        void loadDetails(savedReceiptId);
      }
    } catch (error) {
      handleUnauthorized(error);
      throw error;
    }
  }

  async function confirmDelete() {
    if (!token || !deletingReceipt) return;

    setIsDeleting(true);
    setOperationError("");
    try {
      await deleteReceipt(token, deletingReceipt._id);
      const deletedId = deletingReceipt._id;
      setDeletingReceipt(null);
      setFeedback(t("feedback.deleted"));
      setRetryCount((count) => count + 1);
      if (selectedReceipt?._id === deletedId) {
        setSelectedReceipt(null);
        setReceiptDetails(null);
      }
    } catch (error) {
      if (handleUnauthorized(error)) {
        setDeletingReceipt(null);
      } else {
        setOperationError(getErrorMessage(error, t("states.deleteError")));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const canEdit = isAdmin;
  const hasFilters = Boolean(
    filters.search ||
      filters.branchId ||
      filters.status ||
      filters.dateFrom ||
      filters.dateTo,
  );
  const statusStyles: Partial<Record<ReceiptSaleStatus, string>> = {
    pending: "bg-warning/15 text-warning",
    paid: "bg-success/10 text-success",
    canceled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="type-page-title">{t("title")}</h1>
        <p className="type-secondary mt-2">{t("description")}</p>
      </header>

      {branchesError && (
        <p role="alert" className="text-sm text-destructive">
          {branchesError}
        </p>
      )}
      {feedback && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {feedback}
        </p>
      )}
      {operationError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {operationError}
        </p>
      )}

      {loadState === "loading" && (
        <Card className="min-h-40 items-center justify-center">
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.loading")}
          </p>
        </Card>
      )}

      {loadState === "error" && (
        <Card className="min-h-40 items-center justify-center gap-4 text-center">
          <p role="alert" className="text-sm text-destructive">
            {loadError || t("states.error")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            {t("actions.retry")}
          </Button>
        </Card>
      )}

      {loadState === "ready" && data && (
        <SalesRecordsCard
          records={data.data}
          meta={data.meta}
          filters={filters}
          branches={branches}
          locale={locale}
          isAdmin={isAdmin}
          hasFilters={hasFilters}
          t={t}
          cashier={cashier}
          onFilterChange={updateFilters}
          onPageChange={(page) =>
            setFilters((current) => ({ ...current, page }))
          }
          onView={openReceipt}
          onEdit={setEditingReceipt}
          onDelete={setDeletingReceipt}
          getBranchName={getBranchName}
          statusStyles={statusStyles}
        />
      )}

      <SalesReceiptDetailsSheet
        open={selectedReceipt !== null}
        receipt={selectedReceipt}
        details={receiptDetails}
        state={detailsState}
        error={detailsError}
        locale={locale}
        canEdit={canEdit}
        onOpenChange={(open) => {
          if (!open) {
            detailsRequestId.current += 1;
            setSelectedReceipt(null);
            setReceiptDetails(null);
          }
        }}
        onRetry={() => {
          if (selectedReceipt) void loadDetails(selectedReceipt._id);
        }}
        onEdit={() => {
          if (selectedReceipt && isAdmin) setEditingReceipt(selectedReceipt);
        }}
      />

      <SalesReceiptEditDialog
        key={editingReceipt?._id ?? "closed"}
        open={editingReceipt !== null}
        receipt={editingReceipt}
        branches={branches}
        onOpenChange={(open) => {
          if (!open) setEditingReceipt(null);
        }}
        onSave={saveReceipt}
      />

      <SalesReceiptDeleteDialog
        receipt={isAdmin ? deletingReceipt : null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) setDeletingReceipt(null);
        }}
        onConfirm={() => void confirmDelete()}
      />

    </div>
  );
}

function SalesRecordsCard({
  records,
  meta,
  filters,
  branches,
  locale,
  isAdmin,
  hasFilters,
  t,
  cashier,
  onFilterChange,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  getBranchName,
  statusStyles,
}: {
  records: SalesManagementRecord[];
  meta: SalesManagementPage["meta"];
  filters: SalesManagementFilters;
  branches: Branch[];
  locale: Locale;
  isAdmin: boolean;
  hasFilters: boolean;
  t: ReturnType<typeof useTranslations<"salesManagement">>;
  cashier: ReturnType<typeof useTranslations<"cashierDashboard">>;
  onFilterChange: (update: Partial<SalesManagementFilters>) => void;
  onPageChange: (page: number) => void;
  onView: (record: SalesManagementRecord) => void;
  onEdit: (record: ReceiptApiDocument) => void;
  onDelete: (record: ReceiptApiDocument) => void;
  getBranchName: (receipt: ReceiptApiDocument) => string;
  statusStyles: Partial<Record<ReceiptSaleStatus, string>>;
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="border-b border-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{t("records.title")}</CardTitle>
            <CardDescription>{t("records.description")}</CardDescription>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t("records.count", { count: meta.totalDoc })}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative sm:col-span-2 xl:col-span-2">
            <span className="sr-only">{t("filters.search")}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.search}
              disabled={!isAdmin}
              aria-describedby="receipt-search-note"
              onChange={(event) =>
                onFilterChange({ search: event.currentTarget.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9"
            />
            <span id="receipt-search-note" className="sr-only">
              {isAdmin
                ? t("filters.searchExact")
                : t("filters.searchAdminOnly")}
            </span>
          </label>
          {isAdmin && (
            <label>
              <span className="sr-only">{t("filters.branch")}</span>
              <select
                value={filters.branchId}
                onChange={(event) =>
                  onFilterChange({ branchId: event.currentTarget.value })
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              >
                <option value="">{t("filters.allBranches")}</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="sr-only">{t("filters.status")}</span>
            <select
              value={filters.status}
              onChange={(event) =>
                onFilterChange({ status: event.currentTarget.value })
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            >
              <option value="">{t("filters.allStatuses")}</option>
              {statuses.map((status) => {
                const key = getReceiptStatusTranslationKey(status);
                return (
                  <option key={status} value={status}>
                    {key ? cashier(key) : status}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("filters.from")}</span>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                onFilterChange({ dateFrom: event.currentTarget.value })
              }
              className="w-40"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("filters.to")}</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                onFilterChange({ dateTo: event.currentTarget.value })
              }
              className="w-40"
            />
          </label>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange(initialFilters)}
            >
              <X aria-hidden="true" />
              {t("filters.clear")}
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isAdmin
            ? t("filters.searchExact")
            : t("filters.searchAdminOnly")}
        </p>
      </CardHeader>

      {records.length > 0 ? (
        <>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-[1350px] w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th data-column-align="center" className="w-48 px-4 py-3 font-medium">
                    {t("table.reference")}
                  </th>
                  <th data-column-align="center" className="w-44 px-4 py-3 font-medium">
                    {t("table.dateTime")}
                  </th>
                  <th className="w-32 px-4 py-3 text-start font-medium">
                    {t("table.branch")}
                  </th>
                  <th className="w-36 px-4 py-3 text-start font-medium">
                    {t("table.cashier")}
                  </th>
                  <th className="w-36 px-4 py-3 text-start font-medium">
                    {t("table.salesman")}
                  </th>
                  <th data-column-align="center" className="w-36 px-4 py-3 font-medium">
                    {t("table.amount")}
                  </th>
                  <th className="w-32 px-4 py-3 text-start font-medium">
                    {t("table.paymentMethod")}
                  </th>
                  <th className="w-36 px-4 py-3 text-start font-medium">
                    {t("table.status")}
                  </th>
                  <th data-column-align="actions" className="w-32 px-3 py-3 font-medium">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record) => {
                  const amount =
                    record.price_after_sale ?? record.receiptPrice;
                  const status = (record.status ?? "") as ReceiptSaleStatus;
                  const statusKey = getReceiptStatusTranslationKey(status);
                  return (
                    <tr key={record._id} className="hover:bg-muted/30">
                      <th dir="ltr" data-column-align="center" className="px-4 py-3 font-medium">
                        {record.receiptNumber}
                      </th>
                      <td dir="ltr" data-column-align="center" className="px-4 py-3 text-muted-foreground">
                        {record.timestamp
                          ? formatDate(record.timestamp, locale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : t("table.unavailable")}
                      </td>
                      <td className="px-4 py-3">{getBranchName(record)}</td>
                      <td className="px-4 py-3">
                        {getReceiptRelationshipName(record.cashierId) ??
                          t("table.unavailable")}
                      </td>
                      <td className="px-4 py-3">
                        {getReceiptRelationshipName(record.employeeId) ??
                          t("table.unavailable")}
                      </td>
                      <td dir="ltr" data-column-align="center" className="px-4 py-3 font-medium">
                        {amount === undefined
                          ? t("table.unavailable")
                          : formatCurrency(amount, locale)}
                      </td>
                      <td className="px-4 py-3">
                        {getPaymentLabel(
                          record.payment_method,
                          cashier,
                          t("table.unavailable"),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[status] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {statusKey ? cashier(statusKey) : status}
                        </span>
                      </td>
                      <td data-column-align="actions" className="px-2 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("table.viewNamed", {
                              reference: record.receiptNumber,
                            })}
                            title={t("table.view")}
                            onClick={() => onView(record)}
                          >
                            <Eye aria-hidden="true" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t("table.editNamed", {
                                  reference: record.receiptNumber,
                                })}
                                title={t("table.edit")}
                                onClick={() => onEdit(record)}
                              >
                                <Pencil aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t("table.deleteNamed", {
                                  reference: record.receiptNumber,
                                })}
                                title={t("table.delete")}
                                onClick={() => onDelete(record)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
          <footer className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-sm text-muted-foreground">
              {t("records.page", {
                current: meta.currentPage,
                total: meta.totalPages,
              })}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.currentPage <= 1}
                onClick={() => onPageChange(meta.currentPage - 1)}
              >
                {t("actions.previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  meta.totalPages === 0 || meta.currentPage >= meta.totalPages
                }
                onClick={() => onPageChange(meta.currentPage + 1)}
              >
                {t("actions.next")}
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex min-h-48 items-center justify-center p-8 text-center">
          <div>
            <p className="font-medium">{t("records.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("records.emptyDescription")}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
