import { apiClient } from "@/lib/api-client";
import type {
  CreateTransferDto,
  TransferItem,
  TransferPage,
  TransferProductReference,
  UpdateTransferDto,
} from "../types/transfer";

type PaginationMeta = {
  totalDoc: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

type TransferListApiResponse = {
  meta: PaginationMeta;
  data: TransferItem[];
};

export async function listTransfers(
  token: string,
  params: {
    page: number;
    limit: number;
    branchId?: string;
    productId?: string;
  },
): Promise<TransferPage> {
  const response = await apiClient.get<TransferListApiResponse>(
    "/stock/transfers",
    {
      token,
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.branchId && params.branchId !== "all"
          ? { branchId: params.branchId }
          : {}),
        ...(params.productId && params.productId !== "all"
          ? { productId: params.productId }
          : {}),
      },
    },
  );

  return {
    items: response.data,
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export function resolveTransferProduct(
  transfer: TransferItem,
  products: TransferProductReference[],
): TransferItem {
  if (!transfer.productId) return transfer;

  const product = products.find(
    (item) => item._id === transfer.productId?._id,
  );

  return {
    ...transfer,
    productId: {
      ...transfer.productId,
      productName: transfer.productId.productName || product?.productName,
      serialNumber: transfer.productId.serialNumber || product?.serialNumber,
    },
  };
}

export async function getTransfer(
  token: string,
  id: string,
): Promise<TransferItem> {
  return apiClient.get<TransferItem>(`/stock/transfers/${id}`, { token });
}

export async function createTransfer(
  token: string,
  request: CreateTransferDto,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(
    "/stock/transfers",
    request,
    { token },
  );
}

export async function updateTransfer(
  token: string,
  id: string,
  request: UpdateTransferDto,
): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(
    `/stock/transfers/${id}`,
    request,
    { token },
  );
}

export async function deleteTransfer(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/stock/transfers/${id}`, {
    token,
  });
}
