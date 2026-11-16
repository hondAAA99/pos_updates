export type WalletType = {
  id: string;
  name: string;
  capacity: number;
  daily: {
    id?: string;
    transfer: number;
    withdraw: number;
  };
  monthly: {
    id?: string;
    transfer: number;
    withdraw: number;
  };
};

export interface RemainingLimits {
  daily: {
    depositAmount: number;
    transferAmount: number;
  };
  monthly: {
    depositAmount: number;
    transferAmount: number;
  };
}

export type Wallet = {
  id: string;
  typeId: string;
  phoneNumber: string;
  money_amount: number;
  remainingLimits?: RemainingLimits;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  moneyAmount: number;
  transactionType: string;
  transaction_fee: number;
  phoneNumber: string;
  timestamp: Date;
};

export type WalletInput = Omit<Wallet, "id" | "remainingLimits">;
export type WalletTypeInput = Omit<WalletType, "id">;
