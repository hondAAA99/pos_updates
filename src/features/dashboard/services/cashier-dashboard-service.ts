import { getBranchById, listBranches } from "@/features/branches/services/branches-service";
import {
  getEmployeeById,
  mockCurrentCashierId,
} from "@/features/employees/services/employees-service";
import { listCashierReceipts } from "@/features/sales/services/sales-service";
import type { CashierDashboardData } from "../types/cashier-dashboard";

export function getCashierDashboardData(
  dateKey: string,
): CashierDashboardData {
  const cashier = getEmployeeById(mockCurrentCashierId);
  if (!cashier || cashier.role !== "cashier" || !cashier.active) {
    throw new Error("The current mock cashier is unavailable.");
  }
  if (!cashier.branchId) {
    throw new Error("The current mock cashier has no assigned branch.");
  }

  const branch = getBranchById(listBranches(), cashier.branchId);
  if (!branch) {
    throw new Error("The current mock cashier branch is unavailable.");
  }

  const receipts = listCashierReceipts(cashier.branchId, dateKey);
  const completedReceipts = receipts.filter(
    (receipt) => receipt.status === "completed",
  );
  const totalSales = completedReceipts.reduce(
    (sum, receipt) => sum + receipt.totalAmount,
    0,
  );

  return {
    cashierName: cashier.name,
    branch,
    receipts,
    totalSales,
    receiptCount: receipts.length,
    completedSales: completedReceipts.length,
    averageReceipt:
      completedReceipts.length === 0 ? 0 : totalSales / completedReceipts.length,
  };
}
