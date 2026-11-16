import type { Branch } from "@/features/branches/types/branch";

export type ReceiptPaymentMethod = "cash" | "card" | "mobileWallet";
export type ReceiptSaleStatus =
  | "completed"
  | "rejected"
  | "refunded"
  | "voided";

export type CashierReceipt = {
  _id: string;
  referenceNumber: string;
  timestamp: string;
  totalAmount: number;
  paymentMethod: ReceiptPaymentMethod;
  status: ReceiptSaleStatus;
  salesmanName: string;
  subtotal?: number;
  discount?: number;
  items?: Array<{
    productId: string;
    productName: string;
    serialNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type CashierDashboardData = {
  cashierName: string;
  branch: Branch;
  receipts: CashierReceipt[];
  totalSales: number;
  receiptCount: number;
  completedSales: number;
  averageReceipt: number;
};
