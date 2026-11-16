import { ApiClientError, apiClient } from "@/lib/api-client";
import type {
  CreateSupplierDepositDto,
  CreateSupplierTransactionDto,
  SupplierDepositDetail,
  SupplierDepositListItem,
  SupplierRecordPage,
  SupplierTransactionDetail,
  SupplierTransactionListItem,
  UpdateSupplierDepositDto,
  UpdateSupplierTransactionDto,
} from "../types/supplier-financial-record";

type SupplierDepositListParams = {
  page: number;
  limit: number;
};

type SupplierTransferListParams = SupplierDepositListParams & {
  supplierId?: string;
};

export async function listSupplierDeposits(
  token: string,
  params: SupplierDepositListParams,
): Promise<SupplierRecordPage<SupplierDepositListItem>> {
  return apiClient.get<SupplierRecordPage<SupplierDepositListItem>>(
    "/suppliers/deposit",
    {
      token,
      params,
    },
  );
}

export async function listAllSupplierDeposits(
  token: string,
): Promise<SupplierDepositListItem[]> {
  const limit = 100;
  const firstPage = await listSupplierDeposits(token, { page: 1, limit });
  const deposits = [...firstPage.data];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const response = await listSupplierDeposits(token, { page, limit });
    deposits.push(...response.data);
  }

  return deposits;
}

export async function getSupplierDeposit(
  token: string,
  id: string,
): Promise<SupplierDepositDetail> {
  return apiClient.get<SupplierDepositDetail>(`/suppliers/deposit/${id}`, {
    token,
  });
}

export async function createSupplierDeposit(
  token: string,
  request: CreateSupplierDepositDto,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(
    "/suppliers/deposit",
    request,
    { token },
  );
}

export async function updateSupplierDeposit(
  token: string,
  id: string,
  request: UpdateSupplierDepositDto,
): Promise<string> {
  return apiClient.patch<string>(
    `/suppliers/deposit/${id}`,
    request,
    { token },
  );
}

export async function deleteSupplierDeposit(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/suppliers/deposit/${id}`, {
    token,
  });
}

export async function listSupplierTransactions(
  token: string,
  params: SupplierTransferListParams,
): Promise<SupplierRecordPage<SupplierTransactionListItem>> {
  return apiClient.get<SupplierRecordPage<SupplierTransactionListItem>>(
    "/suppliers/transfer",
    {
      token,
      params,
    },
  );
}

export async function getSupplierTransaction(
  token: string,
  id: string,
): Promise<SupplierTransactionDetail> {
  return apiClient.get<SupplierTransactionDetail>(
    `/suppliers/transfer/${id}`,
    { token },
  );
}

export async function createSupplierTransaction(
  token: string,
  request: CreateSupplierTransactionDto,
): Promise<{ message: string }> {
  if (!request.nextDepositId.trim()) {
    throw new ApiClientError("A nextDepositId is required to create a supplier transfer.", 0);
  }

  return apiClient.post<{ message: string }>(
    "/suppliers/transfer",
    request,
    { token },
  );
}

export async function updateSupplierTransaction(
  token: string,
  id: string,
  request: UpdateSupplierTransactionDto,
): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(
    `/suppliers/transfer/${id}`,
    request,
    { token },
  );
}

export async function deleteSupplierTransaction(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(
    `/suppliers/transfer/${id}`,
    { token },
  );
}
