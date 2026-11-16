import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercentage } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type DashboardKpiCardProps = {
  title: string;
  value: string;
  comparison?: number;
  comparisonLabel?: string;
  icon: LucideIcon;
  locale: Locale;
};

export function DashboardKpiCard({
  title,
  value,
  comparison,
  comparisonLabel,
  icon: Icon,
  locale,
}: DashboardKpiCardProps) {
  const isPositive = (comparison ?? 0) >= 0;

  return (
    <Card className="gap-4 p-4 sm:p-5">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-secondary truncate">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </span>
        </div>
        {comparison !== undefined && comparisonLabel && (
          <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                isPositive ? "text-success" : "text-destructive",
              )}
            >
              {isPositive ? (
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              ) : (
                <ArrowDownRight aria-hidden="true" className="size-3.5" />
              )}
              {formatPercentage(Math.abs(comparison), locale)}
            </span>
            <span className="text-muted-foreground">{comparisonLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
