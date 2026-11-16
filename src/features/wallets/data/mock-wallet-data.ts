import type { Wallet, WalletTransaction, WalletType } from "../types/wallet";

export const initialWalletTypes: WalletType[] = [
  {
    id: "wallet-type-standard",
    name: "Standard",
    capacity: 25000,
    daily: { transfer: 10000, withdraw: 5000 },
    monthly: { transfer: 100000, withdraw: 50000 },
  },
  {
    id: "wallet-type-premium",
    name: "Premium",
    capacity: 100000,
    daily: { transfer: 50000, withdraw: 25000 },
    monthly: { transfer: 500000, withdraw: 250000 },
  },
  {
    id: "wallet-type-basic",
    name: "Basic",
    capacity: 10000,
    daily: { transfer: 3000, withdraw: 2000 },
    monthly: { transfer: 30000, withdraw: 20000 },
  },
];

export const initialWallets: Wallet[] = [
  {
    id: "wallet-1001",
    typeId: "wallet-type-standard",
    phoneNumber: "+201001234567",
    money_amount: 4200,
    remainingLimits: {
      daily: { depositAmount: 16000, transferAmount: 6500 },
      monthly: { depositAmount: 72000, transferAmount: 68400 },
    },
  },
  {
    id: "wallet-1002",
    typeId: "wallet-type-premium",
    phoneNumber: "+201102345678",
    money_amount: 36750,
    remainingLimits: {
      daily: { depositAmount: 63250, transferAmount: 31800 },
      monthly: { depositAmount: 386500, transferAmount: 421000 },
    },
  },
  {
    id: "wallet-1003",
    typeId: "wallet-type-basic",
    phoneNumber: "+201203456789",
    money_amount: 1850,
    remainingLimits: {
      daily: { depositAmount: 7150, transferAmount: 0 },
      monthly: { depositAmount: 22400, transferAmount: 18500 },
    },
  },
  {
    id: "wallet-1004",
    typeId: "wallet-type-standard",
    phoneNumber: "+201004567890",
    money_amount: 12400,
    remainingLimits: {
      daily: { depositAmount: 8500, transferAmount: 4200 },
      monthly: { depositAmount: 52800, transferAmount: 47200 },
    },
  },
  {
    id: "wallet-1005",
    typeId: "wallet-type-premium",
    phoneNumber: "+201105678901",
    money_amount: 81200,
    remainingLimits: {
      daily: { depositAmount: 18800, transferAmount: 9700 },
      monthly: { depositAmount: 218800, transferAmount: 184500 },
    },
  },
  {
    id: "wallet-1006",
    typeId: "wallet-type-basic",
    phoneNumber: "+201206789012",
    money_amount: 6400,
    remainingLimits: {
      daily: { depositAmount: 3600, transferAmount: 1100 },
      monthly: { depositAmount: 17200, transferAmount: 14800 },
    },
  },
  {
    id: "wallet-1007",
    typeId: "wallet-type-standard",
    phoneNumber: "+201007890123",
    money_amount: 8300,
    remainingLimits: {
      daily: { depositAmount: 12600, transferAmount: 8300 },
      monthly: { depositAmount: 63400, transferAmount: 56200 },
    },
  },
];

export const initialWalletTransactions: WalletTransaction[] = [
  {
    id: "sample-transaction-001",
    walletId: "wallet-1001",
    moneyAmount: 750,
    transactionType: "Sample type A",
    transaction_fee: 5,
    phoneNumber: "+201001234567",
    timestamp: new Date("2026-11-16T08:30:00+02:00"),
  },
  {
    id: "sample-transaction-002",
    walletId: "wallet-1002",
    moneyAmount: 1250,
    transactionType: "Sample type B",
    transaction_fee: 10,
    phoneNumber: "+201102345678",
    timestamp: new Date("2026-11-15T14:10:00+02:00"),
  },
  {
    id: "sample-transaction-003",
    walletId: "wallet-1003",
    moneyAmount: 300,
    transactionType: "Sample type A",
    transaction_fee: 2,
    phoneNumber: "+201203456789",
    timestamp: new Date("2026-11-14T11:45:00+02:00"),
  },
  {
    id: "sample-transaction-004",
    walletId: "wallet-1004",
    moneyAmount: 2100,
    transactionType: "Sample type C",
    transaction_fee: 15,
    phoneNumber: "+201004567890",
    timestamp: new Date("2026-11-12T16:20:00+02:00"),
  },
  {
    id: "sample-transaction-005",
    walletId: "wallet-1005",
    moneyAmount: 5000,
    transactionType: "Sample type B",
    transaction_fee: 25,
    phoneNumber: "+201105678901",
    timestamp: new Date("2026-11-10T09:05:00+02:00"),
  },
  {
    id: "sample-transaction-006",
    walletId: "wallet-1001",
    moneyAmount: 400,
    transactionType: "Sample type C",
    transaction_fee: 3,
    phoneNumber: "+201001234567",
    timestamp: new Date("2026-11-08T13:15:00+02:00"),
  },
];
