export type BranchInventoryProduct = {
  _id: string
  productName: string
  serialNumber: string
  productType?: {
    _id: string
    name: string
  } | null
} | null

export type BranchStockStatus = 'in-stock' | 'out-of-stock' | 'concluding'

export const branchStockStatusValues: readonly BranchStockStatus[] = [
  'in-stock',
  'out-of-stock',
  'concluding',
]

export type BranchInventoryRecord = {
  _id: string
  productId: BranchInventoryProduct
  branchQuantity: number
  status?: BranchStockStatus
}

export type BranchInventoryPage = {
  items: BranchInventoryRecord[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
