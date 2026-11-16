"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type { SalesPoint } from "../types/dashboard";

type SalesTrendChartProps = {
  data: SalesPoint[];
  locale: Locale;
};

type TooltipContentProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ value?: number }>;
  locale: Locale;
  salesLabel: string;
};

function SalesTooltip({
  active,
  label,
  payload,
  locale,
  salesLabel,
}: TooltipContentProps) {
  const amount = payload?.[0]?.value;

  if (!active || amount === undefined) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">
        {label
          ? formatDate(label, locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null}
      </p>
      <p className="mt-1 text-sm font-semibold">
        {salesLabel}: {formatCurrency(amount, locale)}
      </p>
    </div>
  );
}

export function SalesTrendChart({ data, locale }: SalesTrendChartProps) {
  const t = useTranslations("dashboard");
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = Math.floor(container.getBoundingClientRect().width);
      if (width > 0) setChartWidth(width);
    };
    const observer = new ResizeObserver(updateWidth);

    observer.observe(container);
    const frame = window.requestAnimationFrame(updateWidth);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-72 min-w-0 w-full"
      role="img"
      aria-label={t("chart.accessibleLabel")}
    >
      {chartWidth > 0 && (
        <AreaChart
          width={chartWidth}
          height={288}
          data={data}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value, locale, dateOptions)}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            reversed={locale === "ar"}
          />
          <YAxis
            orientation={locale === "ar" ? "right" : "left"}
            tickFormatter={(value: number) =>
              formatNumber(value, locale, {
                style: "currency",
                currency: "EGP",
                notation: "compact",
                maximumFractionDigits: 0,
              })
            }
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            content={
              <SalesTooltip locale={locale} salesLabel={t("chart.salesLabel")} />
            }
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      )}
    </div>
  );
}
