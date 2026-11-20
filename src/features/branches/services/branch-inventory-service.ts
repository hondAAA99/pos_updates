import { apiClient } from '@/lib/api-client'
import type {
  BranchInventoryProduct,
  BranchInventoryPage,
  BranchInventoryRecord,
} from '../types/branch-inventory'

type BranchInventoryApiProduct = NonNullable<BranchInventoryProduct>

type BranchInventoryApiRecord = {
  _id: string
  productId: BranchInventoryApiProduct | null
  branchQuantity: number
}

type BranchInventoryListApiItem =
  | BranchInventoryApiRecord
  | { product: BranchInventoryApiRecord }

type BranchInventorySwaggerDetailApiItem = {
  product: BranchInventoryApiRecord
  productPrices?: {
    current_selling_price_per_piece: number
    current_wholesale_price_per_piece: number
    current_purchase_price_per_piece: number
  }
}

type BranchInventoryListApiResponse = {
  meta: {
    totalDoc: number
    currentPage: number
    totalPages: number
    limit: number
  }
  data: BranchInventoryListApiItem[]
}

function mapRecord(record: BranchInventoryApiRecord): BranchInventoryRecord {
  return {
    _id: record._id,
    productId: record.productId,
    branchQuantity: record.branchQuantity,
  }
}

function mapListItem(item: BranchInventoryListApiItem): BranchInventoryRecord {
  return mapRecord('product' in item ? item.product : item)
}

function isSwaggerDetail(
  response:
    | BranchInventoryApiRecord
    | BranchInventorySwaggerDetailApiItem,
): response is BranchInventorySwaggerDetailApiItem {
  return 'product' in response
}

function mapDetail(
  response:
    | BranchInventoryApiRecord
    | BranchInventorySwaggerDetailApiItem,
): BranchInventoryRecord {
  if (isSwaggerDetail(response)) {
    return mapRecord(response.product)
  }

  return mapRecord(response)
}

export async function listBranchInventory(
  token: string,
  params: { page: number; limit: number; branchId: string },
): Promise<BranchInventoryPage> {
  const branchId = params.branchId.trim()
  if (!branchId || branchId === 'admin') {
    throw new Error('Branch inventory requires a real branch ID.')
  }

  const response = await apiClient.get<BranchInventoryListApiResponse>(
    '/branch/inventory',
    {
      token,
      params: {
        page: params.page,
        limit: params.limit,
        branchId,
      },
    },
  )

  return {
    items: response.data.map(mapListItem),
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  }
}

export async function getBranchInventoryItem(
  token: string,
  branchId: string,
  productId: string,
): Promise<BranchInventoryRecord> {
  const normalizedBranchId = branchId.trim()
  const normalizedProductId = productId.trim()
  if (
    !normalizedBranchId ||
    normalizedBranchId === 'admin' ||
    !normalizedProductId
  ) {
    throw new Error(
      'Branch inventory details require a branch ID and product ID.',
    )
  }

  const path = `/branch/${normalizedBranchId}/invnetory/${normalizedProductId}`
  const response = await apiClient.get<
    BranchInventoryApiRecord | BranchInventorySwaggerDetailApiItem
  >(path, {
    token,
    params: {
      branchId: normalizedBranchId,
      productId: normalizedProductId,
    },
  })
  return mapDetail(response)
}

export async function updateBranchInventoryItem(
  token: string,
  id: string,
  branchQuantity: number,
): Promise<{ message: string }> {
  const [branchId, productId] = id.split(':')
  const path =
    branchId && productId
      ? `/branch/${branchId}/invnetory/${productId}`
      : `/branch/inventory/${id}`

  return apiClient.patch<{ message: string }>(
    path,
    { productQuantity: branchQuantity },
    { token },
  )
}

export async function deleteBranchInventoryItem(
  token: string,
  id: string,
): Promise<{ message: string }> {
  const [branchId, productId] = id.split(':')
  const path =
    branchId && productId
      ? `/branch/${branchId}/invnetory/${productId}`
      : `/branch/inventory/${id}`

  return apiClient.del<{ message: string }>(path, {
    token,
  })
}
