import type { SupplierListItem } from "./supplier";

export type SupplierFinancialSupplier = Omit<SupplierListItem, "phoneNumber"> & {
  phoneNumber?: string;
};

export type SupplierDepositListItem = {
  _id: string;
  supplierId: SupplierFinancialSupplier | null;
  depositAmount: number;
  depositDate: string;
  timestamp: string;
};

export type SupplierDepositDetail = {
  _id: string;
  supplierId: SupplierFinancialSupplier | string | null;
  depositAmount: number;
  depositDate: string;
};

export type CreateSupplierDepositDto = {
  supplierId: string;
  depositAmount: number;
  depositDate: string;
};

export type UpdateSupplierDepositDto = {
  depositAmount?: number;
  depositDate?: string;
};

export type SupplierTransactionListItem = {
  _id: string;
  transferredAmount: number;
  timestamp: string;
  comments?: string;
};

export type SupplierTransactionDetail = {
  _id: string;
  supplierId: SupplierFinancialSupplier | string | null;
  transferredAmount: number;
  timestamp: string;
  comments?: string;
};

export type CreateSupplierTransactionDto = {
  nextDepositId: string;
  comments: string;
  depositAmount: string;
};

export type UpdateSupplierTransactionDto = {
  supplierId?: string;
  transferredAmount?: unknown;
  timestamp?: unknown;
  comments?: string;
};

export type SupplierRecordPage<T> = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: T[];
};

export type SupplierFinancialRecord = {
  _id: string;
  supplierId: SupplierFinancialSupplier | null;
  amount: number;
  date: string;
  timestamp?: string;
  comments?: string;
};
