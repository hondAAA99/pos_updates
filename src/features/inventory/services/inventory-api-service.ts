import { apiClient } from "@/lib/api-client";
import type {
  AddStockDto,
  StockPage,
  StockRecord,
  StockStatus,
  UpdateStockDto,
} from "../types/stock";

type StockApiItem = {
  _id: string;
  product_id: {
    _id: string;
    productName?: string | null;
    name?: string | null;
    serialNumber?: string | null;
    productSerialNumber?: string | null;
  } | null;
  status?: StockStatus;
  total_quantity: number;
  current_selling_price_per_piece: number;
  current_wholesale_price_per_piece: number;
  current_purchase_price_per_piece: number;
};

type StockListApiResponse = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: StockApiItem[];
};

function mapStock(item: StockApiItem): StockRecord {
  return {
    _id: item._id,
    product_id: item.product_id
      ? {
          _id: item.product_id._id,
          ...(item.product_id.productName || item.product_id.name
            ? {
                productName:
                  item.product_id.productName ?? item.product_id.name ?? "",
              }
            : {}),
          ...(item.product_id.serialNumber ||
          item.product_id.productSerialNumber
            ? {
                serialNumber:
                  item.product_id.serialNumber ??
                  item.product_id.productSerialNumber ??
                  "",
              }
            : {}),
        }
      : null,
    ...(item.status ? { status: item.status } : {}),
    total_quantity: item.total_quantity,
    current_selling_price_per_piece: item.current_selling_price_per_piece,
    current_wholesale_price_per_piece: item.current_wholesale_price_per_piece,
    current_purchase_price_per_piece: item.current_purchase_price_per_piece,
  };
}

export async function listInventory(
  token: string,
  params: { page: number; limit: number; status?: StockStatus },
): Promise<StockPage> {
  const response = await apiClient.get<StockListApiResponse>("/stock", {
    token,
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.status ? { status: params.status } : {}),
    },
  });

  return {
    items: response.data.map(mapStock),
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export async function searchInventoryBySerialNumber(
  token: string,
  serialNumber: string,
): Promise<StockRecord> {
  const response = await apiClient.get<StockApiItem>("/stock/search", {
    token,
    params: { serialNumber },
  });

  return mapStock(response);
}

export async function getInventoryItem(
  token: string,
  id: string,
): Promise<StockRecord> {
  const response = await apiClient.get<StockApiItem>(`/stock/${id}`, {
    token,
  });

  return mapStock(response);
}

export async function createInventoryStock(
  token: string,
  request: AddStockDto,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/stock", request, { token });
}

export async function updateInventoryStock(
  token: string,
  id: string,
  request: UpdateStockDto,
): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(
    `/stock/${id}`,
    request,
    { token },
  );
}

export async function deleteInventoryStock(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/stock/${id}`, { token });
}
