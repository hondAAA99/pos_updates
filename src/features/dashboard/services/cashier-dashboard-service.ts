import { listCashierReceipts } from "@/features/sales/services/sales-service";
import type { CashierDashboardData } from "../types/cashier-dashboard";

export function getCashierDashboardData(
  dateKey: string,
  branchId: string,
  cashierName: string,
): CashierDashboardData {
  const receipts = listCashierReceipts(branchId, dateKey);
  const completedReceipts = receipts.filter(
    (receipt) => receipt.status === "completed",
  );
  const totalSales = completedReceipts.reduce(
    (sum, receipt) => sum + receipt.totalAmount,
    0,
  );

  return {
    cashierName,
    receipts,
    totalSales,
    receiptCount: receipts.length,
    completedSales: completedReceipts.length,
    averageReceipt:
      completedReceipts.length === 0 ? 0 : totalSales / completedReceipts.length,
  };
}
