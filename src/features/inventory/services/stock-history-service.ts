import { apiClient } from "@/lib/api-client";
import type { ProductDetail } from "@/features/products/types/product";
import type {
  StockHistoryItem,
  StockHistoryPage,
} from "../types/stock-history";

type StockHistoryApiItem = {
  _id: string;
  productId: {
    _id: string;
    productName?: string;
    serialNumber?: string;
  } | null;
  supplierId:
    | {
        _id: string;
        name: string;
        phoneNumber?: string;
      }
    | string
    | null;
  timestamp: string;
  quantity: number;
  batch_selling_price: number;
  batch_purchase_price: number;
  batch_wholesale_price: number;
  profit_margin: number;
};

type StockHistoryListApiResponse = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: StockHistoryApiItem[];
};

function mapStockHistoryItem(item: StockHistoryApiItem): StockHistoryItem {
  return {
    _id: item._id,
    productId: item.productId
      ? {
          _id: item.productId._id,
          productName: item.productId.productName,
          serialNumber: item.productId.serialNumber,
        }
      : null,
    supplierId:
      item.supplierId && typeof item.supplierId !== "string"
      ? {
          _id: item.supplierId._id,
          name: item.supplierId.name,
          phoneNumber: item.supplierId.phoneNumber,
        }
      : null,
    timestamp: item.timestamp,
    quantity: item.quantity,
    batch_selling_price: item.batch_selling_price,
    batch_purchase_price: item.batch_purchase_price,
    batch_wholesale_price: item.batch_wholesale_price,
    profit_margin: item.profit_margin,
  };
}

export function resolveStockHistoryProduct(
  record: StockHistoryItem,
  products: ProductDetail[],
): StockHistoryItem {
  if (!record.productId) return record;

  const product = products.find(
    (item) => item._id === record.productId?._id,
  );

  return {
    ...record,
    productId: {
      ...record.productId,
      productName: record.productId.productName || product?.productName,
      serialNumber: record.productId.serialNumber || product?.serialNumber,
    },
  };
}

export async function listStockHistory(
  token: string,
  params: { page: number; limit: number; productId?: string },
): Promise<StockHistoryPage> {
  const response = await apiClient.get<StockHistoryListApiResponse>(
    "/stock/history",
    {
      token,
      params: {
        page: params.page,
        limit: params.limit,
        ...(params.productId ? { productId: params.productId } : {}),
      },
    },
  );

  return {
    items: response.data.map(mapStockHistoryItem),
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export async function getStockHistoryItem(
  token: string,
  id: string,
): Promise<StockHistoryItem> {
  const response = await apiClient.get<StockHistoryApiItem>(
    `/stock/history/${id}`,
    { token },
  );
  return mapStockHistoryItem(response);
}

export function filterStockHistory(
  history: StockHistoryItem[],
  query: string,
  productId: string,
): StockHistoryItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return history.filter((record) => {
    const matchesQuery =
      !normalizedQuery ||
      Boolean(
        record.productId?.productName
          ?.toLocaleLowerCase()
          .includes(normalizedQuery),
      );
    const matchesProduct =
      productId === "all" || record.productId?._id === productId;

    return matchesQuery && matchesProduct;
  });
}
