import {
  initialWalletTransactions,
  initialWalletTypes,
  initialWallets,
} from "../data/mock-wallet-data";
import type {
  Wallet,
  WalletInput,
  WalletTransaction,
  WalletType,
  WalletTypeInput,
} from "../types/wallet";

export class WalletMockServiceError extends Error {
  constructor(
    readonly code: "wallet-not-found" | "wallet-type-not-found" | "wallet-type-in-use",
  ) {
    super(code);
    this.name = "WalletMockServiceError";
  }
}

let walletTypes = initialWalletTypes.map(cloneWalletType);
let wallets = initialWallets.map(cloneWallet);
const transactions = initialWalletTransactions.map(cloneTransaction);
let nextWalletId = 2001;
let nextWalletTypeId = 1;

function cloneWalletType(type: WalletType): WalletType {
  return {
    ...type,
    daily: { ...type.daily },
    monthly: { ...type.monthly },
  };
}

function cloneWallet(wallet: Wallet): Wallet {
  if (!wallet.remainingLimits) return { ...wallet };

  return {
    ...wallet,
    remainingLimits: {
      daily: { ...wallet.remainingLimits.daily },
      monthly: { ...wallet.remainingLimits.monthly },
    },
  };
}

function cloneTransaction(transaction: WalletTransaction): WalletTransaction {
  return { ...transaction, timestamp: new Date(transaction.timestamp) };
}

function normalizeWalletInput(input: WalletInput): WalletInput {
  const phoneNumber = input.phoneNumber.trim();
  if (!phoneNumber) throw new Error("wallet-phone-required");
  if (!Number.isFinite(input.money_amount) || input.money_amount < 0) {
    throw new Error("wallet-balance-invalid");
  }
  if (!walletTypes.some((type) => type.id === input.typeId)) {
    throw new WalletMockServiceError("wallet-type-not-found");
  }
  return { ...input, phoneNumber };
}

function normalizeWalletTypeInput(input: WalletTypeInput): WalletTypeInput {
  if (!input.name.trim()) throw new Error("wallet-type-name-required");
  const amounts = [
    input.capacity,
    input.daily.transfer,
    input.daily.withdraw,
    input.monthly.transfer,
    input.monthly.withdraw,
  ];
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    throw new Error("wallet-limit-invalid");
  }
  return {
    ...input,
    name: input.name.trim(),
    daily: { ...input.daily },
    monthly: { ...input.monthly },
  };
}

export function listWallets(): Wallet[] {
  return wallets.map(cloneWallet);
}

export function getWalletById(id: string): Wallet {
  const wallet = wallets.find((item) => item.id === id);
  if (!wallet) throw new WalletMockServiceError("wallet-not-found");
  return cloneWallet(wallet);
}

export function listWalletTypes(): WalletType[] {
  return walletTypes.map(cloneWalletType);
}

export function listWalletTransactions(): WalletTransaction[] {
  return transactions.map(cloneTransaction);
}

export function createWallet(input: WalletInput): Wallet {
  const normalized = normalizeWalletInput(input);
  const wallet = {
    ...normalized,
    id: `wallet-${nextWalletId++}`,
  };
  wallets = [wallet, ...wallets];
  return cloneWallet(wallet);
}

export function updateWallet(id: string, input: WalletInput): Wallet {
  const existing = wallets.find((wallet) => wallet.id === id);
  if (!existing) throw new WalletMockServiceError("wallet-not-found");
  const updated = {
    ...existing,
    ...normalizeWalletInput(input),
    id,
  };
  wallets = wallets.map((wallet) => (wallet.id === id ? updated : wallet));
  return cloneWallet(updated);
}

export function deleteWallet(id: string): void {
  if (!wallets.some((wallet) => wallet.id === id)) {
    throw new WalletMockServiceError("wallet-not-found");
  }
  wallets = wallets.filter((wallet) => wallet.id !== id);
}

export function createWalletType(input: WalletTypeInput): WalletType {
  const normalized = normalizeWalletTypeInput(input);
  const type = {
    ...normalized,
    id: `wallet-type-custom-${nextWalletTypeId++}`,
  };
  walletTypes = [type, ...walletTypes];
  return cloneWalletType(type);
}

export function updateWalletType(
  id: string,
  input: WalletTypeInput,
): WalletType {
  if (!walletTypes.some((type) => type.id === id)) {
    throw new WalletMockServiceError("wallet-type-not-found");
  }
  const updated = { ...normalizeWalletTypeInput(input), id };
  walletTypes = walletTypes.map((type) => (type.id === id ? updated : type));
  return cloneWalletType(updated);
}

export function deleteWalletType(id: string): void {
  if (!walletTypes.some((type) => type.id === id)) {
    throw new WalletMockServiceError("wallet-type-not-found");
  }
  if (wallets.some((wallet) => wallet.typeId === id)) {
    throw new WalletMockServiceError("wallet-type-in-use");
  }
  walletTypes = walletTypes.filter((type) => type.id !== id);
}
