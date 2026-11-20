import type {
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "../types/cashier-dashboard";

export function getReceiptPaymentTranslationKey(
  method: ReceiptPaymentMethod,
) {
  switch (method) {
    case "cash":
      return "paymentMethods.cash";
    case "card":
      return "paymentMethods.card";
    case "mobileWallet":
      return "paymentMethods.mobileWallet";
    case "wallet":
      return "paymentMethods.wallet";
    default:
      return undefined;
  }
}

export function getReceiptStatusTranslationKey(status: ReceiptSaleStatus) {
  switch (status) {
    case "completed":
      return "statuses.completed";
    case "rejected":
      return "statuses.rejected";
    case "refunded":
      return "statuses.refunded";
    case "voided":
      return "statuses.voided";
    default:
      return undefined;
  }
}
