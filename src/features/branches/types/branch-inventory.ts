export type BranchInventoryProduct = {
  _id: string;
  productName: string;
  productType?: {
    _id: string;
    name: string;
  } | null;
} | null;

export type BranchInventoryRecord = {
  _id: string;
  product_id: BranchInventoryProduct;
  branchQuantity: number;
};

export type BranchInventoryPage = {
  items: BranchInventoryRecord[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
