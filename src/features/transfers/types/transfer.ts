import type { Branch } from "@/features/branches/types/branch";

export type TransferBranchReference = Branch;

export type TransferProductReference = {
  _id: string;
  productName?: string;
  serialNumber?: string;
};

export type TransferItem = {
  _id: string;
  timestamp?: string;
  branchId: TransferBranchReference | null;
  productId: TransferProductReference | null;
  quantity: number;
};

export type CreateTransferDto = {
  branchId: string;
  productId: string;
  quantity: number;
};

export type UpdateTransferDto = {
  branchId?: string;
  productId?: string;
  quantity?: number;
};

export type TransferPage = {
  items: TransferItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type TransferFormValues = CreateTransferDto;
