import type { Branch } from "@/features/branches/types/branch";
import type { CashierReceipt } from "@/features/dashboard/types/cashier-dashboard";

export type SalesManagementRecord = {
  receipt: CashierReceipt;
  branchId?: string;
  cashierName?: string;
};

export type SalesManagementFilters = {
  search: string;
  branchId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
};

export type SalesManagementPage = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: SalesManagementRecord[];
};

export type SalesManagementSummary = {
  totalSalesAmount: number;
  totalReceipts: number;
  completedSales: number;
  rejectedSales: number;
};

export type SalesByBranch = {
  branch: Branch;
  salesAmount: number;
  receiptCount: number;
};

export type SalesByProduct = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type AdminSalesManagementData = {
  page: SalesManagementPage;
  summary: SalesManagementSummary;
  salesByBranch: SalesByBranch[];
  salesByProduct: SalesByProduct[];
};
