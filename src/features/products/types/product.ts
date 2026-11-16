import type { ProductType } from "@/features/product-types/types/product-type";

export type ProductListItem = {
  _id: string;
  productName: string;
  serialNumber: string;
};

export type ProductTypeReference = Pick<ProductType, "_id" | "name">;

export type ProductDetail = ProductListItem & {
  productType: ProductTypeReference | null;
};

export type CreateProductRequest = {
  productName: string;
  productType: string;
};

export type UpdateProductRequest = {
  productName?: string;
  productType?: string;
};

export type ProductFormValues = {
  productName: string;
  productType: string;
};

export type ProductPage = {
  items: ProductDetail[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ProductListItemPage = {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
