import type {
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "../types/cashier-dashboard";

export type MockCashierReceipt = {
  _id: string;
  referenceNumber: string;
  timestamp: string;
  branchId: string;
  totalAmount: number;
  paymentMethod: ReceiptPaymentMethod;
  status: ReceiptSaleStatus;
  salesmanName: string;
};

export const mockCashierReceipts = [
  {
    _id: "receipt-20261114-001",
    referenceNumber: "RCP-20261114-001",
    timestamp: "2026-11-14T06:42:00.000Z",
    branchId: "nasrCity",
    totalAmount: 485,
    paymentMethod: "cash",
    status: "completed",
    salesmanName: "Farah Tarek",
  },
  {
    _id: "receipt-20261114-002",
    referenceNumber: "RCP-20261114-002",
    timestamp: "2026-11-14T07:18:00.000Z",
    branchId: "nasrCity",
    totalAmount: 1_240,
    paymentMethod: "card",
    status: "completed",
    salesmanName: "Tamer Hossam",
  },
  {
    _id: "receipt-20261114-003",
    referenceNumber: "RCP-20261114-003",
    timestamp: "2026-11-14T08:03:00.000Z",
    branchId: "nasrCity",
    totalAmount: 320,
    paymentMethod: "mobileWallet",
    status: "completed",
    salesmanName: "Farah Tarek",
  },
  {
    _id: "receipt-20261114-004",
    referenceNumber: "RCP-20261114-004",
    timestamp: "2026-11-14T08:51:00.000Z",
    branchId: "nasrCity",
    totalAmount: 760,
    paymentMethod: "cash",
    status: "refunded",
    salesmanName: "Nour Samir",
  },
  {
    _id: "receipt-20261114-005",
    referenceNumber: "RCP-20261114-005",
    timestamp: "2026-11-14T09:26:00.000Z",
    branchId: "nasrCity",
    totalAmount: 2_150,
    paymentMethod: "card",
    status: "completed",
    salesmanName: "Tamer Hossam",
  },
  {
    _id: "receipt-20261114-006",
    referenceNumber: "RCP-20261114-006",
    timestamp: "2026-11-14T10:14:00.000Z",
    branchId: "downtown",
    totalAmount: 930,
    paymentMethod: "card",
    status: "completed",
    salesmanName: "Farah Tarek",
  },
  {
    _id: "receipt-20261114-007",
    referenceNumber: "RCP-20261114-007",
    timestamp: "2026-11-14T10:47:00.000Z",
    branchId: "nasrCity",
    totalAmount: 540,
    paymentMethod: "mobileWallet",
    status: "completed",
    salesmanName: "Nour Samir",
  },
  {
    _id: "receipt-20261114-008",
    referenceNumber: "RCP-20261114-008",
    timestamp: "2026-11-14T11:33:00.000Z",
    branchId: "nasrCity",
    totalAmount: 1_085,
    paymentMethod: "cash",
    status: "voided",
    salesmanName: "Tamer Hossam",
  },
  {
    _id: "receipt-20261114-009",
    referenceNumber: "RCP-20261114-009",
    timestamp: "2026-11-14T12:08:00.000Z",
    branchId: "nasrCity",
    totalAmount: 675,
    paymentMethod: "card",
    status: "completed",
    salesmanName: "Farah Tarek",
  },
  {
    _id: "receipt-20261114-010",
    referenceNumber: "RCP-20261114-010",
    timestamp: "2026-11-14T12:54:00.000Z",
    branchId: "giza",
    totalAmount: 2_480,
    paymentMethod: "cash",
    status: "completed",
    salesmanName: "Nour Samir",
  },
  {
    _id: "receipt-20261114-011",
    referenceNumber: "RCP-20261114-011",
    timestamp: "2026-11-14T13:22:00.000Z",
    branchId: "nasrCity",
    totalAmount: 1_360,
    paymentMethod: "mobileWallet",
    status: "completed",
    salesmanName: "Tamer Hossam",
  },
  {
    _id: "receipt-20261114-012",
    referenceNumber: "RCP-20261114-012",
    timestamp: "2026-11-14T14:01:00.000Z",
    branchId: "alexandria",
    totalAmount: 410,
    paymentMethod: "cash",
    status: "completed",
    salesmanName: "Farah Tarek",
  },
] as const satisfies readonly MockCashierReceipt[];
