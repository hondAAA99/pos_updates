import type { ProductDetail } from "@/features/products/types/product";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";

export type StockProduct =
  | (Pick<ProductDetail, "_id"> &
      Partial<Pick<ProductDetail, "productName" | "serialNumber">>)
  | null;

export const stockStatusValues = [
  "in-stock",
  "out-of-stock",
  "concluding",
] as const;

export type StockStatus = (typeof stockStatusValues)[number];

export type StockRecord = {
  _id: string;
  product_id: StockProduct;
  status?: StockStatus;
  total_quantity: number;
  current_selling_price_per_piece: number;
  current_wholesale_price_per_piece: number;
  current_purchase_price_per_piece: number;
};

export type AddStockDto = {
  batch_purchase_price: number;
  batch_selling_price_per_piece: number;
  batch_wholesale_price_per_piece: number;
  total_quantity: number;
  supplierId: string;
  supplierdepositAmount: number;
  comments: string;
  supplierNextDepositAmount: number;
  NextdeositDate: string;
  serialNumber: string;
};

export type StockCreateFormValues = Omit<AddStockDto, "serialNumber"> & {
  productId: string;
};

export type UpdateStockDto = {
  total_quantity?: number;
  current_selling_price_per_piece?: number;
  current_wholesale_price_per_piece?: number;
  current_purchase_price_per_piece?: number;
};

export type SupplierOption = SupplierListItem;

export type StockPage = {
  items: StockRecord[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type StockSearchFilters = {
  query: string;
  productId: string;
  status: StockStatus | "all";
};
