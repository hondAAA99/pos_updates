import { apiClient } from "@/lib/api-client";
import type {
  BranchInventoryPage,
  BranchInventoryRecord,
} from "../types/branch-inventory";

type BranchInventoryApiProduct = {
  _id: string;
  productName: string;
  productType?: {
    _id: string;
    name: string;
  } | null;
};

type BranchInventoryApiRecord = {
  _id: string;
  product_id: BranchInventoryApiProduct | null;
  branchQuantity: number;
};

type BranchInventoryListApiItem =
  | BranchInventoryApiRecord
  | { product: BranchInventoryApiRecord };

type BranchInventoryDirectDetailApiItem = {
  _id: string;
  product_id: {
    _id: string;
    productName: string;
    productType: {
      _id: string;
      name: string;
    } | null;
  } | null;
  branchQuantity: number;
};

type BranchInventorySwaggerDetailApiItem = {
  product: {
    _id: string;
    product_id: {
      _id: string;
      productName: string;
      productType: {
        _id: string;
        name: string;
      } | null;
    } | null;
    branchQuantity: number;
  };
  productPrices?: {
    current_selling_price_per_piece: number;
    current_wholesale_price_per_piece: number;
    current_purchase_price_per_piece: number;
  };
};

type BranchInventoryListApiResponse = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: BranchInventoryListApiItem[];
};

function mapListItem(item: BranchInventoryListApiItem): BranchInventoryRecord {
  const record = "product" in item ? item.product : item;

  return {
    _id: record._id,
    product_id: record.product_id
      ? {
          _id: record.product_id._id,
          productName: record.product_id.productName,
          productType: record.product_id.productType
            ? {
                _id: record.product_id.productType._id,
                name: record.product_id.productType.name,
              }
            : null,
        }
      : null,
    branchQuantity: record.branchQuantity,
  };
}

function isSwaggerDetail(
  response:
    | BranchInventoryDirectDetailApiItem
    | BranchInventorySwaggerDetailApiItem,
): response is BranchInventorySwaggerDetailApiItem {
  return "product" in response;
}

function mapDetail(
  response:
    | BranchInventoryDirectDetailApiItem
    | BranchInventorySwaggerDetailApiItem,
): BranchInventoryRecord {
  if (isSwaggerDetail(response)) {
    return {
      _id: response.product._id,
      product_id: response.product.product_id
        ? {
            _id: response.product.product_id._id,
            productName: response.product.product_id.productName,
            productType: response.product.product_id.productType
              ? {
                  _id: response.product.product_id.productType._id,
                  name: response.product.product_id.productType.name,
                }
              : null,
          }
        : null,
      branchQuantity: response.product.branchQuantity,
    };
  }

  return {
    _id: response._id,
    product_id: response.product_id
      ? {
          _id: response.product_id._id,
          productName: response.product_id.productName,
          productType: response.product_id.productType
            ? {
                _id: response.product_id.productType._id,
                name: response.product_id.productType.name,
              }
            : null,
        }
      : null,
    branchQuantity: response.branchQuantity,
  };
}

export async function listBranchInventory(
  token: string,
  params: { page: number; limit: number; branchId: string },
): Promise<BranchInventoryPage> {
  const branchId = params.branchId.trim();
  if (!branchId || branchId === "admin") {
    throw new Error("Branch inventory requires a real branch ID.");
  }

  const response = await apiClient.get<BranchInventoryListApiResponse>(
    "/branch/inventory",
    {
      token,
      params: {
        page: params.page,
        limit: params.limit,
        branchId,
      },
    },
  );

  return {
    items: response.data.map(mapListItem),
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export async function getBranchInventoryItem(
  token: string,
  branchId: string,
  productId: string,
): Promise<BranchInventoryRecord> {
  const normalizedBranchId = branchId.trim();
  const normalizedProductId = productId.trim();
  if (!normalizedBranchId || normalizedBranchId === "admin" || !normalizedProductId) {
    throw new Error("Branch inventory details require a branch ID and product ID.");
  }

  const path = `/branch/${normalizedBranchId}/invnetory/${normalizedProductId}`;
  const response = await apiClient.get<
    BranchInventoryDirectDetailApiItem | BranchInventorySwaggerDetailApiItem
  >(path, {
    token,
    params: {
      branchId: normalizedBranchId,
      productId: normalizedProductId,
    },
  });
  return mapDetail(response);
}

export async function updateBranchInventoryItem(
  token: string,
  id: string,
  branchQuantity: number,
): Promise<{ message: string }> {
  const [branchId, productId] = id.split(":");
  const path =
    branchId && productId
      ? `/branch/${branchId}/invnetory/${productId}`
      : `/branch/inventory/${id}`;

  return apiClient.patch<{ message: string }>(path, { productQuantity: branchQuantity }, { token });
}

export async function deleteBranchInventoryItem(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const [branchId, productId] = id.split(":");
  const path =
    branchId && productId
      ? `/branch/${branchId}/invnetory/${productId}`
      : `/branch/inventory/${id}`;

  return apiClient.del<{ message: string }>(path, {
    token,
  });
}
