import type {
  CashierReceipt,
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";
import type {
  ReceiptApiDocument,
  ReceiptDetailsApiResponse,
  ReceiptRelationship,
} from "./sales-api-service";

export type ReceiptPrintData = {
  referenceNumber: string;
  timestamp?: string;
  salesmanName?: string;
  cashierName?: string;
  branchName?: string;
  employeeId?: string;
  clientId?: string;
  branchId?: string;
  paymentMethod?: ReceiptPaymentMethod;
  status?: ReceiptSaleStatus;
  confirmed?: boolean;
  comments?: string;
  subtotal?: number;
  discount?: number;
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

export function getReceiptRelationshipId(
  value: ReceiptRelationship | undefined,
): string | undefined {
  if (typeof value === "string") return optionalText(value);
  return value && typeof value._id === "string"
    ? optionalText(value._id)
    : undefined;
}

export function getReceiptRelationshipName(
  value: ReceiptRelationship | undefined,
): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  return optionalText(value.name);
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
  if (normalized === "e-payment") return "e-payment";
  if (normalized === "wallet") return "wallet";
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
    referenceNumber: requireText(receipt.receiptNumber, "receipt number"),
    timestamp: requireText(receipt.timestamp, "timestamp"),
    totalAmount: requireNumber(
      receipt.price_after_sale ?? receipt.receiptPrice,
      "final amount",
    ),
    paymentMethod: normalizePaymentMethod(
      requireText(receipt.payment_method, "payment method"),
    ),
    status: normalizeStatus(requireText(receipt.status, "status")),
    employeeId: getReceiptRelationshipId(receipt.employeeId),
    clientId: getReceiptRelationshipId(receipt.clientId),
    branchId: getReceiptRelationshipId(receipt.branchId),
    confirmed: typeof receipt.confirm === "boolean" ? receipt.confirm : undefined,
    comments: optionalText(receipt.comments),
    subtotal: optionalNumber(receipt.receiptPrice),
    discount: optionalNumber(receipt.discountAmount),
    salePercentage: optionalNumber(receipt.sale_perc),
    allowedSalePercentage: optionalNumber(receipt.allowed_sale_perc),
  };
}

export function mapReceiptDetails(
  details: ReceiptDetailsApiResponse,
  requestedId: string,
): ReceiptPrintData {
  const receipt = details.receipt;
  if (getReceiptId(receipt) !== requestedId) {
    throw new Error("Receipt details response did not match the requested ID.");
  }
  const referenceNumber = requireText(receipt.receiptNumber, "receipt number");
  const paymentMethod = optionalText(receipt.payment_method);
  const status = optionalText(receipt.status);

  return {
    referenceNumber,
    timestamp: optionalTimestamp(receipt.timestamp),
    salesmanName: getReceiptRelationshipName(receipt.employeeId),
    cashierName: getReceiptRelationshipName(receipt.cashierId),
    branchName: getReceiptRelationshipName(receipt.branchId),
    employeeId: getReceiptRelationshipId(receipt.employeeId),
    clientId: getReceiptRelationshipId(receipt.clientId),
    branchId: getReceiptRelationshipId(receipt.branchId),
    paymentMethod: paymentMethod
      ? normalizePaymentMethod(paymentMethod)
      : undefined,
    status: status ? normalizeStatus(status) : undefined,
    confirmed:
      typeof receipt.confirm === "boolean" ? receipt.confirm : undefined,
    comments: optionalText(receipt.comments),
    subtotal: optionalNumber(receipt.receiptPrice),
    discount: optionalNumber(receipt.discountAmount),
    salePercentage: optionalNumber(receipt.sale_perc),
    allowedSalePercentage: optionalNumber(receipt.allowed_sale_perc),
    totalAmount: optionalNumber(receipt.price_after_sale),
    items: details.lineItems.map((item) => ({
      productId: getReceiptRelationshipId(item.productId),
      productName: item.productName,
      serialNumber: item.serialNumber,
      quantity: item.quantity,
      unitPrice: item.unitPriceAtSale,
      lineTotal: item.lineTotal,
    })),
  };
}
