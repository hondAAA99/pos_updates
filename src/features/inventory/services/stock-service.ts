import type { ProductDetail } from "@/features/products/types/product";
import { initialStock } from "../data/mock-stock";
import type {
  StockPage,
  StockCreateFormValues,
  StockRecord,
  UpdateStockDto,
} from "../types/stock";

function getProduct(products: ProductDetail[], id: string): ProductDetail {
  const product = products.find((item) => item._id === id);

  if (!product) {
    throw new Error(`Product "${id}" does not exist.`);
  }

  return product;
}

function getNextStockId(stocks: StockRecord[]): string {
  const nextNumber = stocks.reduce((maximum, stock) => {
    const suffix = Number.parseInt(stock._id.slice(-2), 16);
    return Number.isNaN(suffix) ? maximum : Math.max(maximum, suffix);
  }, 0x7f) + 1;

  return `64b1f2a3c9e77b1a2b3c4d${nextNumber.toString(16).padStart(2, "0")}`;
}

export function getInitialStockRecords(
  products: ProductDetail[],
): StockRecord[] {
  return initialStock.map((seed) => {
    const product = getProduct(products, seed.productId);

    return {
      _id: seed._id,
      product_id: {
        _id: product._id,
        productName: product.productName,
        serialNumber: product.serialNumber,
      },
      total_quantity: seed.total_quantity,
      current_selling_price_per_piece: seed.current_selling_price_per_piece,
      current_wholesale_price_per_piece: seed.current_wholesale_price_per_piece,
      current_purchase_price_per_piece: seed.current_purchase_price_per_piece,
    };
  });
}

export function filterStockRecords(
  stocks: StockRecord[],
  query: string,
  productId: string,
): StockRecord[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return stocks.filter((stock) => {
    const matchesQuery =
      !normalizedQuery ||
      Boolean(
        stock.product_id &&
          ((stock.product_id.productName ?? "")
            .toLocaleLowerCase()
            .includes(normalizedQuery) ||
            (stock.product_id.serialNumber ?? "")
              .toLocaleLowerCase()
              .includes(normalizedQuery)),
      );
    const matchesProduct =
      productId === "all" || stock.product_id?._id === productId;

    return matchesQuery && matchesProduct;
  });
}

export function paginateStockRecords(
  stocks: StockRecord[],
  requestedPage: number,
  pageSize: number,
): StockPage {
  const totalItems = stocks.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const page =
    totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: stocks.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export function withStockProductDetails(
  stock: StockRecord,
  products: ProductDetail[],
): StockRecord {
  if (!stock.product_id) return stock;

  const catalogueProduct = products.find(
    (product) => product._id === stock.product_id?._id,
  );

  return {
    ...stock,
    product_id: {
      _id: stock.product_id._id,
      productName:
        stock.product_id.productName || catalogueProduct?.productName,
      serialNumber:
        stock.product_id.serialNumber || catalogueProduct?.serialNumber,
    },
  };
}

export function createStockRecord(
  stocks: StockRecord[],
  dto: StockCreateFormValues,
  products: ProductDetail[],
): StockRecord {
  const product = getProduct(products, dto.productId);

  return {
    _id: getNextStockId(stocks),
    product_id: {
      _id: product._id,
      productName: product.productName,
      serialNumber: product.serialNumber,
    },
    total_quantity: dto.total_quantity,
    current_selling_price_per_piece: dto.batch_selling_price_per_piece,
    current_wholesale_price_per_piece: dto.batch_wholesale_price_per_piece,
    current_purchase_price_per_piece: dto.batch_purchase_price,
  };
}

export function updateStockRecord(
  stocks: StockRecord[],
  id: string,
  dto: UpdateStockDto,
): StockRecord[] {
  return stocks.map((stock) =>
    stock._id === id
      ? {
          ...stock,
          ...dto,
        }
      : stock,
  );
}

export function deleteStockRecord(
  stocks: StockRecord[],
  id: string,
): StockRecord[] {
  return stocks.filter((stock) => stock._id !== id);
}
