import {
  activitySeeds,
  branchSeeds,
  inventorySeed,
  periodTotals,
  productSeeds,
  salesPattern,
} from "../data/mock-data";
import type {
  ActivityEvent,
  DashboardData,
  DashboardDateRange,
  SalesPoint,
} from "../types/dashboard";

const rangeDays: Record<DashboardDateRange, number> = {
  today: 1,
  last7Days: 7,
  last30Days: 30,
  thisMonth: 0,
};

function getRangeLength(range: DashboardDateRange, referenceDate: Date) {
  return range === "thisMonth"
    ? referenceDate.getDate()
    : rangeDays[range];
}

function getTrend(
  range: DashboardDateRange,
  referenceDate: Date,
  totalSales: number,
  totalReceipts: number,
): SalesPoint[] {
  const count = getRangeLength(range, referenceDate);
  const weights = salesPattern.slice(salesPattern.length - count);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let allocatedSales = 0;
  let allocatedReceipts = 0;

  return weights.map((weight, index) => {
    const date = new Date(referenceDate);
    date.setUTCDate(
      referenceDate.getUTCDate() - (count - index - 1),
    );
    const isLast = index === weights.length - 1;
    const sales = isLast
      ? totalSales - allocatedSales
      : Math.round((totalSales * weight) / weightTotal);
    const receipts = isLast
      ? totalReceipts - allocatedReceipts
      : Math.round((totalReceipts * weight) / weightTotal);
    allocatedSales += sales;
    allocatedReceipts += receipts;

    return {
      date: date.toISOString(),
      sales,
      receipts,
    };
  });
}

function getBranches(totalSales: number, totalReceipts: number) {
  let allocatedSales = 0;
  let allocatedReceipts = 0;

  return branchSeeds.map((branch, index) => {
    const isLast = index === branchSeeds.length - 1;
    const sales = isLast
      ? totalSales - allocatedSales
      : Math.round(totalSales * branch.share);
    const receipts = isLast
      ? totalReceipts - allocatedReceipts
      : Math.round(totalReceipts * branch.share);
    allocatedSales += sales;
    allocatedReceipts += receipts;

    return {
      ...branch,
      sales,
      receipts,
    };
  });
}

function getActivities(referenceDate: Date): ActivityEvent[] {
  return activitySeeds.map((event, index) => {
    const date = new Date(referenceDate);
    date.setUTCDate(referenceDate.getUTCDate() - index);
    date.setUTCHours(9 + index * 2, 15 + index * 7, 0, 0);
    return { ...event, date: date.toISOString() };
  });
}

export function getDashboardData(
  range: DashboardDateRange,
  referenceDate: Date,
): DashboardData {
  const totals = periodTotals[range];
  const scale = totals.sales / periodTotals.last7Days.sales;

  return {
    ...totals,
    branchCount: branchSeeds.length,
    productCount: 1_280,
    trend: getTrend(range, referenceDate, totals.sales, totals.receipts),
    branches: getBranches(totals.sales, totals.receipts),
    topProducts: productSeeds.map((product) => ({
      ...product,
      quantity: Math.max(1, Math.round(product.quantity * scale)),
      sales: Math.round(product.sales * scale),
    })),
    activities: getActivities(referenceDate),
    inventory: inventorySeed,
  };
}
