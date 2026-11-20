import type {
  CashierReceipt,
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";
import type {
  ReceiptApiDocument,
  ReceiptDetailsApiResponse,
} from "./sales-api-service";

export type ReceiptPrintData = {
  referenceNumber: string;
  timestamp?: string;
  employeeId?: string;
  clientId?: string;
  branchId?: string;
  paymentMethod?: ReceiptPaymentMethod;
  status?: ReceiptSaleStatus;
  confirmed?: boolean;
  comments?: string;
  subtotal?: number;
  salePercentage?: number;
  allowedSalePercentage?: number;
  totalAmount?: number;
  items: Array<{
    productId?: string;
    productName?: string;
    serialNumber?: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
};

function getReceiptId(receipt: ReceiptApiDocument): string | undefined {
  return receipt.id ?? receipt._id;
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Receipt API returned an invalid ${field}.`);
  }
  return value;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalTimestamp(value: unknown): string | undefined {
  const timestamp = optionalText(value);
  return timestamp && !Number.isNaN(new Date(timestamp).getTime())
    ? timestamp
    : undefined;
}

function normalizePaymentMethod(value: string): ReceiptPaymentMethod {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized === "cash") return "cash";
  if (normalized === "e-payment" || normalized === "wallet") return "wallet";
  if (normalized === "card") return "card";
  if (normalized === "mobilewallet" || normalized === "mobile_wallet") {
    return "mobileWallet";
  }
  return value;
}

function normalizeStatus(value: string): ReceiptSaleStatus {
  const normalized = value.trim().toLocaleLowerCase();
  if (
    normalized === "completed" ||
    normalized === "rejected" ||
    normalized === "refunded" ||
    normalized === "voided"
  ) {
    return normalized;
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Receipt API returned an invalid ${field}.`);
  }
  return value;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function mapReceiptApiRecord(
  receipt: ReceiptApiDocument,
): CashierReceipt {
  const id = getReceiptId(receipt);
  if (!id) {
    throw new Error("Receipt API response is missing its receipt identifier.");
  }
  if (
    typeof receipt.timestamp !== "string" ||
    Number.isNaN(new Date(receipt.timestamp).getTime())
  ) {
    throw new Error("Receipt API response is missing a valid timestamp.");
  }

  return {
    _id: id,
    referenceNumber: id,
    timestamp: requireText(receipt.timestamp, "timestamp"),
    totalAmount: requireNumber(receipt.price_after_sale, "final amount"),
    paymentMethod: normalizePaymentMethod(
      requireText(receipt.payment_method, "payment method"),
    ),
    status: normalizeStatus(requireText(receipt.status, "status")),
    employeeId: optionalText(receipt.employeeId),
    clientId: optionalText(receipt.clientId),
    branchId: optionalText(receipt.branchId),
    confirmed: typeof receipt.confirm === "boolean" ? receipt.confirm : undefined,
    comments: optionalText(receipt.comments),
    subtotal: optionalNumber(receipt.receiptPrice),
    salePercentage: optionalNumber(receipt.sale_perc),
    allowedSalePercentage: optionalNumber(receipt.allowed_sale_perc),
  };
}

export function mapReceiptDetails(
  details: ReceiptDetailsApiResponse,
  requestedId: string,
): ReceiptPrintData {
  const receipt = details.receipt;
  const referenceNumber = getReceiptId(receipt) ?? requestedId;
  const lineItems = details.lineItem ?? details.lineItems;
  if (!lineItems) {
    throw new Error("Receipt details response is missing its line items.");
  }
  const paymentMethod = optionalText(receipt.payment_method);
  const status = optionalText(receipt.status);

  return {
    referenceNumber,
    timestamp: optionalTimestamp(receipt.timestamp),
    employeeId: optionalText(receipt.employeeId),
    clientId: optionalText(receipt.clientId),
    branchId: optionalText(receipt.branchId),
    paymentMethod: paymentMethod
      ? normalizePaymentMethod(paymentMethod)
      : undefined,
    status: status ? normalizeStatus(status) : undefined,
    confirmed:
      typeof receipt.confirm === "boolean" ? receipt.confirm : undefined,
    comments: optionalText(receipt.comments),
    subtotal: optionalNumber(receipt.receiptPrice),
    salePercentage: optionalNumber(receipt.sale_perc),
    allowedSalePercentage: optionalNumber(receipt.allowed_sale_perc),
    totalAmount: optionalNumber(receipt.price_after_sale),
    items: lineItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      serialNumber: item.productSerialNumber,
      quantity: item.productQuantity,
      unitPrice: item.productPrice,
      lineTotal: item.total,
    })),
  };
}
