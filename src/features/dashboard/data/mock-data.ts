import type { ActivityEvent, DashboardDateRange } from "../types/dashboard";
import { initialBranches } from "@/features/branches/data/mock-branches";

export const periodTotals: Record<
  DashboardDateRange,
  { sales: number; previousSales: number; receipts: number; previousReceipts: number }
> = {
  today: {
    sales: 18_450,
    previousSales: 16_200,
    receipts: 84,
    previousReceipts: 76,
  },
  last7Days: {
    sales: 146_850,
    previousSales: 138_200,
    receipts: 682,
    previousReceipts: 641,
  },
  last30Days: {
    sales: 592_400,
    previousSales: 548_900,
    receipts: 2_761,
    previousReceipts: 2_538,
  },
  thisMonth: {
    sales: 268_500,
    previousSales: 244_300,
    receipts: 1_248,
    previousReceipts: 1_130,
  },
};

const branchSalesShares = {
  downtown: 0.34,
  nasrCity: 0.27,
  alexandria: 0.23,
  giza: 0.16,
} as const;

export const branchSeeds = initialBranches.map((branch) => ({
  id: branch._id,
  share: branchSalesShares[branch._id],
}));

export const productSeeds = [
  { id: "arabicaCoffee", sku: "BEV-1042", quantity: 154, sales: 23_100 },
  { id: "wholeMilk", sku: "DAI-2081", quantity: 132, sales: 10_560 },
  { id: "mineralWater", sku: "BEV-1008", quantity: 128, sales: 3_840 },
  { id: "chocolateBar", sku: "SNK-3106", quantity: 96, sales: 5_760 },
  { id: "paperCups", sku: "SUP-4014", quantity: 82, sales: 4_100 },
] as const;

export const activitySeeds: readonly Omit<ActivityEvent, "date">[] = [
  { id: "saleCompleted", kind: "sale" },
  { id: "productAdded", kind: "product" },
  { id: "stockTransferred", kind: "transfer" },
  { id: "employeeAdded", kind: "employee" },
  { id: "supplierTransaction", kind: "supplier" },
];

export const inventorySeed = {
  totalItems: 4_836,
  totalProducts: 1_124,
  inStock: 1_064,
  lowStock: 48,
  outOfStock: 12,
} as const;

export const salesPattern = [
  0.72, 0.81, 0.94, 0.76, 1.08, 1.22, 1.16, 0.89, 0.98, 1.11,
  0.83, 1.03, 1.19, 1.28, 0.91, 0.86, 1.04, 1.15, 0.95, 1.24,
  1.31, 0.88, 1.02, 1.13, 0.93, 1.17, 1.26, 0.9, 1.07, 1.2, 1.09,
] as const;
