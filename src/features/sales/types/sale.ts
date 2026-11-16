import type { ProductDetail } from "@/features/products/types/product";
import type {
  CashierReceipt,
  ReceiptPaymentMethod,
  ReceiptSaleStatus,
} from "@/features/dashboard/types/cashier-dashboard";

export type SaleProductOption = {
  product: ProductDetail;
  availableQuantity: number;
  unitPrice: number;
};

export type SaleDraftItem = {
  productId: string;
  quantity: number;
};

export type SaleDraft = {
  salesmanId: string;
  items: SaleDraftItem[];
  discount: number;
  paymentMethod: ReceiptPaymentMethod | "";
};

export type SaleReceiptLine = {
  productId: string;
  productName: string;
  serialNumber: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleQuote = {
  receiptReference: string;
  salesmanId: string;
  salesmanName: string;
  items: SaleReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: ReceiptPaymentMethod | "";
};

export type SaleResult = {
  receipt: CashierReceipt;
  quote: SaleQuote;
  status: ReceiptSaleStatus;
};

export type SaleValidationErrors = Partial<
  Record<
    "salesman" | "items" | "quantity" | "discount" | "payment" | "stock",
    string
  >
>;

export type SaleValidationCode =
  | "salesmanRequired"
  | "salesmanUnavailable"
  | "itemsRequired"
  | "duplicateProduct"
  | "quantityInvalid"
  | "discountInvalid"
  | "discountTooHigh"
  | "paymentRequired"
  | "productUnavailable"
  | "stockUnavailable";
