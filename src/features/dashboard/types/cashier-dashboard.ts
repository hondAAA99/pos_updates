export type ReceiptPaymentMethod =
  | "cash"
  | "card"
  | "mobileWallet"
  | "wallet"
  | (string & {});
export type ReceiptSaleStatus =
  | "completed"
  | "rejected"
  | "refunded"
  | "voided"
  | (string & {});

export type CashierReceipt = {
  _id: string;
  referenceNumber: string;
  timestamp: string;
  totalAmount: number;
  paymentMethod: ReceiptPaymentMethod;
  status: ReceiptSaleStatus;
  salesmanName?: string;
  employeeId?: string;
  clientId?: string;
  branchId?: string;
  confirmed?: boolean;
  comments?: string;
  subtotal?: number;
  discount?: number;
  salePercentage?: number;
  allowedSalePercentage?: number;
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
  receipts: CashierReceipt[];
  totalSales: number;
  receiptCount: number;
  completedSales: number;
  averageReceipt: number;
};
