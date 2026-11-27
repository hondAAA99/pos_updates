import { getInitialProductTypes } from "@/features/product-types/services/product-types-service";
import {
  getInitialProducts,
} from "@/features/products/services/products-service";
import { getInitialStockRecords } from "@/features/inventory/services/stock-service";
import {
  getEmployeeById,
  listEmployees,
  mockCurrentCashierId,
} from "@/features/employees/services/employees-service";
import { mockCashierReceipts } from "@/features/dashboard/data/mock-cashier-receipts";
import type {
  CashierReceipt,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";
import { initialBranchStock } from "../data/mock-branch-stock";
import type {
  SaleDraft,
  SaleProductOption,
  SaleQuote,
  SaleReceiptLine,
  SaleResult,
  SaleValidationCode,
} from "../types/sale";

const products = getInitialProducts(getInitialProductTypes());
let centralStock: ReturnType<typeof getInitialStockRecords> | undefined;
const branchStock = initialBranchStock.map((record) => ({ ...record }));
const salesRecords: Array<{
  receipt: CashierReceipt;
  branchId: string;
  cashierName?: string;
}> = mockCashierReceipts.map((receipt) => ({
  receipt: { ...receipt },
  branchId: receipt.branchId ?? "",
}));

export class SaleWorkflowError extends Error {
  constructor(readonly code: SaleValidationCode) {
    super(code);
  }
}

function getCairoDateKey(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid mock receipt timestamp: "${timestamp}".`);
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
  return parts;
}

function timestampOnDate(timestamp: string, dateKey: string): string {
  const time = timestamp.slice(11, 19);
  const date = new Date(`${dateKey}T${time}Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid mock receipt time or date: "${timestamp}".`);
  }
  const formattedDate = getCairoDateKey(date.toISOString());
  if (formattedDate !== dateKey) {
    throw new Error("Mock receipt time is outside the cashier's Cairo day.");
  }
  return date.toISOString();
}

function getBranchQuantity(branchId: string, productId: string): number {
  return (
    branchStock.find(
      (record) =>
        record.branchId === branchId && record.productId === productId,
    )?.branchQuantity ?? 0
  );
}

function getCentralStockRecords() {
  centralStock ??= getInitialStockRecords(products);
  return centralStock;
}

function getProductOption(
  branchId: string,
  productId: string,
): SaleProductOption {
  const product = products.find((item) => item._id === productId);
  const stock = getCentralStockRecords().find(
    (item) => item.product_id?._id === productId,
  );

  if (!product || !stock) {
    throw new SaleWorkflowError("productUnavailable");
  }
  return {
    product: {
      ...product,
      productType: product.productType ? { ...product.productType } : null,
    },
    availableQuantity: getBranchQuantity(branchId, productId),
    unitPrice: stock.current_selling_price_per_piece,
  };
}

export function listSaleProducts(
  branchId: string,
  query: string,
): SaleProductOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return products
    .filter((product) => {
      const option = getProductOption(branchId, product._id);
      return (
        option.availableQuantity > 0 &&
        (!normalizedQuery ||
          product.productName.toLocaleLowerCase().includes(normalizedQuery) ||
          product.serialNumber.toLocaleLowerCase().includes(normalizedQuery))
      );
    })
    .map((product) => getProductOption(branchId, product._id));
}

export function listSaleSalesmen(branchId: string) {
  return listEmployees({
    page: 1,
    limit: 100,
    branchId,
    role: "sales-man",
  }).data;
}

export function getSaleProductOption(
  branchId: string,
  productId: string,
): SaleProductOption {
  return getProductOption(branchId, productId);
}

export function getSaleLineTotal(
  branchId: string,
  productId: string,
  quantity: number,
): number {
  if (!Number.isInteger(quantity) || quantity < 1) return 0;
  const option = getProductOption(branchId, productId);
  return roundCurrency(option.unitPrice * quantity);
}

function getNextReceiptReference(dateKey: string): string {
  const prefix = `RCP-${dateKey.replaceAll("-", "")}-`;
  const nextNumber =
    salesRecords.reduce((maximum, record) => {
      if (!record.receipt.referenceNumber.startsWith(prefix)) return maximum;
      const suffix = Number.parseInt(
        record.receipt.referenceNumber.slice(prefix.length),
        10,
      );
      return Number.isNaN(suffix) ? maximum : Math.max(maximum, suffix);
    }, 0) + 1;
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSaleQuote(
  branchId: string,
  dateKey: string,
  draft: SaleDraft,
): SaleQuote {
  if (!draft.salesmanId) {
    throw new SaleWorkflowError("salesmanRequired");
  }

  const salesman = getEmployeeById(draft.salesmanId);
  if (
    !salesman ||
    salesman.role !== "sales-man" ||
    salesman.branchId !== branchId
  ) {
    throw new SaleWorkflowError("salesmanUnavailable");
  }
  if (draft.items.length === 0) {
    throw new SaleWorkflowError("itemsRequired");
  }
  if (
    !Number.isFinite(draft.discount) ||
    draft.discount < 0
  ) {
    throw new SaleWorkflowError("discountInvalid");
  }
  const seenProducts = new Set<string>();
  const items: SaleReceiptLine[] = draft.items.map((item) => {
    if (seenProducts.has(item.productId)) {
      throw new SaleWorkflowError("duplicateProduct");
    }
    seenProducts.add(item.productId);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new SaleWorkflowError("quantityInvalid");
    }
    const option = getProductOption(branchId, item.productId);
    if (item.quantity > option.availableQuantity) {
      throw new SaleWorkflowError("stockUnavailable");
    }
    if (!Number.isFinite(option.unitPrice) || option.unitPrice <= 0) {
      throw new SaleWorkflowError("productUnavailable");
    }
    return {
      productId: option.product._id,
      productName: option.product.productName,
      serialNumber: option.product.serialNumber,
      quantity: item.quantity,
      unitPrice: option.unitPrice,
      lineTotal: roundCurrency(option.unitPrice * item.quantity),
    };
  });
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const discount = roundCurrency(draft.discount);
  if (discount > subtotal) {
    throw new SaleWorkflowError("discountTooHigh");
  }

  return {
    receiptReference: getNextReceiptReference(dateKey),
    salesmanId: salesman._id,
    salesmanName: salesman.name,
    items,
    subtotal,
    discount,
    total: roundCurrency(subtotal - discount),
    paymentMethod: draft.paymentMethod,
  };
}

function assertStockAvailable(branchId: string, quote: SaleQuote): void {
  for (const item of quote.items) {
    if (item.quantity > getBranchQuantity(branchId, item.productId)) {
      throw new SaleWorkflowError("stockUnavailable");
    }
  }
}

export function submitSale(
  branchId: string,
  dateKey: string,
  draft: SaleDraft,
  status: Extract<ReceiptSaleStatus, "completed" | "rejected">,
  timestamp = new Date().toISOString(),
): SaleResult {
  const quote = calculateSaleQuote(branchId, dateKey, draft);
  const paymentMethod = draft.paymentMethod;
  if (!paymentMethod) {
    throw new SaleWorkflowError("paymentRequired");
  }
  assertStockAvailable(branchId, quote);

  const receipt: CashierReceipt = {
    _id: quote.receiptReference,
    referenceNumber: quote.receiptReference,
    timestamp,
    totalAmount: quote.total,
    paymentMethod,
    status,
    salesmanName: quote.salesmanName,
    subtotal: quote.subtotal,
    discount: quote.discount,
    items: quote.items.map((item) => ({ ...item })),
  };

  if (status === "completed") {
    for (const item of quote.items) {
      const stockRecord = branchStock.find(
        (record) =>
          record.branchId === branchId && record.productId === item.productId,
      );
      if (!stockRecord) {
        throw new Error(`Branch stock for "${item.productName}" is unavailable.`);
      }
      stockRecord.branchQuantity -= item.quantity;
    }
  }

  const cashier = getEmployeeById(mockCurrentCashierId);
  salesRecords.unshift({
    receipt,
    branchId,
    cashierName: cashier?.name,
  });
  return {
    receipt: { ...receipt, items: receipt.items?.map((item) => ({ ...item })) },
    quote,
    status,
  };
}

export function listCashierReceipts(
  branchId: string,
  dateKey: string,
): CashierReceipt[] {
  return salesRecords
    .filter((record) => record.branchId === branchId)
    .map(({ receipt }) => {
      const seedReceipt = mockCashierReceipts.find(
        (seed) => seed._id === receipt._id,
      );
      return {
        ...receipt,
        timestamp: seedReceipt
          ? timestampOnDate(receipt.timestamp, dateKey)
          : receipt.timestamp,
      };
    })
    .filter((receipt): receipt is CashierReceipt => Boolean(receipt))
    .filter((receipt) => getCairoDateKey(receipt.timestamp) === dateKey)
    .map((receipt) => ({
      ...receipt,
      items: receipt.items?.map((item) => ({ ...item })),
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}
