import {
  ArrowDownLeft,
  ArrowLeftRight,
  CircleDollarSign,
  PackagePlus,
  ShoppingBag,
  UserRoundPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type {
  ActivityEvent,
  BranchPerformance as BranchData,
  InventoryOverview,
  TopProduct,
} from "../types/dashboard";

const eventIcons = {
  sale: CircleDollarSign,
  product: PackagePlus,
  transfer: ArrowLeftRight,
  employee: UserRoundPlus,
  supplier: ArrowDownLeft,
} as const;

type BranchPerformanceProps = {
  branches: BranchData[];
  locale: Locale;
};

export function BranchPerformance({ branches, locale }: BranchPerformanceProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>{t("branchPerformance.title")}</CardTitle>
        <CardDescription>{t("branchPerformance.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {branches.map((branch) => (
          <div key={branch.id} className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {t(`branchNames.${branch.id}`)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("branchPerformance.receipts", { count: branch.receipts })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(branch.sales, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(branch.share, locale, {
                    style: "percent",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t("branchPerformance.contribution", {
                branch: t(`branchNames.${branch.id}`),
              })}
              aria-valuenow={Math.round(branch.share * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${branch.share * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type TopProductsProps = {
  products: TopProduct[];
  locale: Locale;
};

export function TopProducts({ products, locale }: TopProductsProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>{t("topProducts.title")}</CardTitle>
        <CardDescription>{t("topProducts.description")}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[32rem] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-6 pb-3 font-medium">{t("topProducts.product")}</th>
              <th className="px-4 pb-3 text-end font-medium">{t("topProducts.sku")}</th>
              <th className="px-4 pb-3 text-end font-medium">{t("topProducts.quantity")}</th>
              <th className="px-6 pb-3 text-end font-medium">{t("topProducts.sales")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/70 last:border-0">
                <th scope="row" className="px-6 py-3.5 text-start font-medium">
                  {t(`productNames.${product.id}`)}
                </th>
                <td className="px-4 py-3.5 text-end font-mono text-xs text-muted-foreground">
                  {product.sku}
                </td>
                <td className="px-4 py-3.5 text-end tabular-nums">
                  {formatNumber(product.quantity, locale)}
                </td>
                <td className="px-6 py-3.5 text-end font-medium tabular-nums">
                  {formatCurrency(product.sales, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

type RecentActivityProps = {
  activities: ActivityEvent[];
  locale: Locale;
};

export function RecentActivity({ activities, locale }: RecentActivityProps) {
  const t = useTranslations("dashboard");
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("activity.title")}</CardTitle>
        <CardDescription>{t("activity.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {activities.map((activity) => {
          const Icon = eventIcons[activity.kind];

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t(`activities.${activity.id}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {t(`activities.${activity.id}.description`)}
                </p>
                <time
                  dateTime={activity.date}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {formatDate(activity.date, locale, dateOptions)}
                </time>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

type InventorySummaryProps = {
  inventory: InventoryOverview;
  locale: Locale;
};

export function InventorySummary({ inventory, locale }: InventorySummaryProps) {
  const t = useTranslations("dashboard");
  const statuses = [
    { key: "inStock" as const, count: inventory.inStock, color: "bg-success" },
    { key: "lowStock" as const, count: inventory.lowStock, color: "bg-warning" },
    { key: "outOfStock" as const, count: inventory.outOfStock, color: "bg-destructive" },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("inventory.title")}</CardTitle>
        <CardDescription>{t("inventory.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatNumber(inventory.totalItems, locale)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("inventory.totalItems")}
            </p>
          </div>
          <Badge variant="outline">
            <ShoppingBag aria-hidden="true" />
            {formatNumber(inventory.totalProducts, locale)} {t("inventory.products")}
          </Badge>
        </div>
        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={t("inventory.distribution")}
        >
          {statuses.map((status) => (
            <div
              key={status.key}
              className={status.color}
              style={{ width: `${(status.count / inventory.totalProducts) * 100}%` }}
            />
          ))}
        </div>
        <ul className="space-y-3">
          {statuses.map((status) => (
            <li key={status.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`size-2 rounded-full ${status.color}`} />
                {t(`inventory.${status.key}`)}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {formatNumber(status.count, locale)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
