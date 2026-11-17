/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from "@/lib/api-client";
import type { Wallet, WalletInput, WalletTransaction } from "../types/wallet";

// API types: daily and monthly are numeric values in the backend.
export type WalletTypeRecord = {
  id: string;
  name: string;
  capacity: number;
  daily: number;
  monthly: number;
};

export type WalletTypeInput = Omit<WalletTypeRecord, "id">;

export type WalletTransactionInput = {
  moneyAmount: number;
  transaction_fee: number;
};

export type WalletTransferInput = WalletTransactionInput & {
  phoneNumber: string;
};

export type WalletTransactionUpdateInput = {
  moneyAmount?: number;
  phoneNumber?: string;
  transactionType?: string;
  transaction_fee?: number;
  walletId?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: T[];
};

type ApiRecord = Record<string, any>;

type WalletApiRecord = ApiRecord & {
  _id?: string;
  id?: string;
  typeId?: string | ApiRecord;
  type?: ApiRecord;
};

type TransactionApiRecord = ApiRecord & {
  _id?: string;
  id?: string;
  walletId?: string | ApiRecord;
  timestamp?: string | Date;
};

function getId(value: string | ApiRecord | undefined): string {
  if (typeof value === "string") return value;
  return value?._id ?? value?.id ?? "";
}

function normalizeWallet(record: WalletApiRecord, fallbackId = ""): Wallet {
  const normalizedTypeId = getId(record.typeId);
  const nestedType = typeof record.typeId === "object" && record.typeId !== null
    ? normalizeWalletType(record.typeId as ApiRecord)
    : typeof record.type === "object" && record.type !== null
      ? normalizeWalletType(record.type as ApiRecord)
      : undefined;

  return {
    ...record,
    id: record._id ?? record.id ?? fallbackId,
    typeId: normalizedTypeId,
    type: nestedType,
    phoneNumber: record.phoneNumber,
    money_amount: Number(record.money_amount ?? 0),
    remainingLimits: record.remainingLimits,
  } as Wallet;
}

function normalizeWalletType(record: ApiRecord): WalletTypeRecord {
  return {
    ...record,
    id: record._id ?? record.id,
    name: record.name,
    capacity: Number(record.capacity ?? 0),
    daily: Number(record.daily ?? 0),
    monthly: Number(record.monthly ?? 0),
  };
}

function normalizeTransaction(
  record: TransactionApiRecord,
): WalletTransaction {
  return {
    ...record,
    id: record._id ?? record.id,
    walletId: getId(record.walletId),
    moneyAmount: Number(record.moneyAmount),
    transaction_fee: Number(record.transaction_fee),
    timestamp: new Date(record.timestamp ?? Date.now()),
  } as WalletTransaction;
}

// Wallets

export async function listWallets(
  token: string,
  params: PaginationParams = {},
): Promise<PaginatedResponse<Wallet>> {
  const response = (await apiClient.get("/wallets", {
    token,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
    cache: "no-store",
  })) as PaginatedResponse<WalletApiRecord>;

  return {
    meta: response.meta,
    data: response.data.map((wallet) => normalizeWallet(wallet)),
  };
}

export async function getWalletById(
  token: string,
  id: string,
): Promise<Wallet> {
  const response = (await apiClient.get(`/wallets/${id}`, {
    token,
    cache: "no-store",
  })) as WalletApiRecord;

  return normalizeWallet(response, id);
}

export async function createWallet(
  token: string,
  input: WalletInput,
): Promise<unknown> {
  return apiClient.post("/wallets", input, { token });
}

export async function updateWallet(
  token: string,
  id: string,
  input: Partial<WalletInput>,
): Promise<unknown> {
  return apiClient.patch(`/wallets/${id}`, input, { token });
}

export async function deleteWallet(
  token: string,
  id: string,
): Promise<unknown> {
  return apiClient.del(`/wallets/${id}`, { token });
}

// Wallet types

export async function listWalletTypes(
  token: string,
): Promise<WalletTypeRecord[]> {
  const response = (await apiClient.get("/wallets/type", {
    token,
    cache: "no-store",
  })) as ApiRecord[];

  return response.map(normalizeWalletType);
}

export async function getWalletTypeById(
  token: string,
  id: string,
): Promise<WalletTypeRecord> {
  const response = (await apiClient.get(`/wallets/type/${id}`, {
    token,
    cache: "no-store",
  })) as ApiRecord;

  return normalizeWalletType(response);
}

export async function createWalletType(
  token: string,
  input: WalletTypeInput,
): Promise<unknown> {
  return apiClient.post("/wallets/type", input, { token });
}

export async function updateWalletType(
  token: string,
  id: string,
  input: Partial<WalletTypeInput>,
): Promise<unknown> {
  return apiClient.patch(`/wallets/type/${id}`, input, { token });
}

export async function deleteWalletType(
  token: string,
  id: string,
): Promise<unknown> {
  return apiClient.del(`/wallets/type/${id}`, { token });
}

// Transaction history

export async function listWalletTransactions(
  token: string,
  params: PaginationParams & { transactionType?: string } = {},
): Promise<PaginatedResponse<WalletTransaction>> {
  const response = (await apiClient.get("/wallets/transaction", {
    token,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.transactionType
        ? { transactionType: params.transactionType }
        : {}),
    },
    cache: "no-store",
  })) as PaginatedResponse<TransactionApiRecord>;

  return {
    meta: response.meta,
    data: response.data.map(normalizeTransaction),
  };
}

export async function getWalletTransactionById(
  token: string,
  id: string,
): Promise<WalletTransaction> {
  const response = (await apiClient.get(`/wallets/transaction/${id}`, {
    token,
    cache: "no-store",
  })) as TransactionApiRecord;

  return normalizeTransaction(response);
}

export async function updateWalletTransaction(
  token: string,
  id: string,
  input: WalletTransactionUpdateInput,
): Promise<unknown> {
  return apiClient.patch(`/wallets/transaction/${id}`, input, { token });
}

export async function deleteWalletTransaction(
  token: string,
  id: string,
): Promise<unknown> {
  return apiClient.del(`/wallets/transaction/${id}`, { token });
}

// Wallet operations

export async function depositWallet(
  token: string,
  walletId: string,
  input: WalletTransactionInput,
): Promise<unknown> {
  return apiClient.post(`/wallets/${walletId}/deposit`, input, { token });
}

export async function withdrawWallet(
  token: string,
  walletId: string,
  input: WalletTransactionInput,
): Promise<unknown> {
  return apiClient.post(`/wallets/${walletId}/withdraw`, input, { token });
}

export async function transferWallet(
  token: string,
  walletId: string,
  input: WalletTransferInput,
): Promise<unknown> {
  return apiClient.post(`/wallets/${walletId}/transfer`, input, { token });
}
