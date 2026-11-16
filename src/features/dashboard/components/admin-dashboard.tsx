"use client";

import {
  Banknote,
  Boxes,
  CalendarDays,
  ReceiptText,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  formatDateKey,
  formatNumber,
} from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { getDashboardData } from "../services/dashboard-service";
import type { DashboardDateRange } from "../types/dashboard";
import { DashboardKpiCard } from "./dashboard-kpi-card";
import {
  BranchPerformance,
  InventorySummary,
  RecentActivity,
  TopProducts,
} from "./dashboard-sections";
import { SalesTrendChart } from "./sales-trend-chart";

type AdminDashboardProps = {
  locale: Locale;
};

const dateRanges: DashboardDateRange[] = [
  "today",
  "last7Days",
  "last30Days",
  "thisMonth",
];

function isDashboardDateRange(value: string): value is DashboardDateRange {
  return dateRanges.some((range) => range === value);
}

export function AdminDashboard({
  locale,
}: AdminDashboardProps) {
  const [range, setRange] = useState<DashboardDateRange>("last7Days");
  const [referenceDate, setReferenceDate] = useState("2026-11-13");
  const [currentDateLabel, setCurrentDateLabel] = useState<string | null>(null);
  const t = useTranslations("dashboard");
  const profile = useTranslations("profile");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      setReferenceDate(formatDateKey(now));
      setCurrentDateLabel(formatDate(now, locale, { dateStyle: "full" }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale]);

  const data = getDashboardData(
    range,
    new Date(`${referenceDate}T12:00:00.000Z`),
  );
  const salesChange =
    ((data.sales - data.previousSales) / data.previousSales) * 100;
  const receiptsChange =
    ((data.receipts - data.previousReceipts) / data.previousReceipts) * 100;
  const currencyLocale = locale;

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 sm:space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p
            aria-label={t("todayLabel")}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            {currentDateLabel ?? (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-44 animate-pulse rounded-md bg-muted"
              />
            )}
          </p>
          <h1 className="type-page-title mt-2">
            {t("welcome", { name: profile("name") })}
          </h1>
          <p className="type-secondary mt-2">{t("overviewDescription")}</p>
        </div>
        <label className="flex w-full items-center gap-2 self-start rounded-lg border border-input bg-card px-3 sm:w-auto sm:self-auto">
          <span className="shrink-0 text-sm text-muted-foreground">
            {t("dateRange.label")}
          </span>
          <select
            value={range}
            onChange={(event) => {
              const nextRange = event.currentTarget.value;
              if (isDashboardDateRange(nextRange)) {
                setRange(nextRange);
              }
            }}
            aria-label={t("dateRange.label")}
            className="min-h-10 min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-foreground outline-none sm:flex-none"
          >
            {dateRanges.map((dateRange) => (
              <option key={dateRange} value={dateRange}>
                {t(`dateRange.options.${dateRange}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section aria-label={t("kpis.sectionLabel")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          title={t("kpis.sales")}
          value={formatCurrency(data.sales, currencyLocale)}
          comparison={salesChange}
          comparisonLabel={t("kpis.vsPrevious")}
          icon={Banknote}
          locale={currencyLocale}
        />
        <DashboardKpiCard
          title={t("kpis.receipts")}
          value={formatNumber(data.receipts, currencyLocale)}
          comparison={receiptsChange}
          comparisonLabel={t("kpis.vsPrevious")}
          icon={ReceiptText}
          locale={currencyLocale}
        />
        <DashboardKpiCard
          title={t("kpis.branches")}
          value={formatNumber(data.branchCount, currencyLocale)}
          icon={Store}
          locale={currencyLocale}
        />
        <DashboardKpiCard
          title={t("kpis.products")}
          value={formatNumber(data.productCount, currencyLocale)}
          icon={Boxes}
          locale={currencyLocale}
        />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>{t("chart.title")}</CardTitle>
              <CardDescription>{t("chart.description")}</CardDescription>
            </div>
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {t(`dateRange.options.${range}`)}
            </span>
          </CardHeader>
          <CardContent className="min-w-0 p-0">
            <SalesTrendChart data={data.trend} locale={currencyLocale} />
          </CardContent>
        </Card>
        <BranchPerformance branches={data.branches} locale={currencyLocale} />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)]">
        <TopProducts products={data.topProducts} locale={currencyLocale} />
        <InventorySummary inventory={data.inventory} locale={currencyLocale} />
      </section>

      <section aria-label={t("activity.title")}>
        <RecentActivity activities={data.activities} locale={currencyLocale} />
      </section>
    </div>
  );
}
