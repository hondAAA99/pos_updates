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
import type { Locale } from "@/i18n/routing";
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

export function CashierDashboard({ locale }: CashierDashboardProps) {
  const t = useTranslations("cashierDashboard");
  const sales = useTranslations("saleWorkflow");
  const dashboard = useTranslations("dashboard");
  const [dateKey, setDateKey] = useState("2026-11-14");
  const [dateLabel, setDateLabel] = useState<string | null>(null);
  const [data, setData] = useState<CashierDashboardData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [viewingReceipt, setViewingReceipt] = useState<CashierReceipt | null>(
    null,
  );
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
      .then(() => getCashierDashboardData(dateKey))
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
  }, [dateKey, retryCount]);

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

  let branchName = data.branch.name;
  switch (data.branch._id) {
    case "downtown":
      branchName = dashboard("branchNames.downtown");
      break;
    case "nasrCity":
      branchName = dashboard("branchNames.nasrCity");
      break;
    case "alexandria":
      branchName = dashboard("branchNames.alexandria");
      break;
    case "giza":
      branchName = dashboard("branchNames.giza");
      break;
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

      <section className="grid grid-cols-[minmax(0,1.8fr)_minmax(18rem,1fr)] gap-4">
        <CashierReceiptsTable
          receipts={data.receipts}
          locale={locale}
          onView={setViewingReceipt}
        />
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
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {t("branchCard.completed")}
              </span>
              <span className="text-sm font-medium">
                {t("branchCard.completedCount", {
                  count: data.completedSales,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">
                {t("branchCard.salesTotal")}
              </span>
              <span dir="ltr" className="text-sm font-semibold">
                {formatCurrency(data.totalSales, locale)}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <CashierReceiptDetailsSheet
        receipt={viewingReceipt}
        branchName={branchName}
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
    </div>
  );
}
