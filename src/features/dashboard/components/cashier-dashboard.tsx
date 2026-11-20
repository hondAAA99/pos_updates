"use client";

import {
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  Plus,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateKey, formatNumber } from "@/lib/format";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getBranchDetailsFromApi } from "@/features/branches/services/branches-api-service";
import type { Branch, BranchSupply } from "@/features/branches/types/branch";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ApiClientError } from "@/lib/api-client";
import {
  getReceiptDetails,
  listReceipts,
  type ReceiptPage,
} from "@/features/sales/services/sales-api-service";
import {
  mapReceiptApiRecord,
  mapReceiptDetails,
  type ReceiptPrintData,
} from "@/features/sales/services/receipt-adapter";
import { ReceiptPrintDocument } from "@/features/sales/components/receipt-print-document";
import { getCashierDashboardData } from "../services/cashier-dashboard-service";
import type {
  CashierDashboardData,
  CashierReceipt,
} from "../types/cashier-dashboard";
import { DashboardKpiCard } from "./dashboard-kpi-card";
import { CashierReceiptDetailsSheet } from "./cashier-receipt-details-sheet";
import { CashierReceiptsTable } from "./cashier-receipts-table";
import { CreateSaleSheet } from "@/features/sales/components/create-sale-sheet";

type CashierDashboardProps = {
  locale: Locale;
};

type LoadState = "loading" | "ready" | "error";
type BranchLoadState = "loading" | "ready" | "error";
type ReceiptLoadState = "loading" | "ready" | "error";
type CashierReceiptPage = Omit<ReceiptPage, "data"> & {
  data: CashierReceipt[];
};

const SHOW_CASHIER_SUMMARY_CARDS = false;
const receiptPageSize = 10;

export function CashierDashboard({ locale }: CashierDashboardProps) {
  const t = useTranslations("cashierDashboard");
  const sales = useTranslations("saleWorkflow");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [dateKey, setDateKey] = useState("2026-11-14");
  const [dateLabel, setDateLabel] = useState<string | null>(null);
  const [data, setData] = useState<CashierDashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [supply, setSupply] = useState<BranchSupply | null>(null);
  const [branchLoadState, setBranchLoadState] =
    useState<BranchLoadState>("loading");
  const [branchLoadError, setBranchLoadError] = useState("");
  const [branchRetryCount, setBranchRetryCount] = useState(0);
  const [viewingReceipt, setViewingReceipt] = useState<CashierReceipt | null>(
    null,
  );
  const [receiptPage, setReceiptPage] =
    useState<CashierReceiptPage | null>(null);
  const [receiptPageNumber, setReceiptPageNumber] = useState(1);
  const [receiptLoadState, setReceiptLoadState] =
    useState<ReceiptLoadState>("loading");
  const [receiptLoadError, setReceiptLoadError] = useState("");
  const [receiptRetryCount, setReceiptRetryCount] = useState(0);
  const [printingReceiptId, setPrintingReceiptId] = useState<string | null>(
    null,
  );
  const [printReceipt, setPrintReceipt] = useState<ReceiptPrintData | null>(
    null,
  );
  const [printError, setPrintError] = useState("");
  const [createSaleOpen, setCreateSaleOpen] = useState(false);
  const [saleFeedback, setSaleFeedback] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      setDateKey(formatDateKey(now));
      setDateLabel(formatDate(now, locale, { dateStyle: "full" }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale]);

  useEffect(() => {
    let active = true;

    void Promise.resolve()
      .then(() => {
        if (!user?.branchId || user.role !== "cashier") {
          throw new Error("The current cashier has no assigned branch.");
        }
        return getCashierDashboardData(dateKey, user.branchId, user.name);
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [dateKey, retryCount, user]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(async () => {
      if (!active) return;
      setBranch(null);
      setSupply(null);
      setBranchLoadError("");

      if (!token || user?.role !== "cashier" || !user.branchId) {
        setBranchLoadState("error");
        setBranchLoadError(t("branchCard.unassigned"));
        return;
      }

      setBranchLoadState("loading");
      try {
        const details = await getBranchDetailsFromApi(token, user.branchId);
        if (!active) return;
        setBranch(details.branch);
        setSupply(details.supply);
        setBranchLoadState("ready");
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          logout();
          router.replace("/login");
        }
        setBranchLoadState("error");
        setBranchLoadError(t("branchCard.loadError"));
      }
    });

    return () => {
      active = false;
    };
  }, [branchRetryCount, logout, router, t, token, user]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(async () => {
      if (!active) return;
      setReceiptLoadState("loading");
      setReceiptLoadError("");

      if (!token || user?.role !== "cashier") {
        setReceiptPage(null);
        setReceiptLoadState("error");
        setReceiptLoadError(t("receipts.loadError"));
        return;
      }

      try {
        const result = await listReceipts(token, {
          role: "cashier",
          page: receiptPageNumber,
          limit: receiptPageSize,
        });
        const receipts = result.data.map(mapReceiptApiRecord);
        if (!active) return;
        setReceiptPage({ ...result, data: receipts });
        setReceiptPageNumber(result.page);
        setReceiptLoadState("ready");
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          logout();
          router.replace("/login");
        }
        setReceiptPage(null);
        setReceiptLoadState("error");
        setReceiptLoadError(t("receipts.loadError"));
      }
    });

    return () => {
      active = false;
    };
  }, [
    logout,
    receiptPageNumber,
    receiptRetryCount,
    router,
    t,
    token,
    user?.role,
  ]);

  useEffect(() => {
    if (!printReceipt) return;

    function handleAfterPrint() {
      setPrintReceipt(null);
    }

    window.addEventListener("afterprint", handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 100);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printReceipt]);

  if (loadState === "loading") {
    return (
      <div className="mx-auto w-full max-w-[90rem] space-y-6">
        <Card
          aria-label={t("states.loading")}
          className="min-h-64 items-center justify-center"
        >
          <p role="status" className="text-sm text-muted-foreground">
            {t("states.loading")}
          </p>
        </Card>
      </div>
    );
  }

  if (loadState === "error" || !data) {
    return (
      <div className="mx-auto w-full max-w-[90rem]">
        <Card className="min-h-64 items-center justify-center gap-4 text-center">
          <p role="alert" className="text-sm text-destructive">
            {t("states.loadError")}
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
      </div>
    );
  }

  const branchName =
    branch?.name ??
    (branchLoadState === "loading"
      ? t("branchCard.loading")
      : branchLoadState === "error" && user?.branchId
        ? t("branchCard.loadError")
        : t("branchCard.unassigned"));

  async function handlePrintReceipt(receipt: CashierReceipt) {
    if (!token || printingReceiptId) return;

    setPrintError("");
    setPrintingReceiptId(receipt._id);
    try {
      const details = await getReceiptDetails(token, receipt._id);
      setPrintReceipt(mapReceiptDetails(details, receipt._id));
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
      }
      setPrintError(t("receipts.printError"));
    } finally {
      setPrintingReceiptId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6">
      <section className="flex items-end justify-between gap-6">
        <div>
          <p
            aria-label={t("todayLabel")}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            {dateLabel}
          </p>
          <h1 className="type-page-title mt-2">
            {t("welcome", { name: data.cashierName })}
          </h1>
          <p className="type-secondary mt-2">
            {t("overviewDescription", { branch: branchName })}
          </p>
        </div>
        <Button type="button" size="lg" onClick={() => setCreateSaleOpen(true)}>
          <Plus aria-hidden="true" />
          {t("actions.createSale")}
        </Button>
      </section>

      {saleFeedback && (
        <p role="status" className="text-sm text-success">
          {saleFeedback}
        </p>
      )}

      {SHOW_CASHIER_SUMMARY_CARDS && (
        <section
          aria-label={t("kpis.sectionLabel")}
          className="grid grid-cols-4 gap-4"
        >
          <DashboardKpiCard
            title={t("kpis.sales")}
            value={formatCurrency(data.totalSales, locale)}
            icon={Banknote}
            locale={locale}
          />
          <DashboardKpiCard
            title={t("kpis.receipts")}
            value={formatNumber(data.receiptCount, locale)}
            icon={ReceiptText}
            locale={locale}
          />
          <DashboardKpiCard
            title={t("kpis.completedSales")}
            value={formatNumber(data.completedSales, locale)}
            icon={ChartNoAxesCombined}
            locale={locale}
          />
          <DashboardKpiCard
            title={t("kpis.averageReceipt")}
            value={formatCurrency(data.averageReceipt, locale)}
            icon={ReceiptText}
            locale={locale}
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,1fr)]">
        <div className="space-y-3">
          {printError && (
            <p role="alert" className="text-sm text-destructive">
              {printError}
            </p>
          )}
        <CashierReceiptsTable
          receipts={
            receiptPage?.data ?? []
          }
          total={receiptPage?.total ?? 0}
          page={receiptPage?.page ?? receiptPageNumber}
          totalPages={receiptPage?.totalPages ?? 0}
          loadState={receiptLoadState}
          error={receiptLoadError}
          printingReceiptId={printingReceiptId}
          locale={locale}
          onView={setViewingReceipt}
          onPrint={handlePrintReceipt}
          onRetry={() => setReceiptRetryCount((count) => count + 1)}
          onPageChange={setReceiptPageNumber}
        />
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t("branchCard.title")}</CardTitle>
            <CardDescription>{t("branchCard.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {t("branchCard.branch")}
              </span>
              <span className="text-sm font-medium">{branchName}</span>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold">
                {t("branchCard.salesSection")}
              </h3>
              {branchLoadState === "loading" ? (
                <p role="status" className="mt-3 text-sm text-muted-foreground">
                  {t("branchCard.loading")}
                </p>
              ) : branchLoadState === "error" ? (
                <div className="mt-3 space-y-3">
                  <p role="alert" className="text-sm text-destructive">
                    {branchLoadError}
                  </p>
                  {user?.role === "cashier" && user.branchId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBranchRetryCount((count) => count + 1)}
                    >
                      {t("actions.retry")}
                    </Button>
                  )}
                </div>
              ) : supply ? (
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <dt className="text-xs text-muted-foreground">
                      {t("branchCard.salesSum")}
                    </dt>
                    <dd dir="ltr" className="text-sm font-medium">
                      {formatNumber(supply.salesSum, locale)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs text-muted-foreground">
                      {t("branchCard.salesTotal")}
                    </dt>
                    <dd dir="ltr" className="text-sm font-medium">
                      {formatNumber(supply.salesTotal, locale)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs text-muted-foreground">
                      {t("branchCard.maintenanceSum")}
                    </dt>
                    <dd dir="ltr" className="text-sm font-medium">
                      {formatNumber(supply.maintenanceSum, locale)}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs text-muted-foreground">
                      {t("branchCard.maintenanceTotal")}
                    </dt>
                    <dd dir="ltr" className="text-sm font-medium">
                      {formatNumber(supply.maintenanceTotal, locale)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("branchCard.supplyUnavailable")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <CashierReceiptDetailsSheet
        receipt={viewingReceipt}
        branchName={branchName}
        cashierName={data.cashierName}
        locale={locale}
        onOpenChange={(open) => {
          if (!open) setViewingReceipt(null);
        }}
      />
      {createSaleOpen && (
        <CreateSaleSheet
          key={createSaleOpen ? "open" : "closed"}
          open={createSaleOpen}
          locale={locale}
          onOpenChange={setCreateSaleOpen}
          onSaleComplete={(receiptId) => {
            setSaleFeedback(
              sales("feedback.completed", { reference: receiptId }),
            );
            setCreateSaleOpen(false);
          }}
        />
      )}
      {printReceipt && (
        <ReceiptPrintDocument receipt={printReceipt} locale={locale} />
      )}
    </div>
  );
}
