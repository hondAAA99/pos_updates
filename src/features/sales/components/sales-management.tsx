"use client";

import {
  Banknote,
  Eye,
  ReceiptText,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardKpiCard } from "@/features/dashboard/components/dashboard-kpi-card";
import { CashierReceiptDetailsSheet } from "@/features/dashboard/components/cashier-receipt-details-sheet";
import type {
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";
import { listBranches } from "@/features/branches/services/branches-service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import {
  getSalesManagementBranchName,
  getSalesManagementData,
} from "../services/sales-service";
import type {
  AdminSalesManagementData,
  SalesManagementFilters,
  SalesManagementRecord,
} from "../types/sales-management";

type SalesManagementProps = {
  locale: Locale;
};

type LoadState = "loading" | "ready" | "error";

const initialFilters: SalesManagementFilters = {
  search: "",
  branchId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const statuses: ReceiptSaleStatus[] = [
  "completed",
  "rejected",
  "refunded",
  "voided",
];

export function SalesManagement({ locale }: SalesManagementProps) {
  const t = useTranslations("salesManagement");
  const dashboard = useTranslations("dashboard");
  const [filters, setFilters] =
    useState<SalesManagementFilters>(initialFilters);
  const [data, setData] = useState<AdminSalesManagementData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedRecord, setSelectedRecord] =
    useState<SalesManagementRecord | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const result = getSalesManagementData(filters);
        if (active) {
          setData(result);
          setLoadState("ready");
        }
      } catch {
        if (active) setLoadState("error");
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [filters, retryCount]);

  function updateFilters(update: Partial<SalesManagementFilters>) {
    setLoadState("loading");
    setFilters((current) => ({ ...current, ...update, page: 1 }));
  }

  const branches = listBranches();
  const branchLabel = (branchId?: string) => {
    switch (branchId) {
      case "downtown":
        return dashboard("branchNames.downtown");
      case "nasrCity":
        return dashboard("branchNames.nasrCity");
      case "alexandria":
        return dashboard("branchNames.alexandria");
      case "giza":
        return dashboard("branchNames.giza");
      default:
        return getSalesManagementBranchName(branchId) ?? t("table.unavailable");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6">
      <header>
        <h1 className="type-page-title">{t("title")}</h1>
        <p className="type-secondary mt-2">{t("description")}</p>
      </header>

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
            {t("states.error")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoadState("loading");
              setRetryCount((count) => count + 1);
            }}
          >
            {t("actions.retry")}
          </Button>
        </Card>
      )}

      {loadState === "ready" && data && (
        <>
          <section aria-label={t("summary.title")} className="grid grid-cols-4 gap-4">
            <DashboardKpiCard
              title={t("summary.totalSales")}
              value={formatCurrency(data.summary.totalSalesAmount, locale)}
              icon={Banknote}
              locale={locale}
            />
            <DashboardKpiCard
              title={t("summary.receipts")}
              value={formatNumber(data.summary.totalReceipts, locale)}
              icon={ReceiptText}
              locale={locale}
            />
            <DashboardKpiCard
              title={t("summary.completed")}
              value={formatNumber(data.summary.completedSales, locale)}
              icon={ReceiptText}
              locale={locale}
            />
            <DashboardKpiCard
              title={t("summary.rejected")}
              value={formatNumber(data.summary.rejectedSales, locale)}
              icon={RotateCcw}
              locale={locale}
            />
          </section>

          <SalesRecordsCard
            records={data.page.data}
            meta={data.page.meta}
            filters={filters}
            branches={branches}
            locale={locale}
            t={t}
            branchLabel={branchLabel}
            onFilterChange={updateFilters}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
            onView={setSelectedRecord}
          />

          <section className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analysis.branchesTitle")}</CardTitle>
                <CardDescription>{t("analysis.branchesDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {data.salesByBranch.length > 0 ? (
                  <table className="w-full text-start text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 text-start font-medium">
                          {t("table.branch")}
                        </th>
                        <th className="py-2 text-end font-medium">
                          {t("analysis.receipts")}
                        </th>
                        <th className="py-2 text-end font-medium">
                          {t("summary.totalSales")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.salesByBranch.map((item) => (
                        <tr key={item.branch._id}>
                          <th className="py-3 text-start font-medium">
                            {branchLabel(item.branch._id)}
                          </th>
                          <td className="py-3 text-end">
                            {formatNumber(item.receiptCount, locale)}
                          </td>
                          <td dir="ltr" className="py-3 text-end font-medium">
                            {formatCurrency(item.salesAmount, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyAnalysis label={t("analysis.noBranchData")} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("analysis.productsTitle")}</CardTitle>
                <CardDescription>{t("analysis.productsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {data.salesByProduct.length > 0 ? (
                  <table className="w-full text-start text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 text-start font-medium">
                          {t("analysis.product")}
                        </th>
                        <th className="py-2 text-end font-medium">
                          {t("analysis.quantity")}
                        </th>
                        <th className="py-2 text-end font-medium">
                          {t("analysis.revenue")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.salesByProduct.map((product) => (
                        <tr key={product.productId}>
                          <th className="py-3 text-start font-medium">
                            {product.productName}
                          </th>
                          <td className="py-3 text-end">
                            {formatNumber(product.quantity, locale)}
                          </td>
                          <td dir="ltr" className="py-3 text-end font-medium">
                            {formatCurrency(product.revenue, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyAnalysis label={t("analysis.noProductData")} />
                )}
              </CardContent>
            </Card>
          </section>

          <CashierReceiptDetailsSheet
            receipt={selectedRecord?.receipt ?? null}
            branchName={branchLabel(selectedRecord?.branchId)}
            cashierName={selectedRecord?.cashierName}
            locale={locale}
            onOpenChange={(open) => {
              if (!open) setSelectedRecord(null);
            }}
          />
        </>
      )}
    </div>
  );
}

function SalesRecordsCard({
  records,
  meta,
  filters,
  branches,
  locale,
  t,
  branchLabel,
  onFilterChange,
  onPageChange,
  onView,
}: {
  records: SalesManagementRecord[];
  meta: AdminSalesManagementData["page"]["meta"];
  filters: SalesManagementFilters;
  branches: ReturnType<typeof listBranches>;
  locale: Locale;
  t: ReturnType<typeof useTranslations<"salesManagement">>;
  branchLabel: (branchId?: string) => string;
  onFilterChange: (update: Partial<SalesManagementFilters>) => void;
  onPageChange: (page: number) => void;
  onView: (record: SalesManagementRecord) => void;
}) {
  const cashier = useTranslations("cashierDashboard");
  const hasFilters =
    Boolean(filters.search || filters.branchId || filters.status) ||
    Boolean(filters.dateFrom || filters.dateTo);

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
        <div className="mt-4 grid grid-cols-5 gap-3">
          <label className="relative col-span-2">
            <span className="sr-only">{t("filters.search")}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filters.search}
              onChange={(event) =>
                onFilterChange({ search: event.currentTarget.value })
              }
              placeholder={t("filters.searchPlaceholder")}
              className="ps-9"
            />
          </label>
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
                  {branchLabel(branch._id)}
                </option>
              ))}
            </select>
          </label>
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
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {cashier(`statuses.${status}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
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
      </CardHeader>

      {records.length > 0 ? (
        <>
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-[1350px] w-full table-fixed text-start text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="w-48 px-4 py-3 text-start font-medium">{t("table.reference")}</th>
                  <th className="w-44 px-4 py-3 text-start font-medium">{t("table.dateTime")}</th>
                  <th className="w-32 px-4 py-3 text-start font-medium">{t("table.branch")}</th>
                  <th className="w-36 px-4 py-3 text-start font-medium">{t("table.cashier")}</th>
                  <th className="w-36 px-4 py-3 text-start font-medium">{t("table.salesman")}</th>
                  <th className="w-36 px-4 py-3 text-end font-medium">{t("table.amount")}</th>
                  <th className="w-32 px-4 py-3 text-start font-medium">{t("table.paymentMethod")}</th>
                  <th className="w-36 px-4 py-3 text-start font-medium">{t("table.status")}</th>
                  <th className="w-16 px-3 py-3 text-end font-medium">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record) => (
                  <tr key={record.receipt._id} className="hover:bg-muted/30">
                    <th dir="ltr" className="px-4 py-3 text-start font-medium">
                      {record.receipt.referenceNumber}
                    </th>
                    <td dir="ltr" className="px-4 py-3 text-muted-foreground">
                      {formatDate(record.receipt.timestamp, locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">{branchLabel(record.branchId)}</td>
                    <td className="px-4 py-3">
                      {record.cashierName ?? t("table.unavailable")}
                    </td>
                    <td className="px-4 py-3">{record.receipt.salesmanName}</td>
                    <td dir="ltr" className="px-4 py-3 text-end font-medium">
                      {formatCurrency(record.receipt.totalAmount, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {cashier(`paymentMethods.${record.receipt.paymentMethod}`)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusLabel status={record.receipt.status} t={cashier} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("table.viewNamed", {
                            reference: record.receipt.referenceNumber,
                          })}
                          title={t("table.view")}
                          onClick={() => onView(record)}
                        >
                          <Eye aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                disabled={meta.currentPage >= meta.totalPages}
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

function StatusLabel({
  status,
  t,
}: {
  status: ReceiptSaleStatus;
  t: ReturnType<typeof useTranslations<"cashierDashboard">>;
}) {
  const styles: Record<ReceiptSaleStatus, string> = {
    completed: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
    refunded: "bg-warning/15 text-warning",
    voided: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {t(`statuses.${status}`)}
    </span>
  );
}

function EmptyAnalysis({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
