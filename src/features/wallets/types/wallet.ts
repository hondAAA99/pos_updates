
export type WalletType = {
  id: string;
  name: string;
  capacity: number;
  daily: number;
  monthly: number;
  transfer_fee?: WalletTransferFee;
};

export type WalletTransferFee = {
  sameWallet: number;
  differentWallet: {
    min: number;
    max: number;
  };
};

export type RemainingLimits = {
  daily: {
    depositAmount: number;
    transferAmount: number;
  };
  monthly: {
    depositAmount: number;
    transferAmount: number;
  };
};

export type Wallet = {
  id: string;
  typeId: string;
  type?: WalletType;
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
  phoneNumber?: string;
  timestamp: Date;
};

// Wallet types

export type WalletTypeInput = Omit<WalletType, "id" | "transfer_fee"> & {
  transfer_fee: WalletTransferFee;
};

export type WalletTypeUpdateInput = Partial<WalletTypeInput>;

// Wallets

export type WalletInput = {
  typeId: string;
  phoneNumber: string;
  money_amount: number;
};

export type WalletUpdateInput = Partial<WalletInput>;

// Wallet transactions

export type WalletOperationInput = {
  moneyAmount: number;
  transaction_fee: number;
};

export type WalletTransferInput = WalletOperationInput & {
  phoneNumber: string;
};

export type WalletTransferResponse = {
  send: number;
};

// Pagination

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  totalDoc: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  meta: PaginationMeta;
  data: T[];
};
