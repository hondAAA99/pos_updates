import type { InitialBranchId } from "@/features/branches/data/mock-branches";

export type DashboardDateRange = "today" | "last7Days" | "last30Days" | "thisMonth";
export type BranchId = InitialBranchId;
export type ProductId =
  | "arabicaCoffee"
  | "wholeMilk"
  | "mineralWater"
  | "chocolateBar"
  | "paperCups";
export type ActivityId =
  | "saleCompleted"
  | "productAdded"
  | "stockTransferred"
  | "employeeAdded"
  | "supplierTransaction";

export type SalesPoint = {
  date: string;
  sales: number;
  receipts: number;
};

export type BranchPerformance = {
  id: BranchId;
  sales: number;
  receipts: number;
  share: number;
};

export type TopProduct = {
  id: ProductId;
  sku: string;
  quantity: number;
  sales: number;
};

export type ActivityEvent = {
  id: ActivityId;
  kind: "sale" | "product" | "transfer" | "employee" | "supplier";
  date: string;
};

export type InventoryOverview = {
  totalItems: number;
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export type DashboardData = {
  sales: number;
  previousSales: number;
  receipts: number;
  previousReceipts: number;
  branchCount: number;
  productCount: number;
  trend: SalesPoint[];
  branches: BranchPerformance[];
  topProducts: TopProduct[];
  activities: ActivityEvent[];
  inventory: InventoryOverview;
};
