import type { ProductType } from "@/features/product-types/types/product-type";
import { apiClient } from "@/lib/api-client";
import { initialProducts } from "../data/mock-products";
import type {
  CreateProductRequest,
  ProductDetail,
  ProductListItem,
  ProductListItemPage,
  ProductPage,
  UpdateProductRequest,
} from "../types/product";

type ProductListApiItem = {
  _id: string;
  productName: string;
  serialNumber: string;
};

type ProductListApiResponse = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: ProductListApiItem[];
};

type ProductDetailApiResponse = {
  product: {
    _id: string;
    productName: string;
    serialNumber: string;
    productType: {
      _id: string;
      name: string;
    } | null;
  };
};

type ProductCreateApiResponse = {
  message: string;
  serialNumber: string;
};

export async function listProducts(
  token: string,
  params: { page: number; limit: number; productType?: string },
): Promise<ProductPage> {
  const response = await apiClient.get<ProductListApiResponse>("/products", {
    token,
    cache: "no-store",
    params: {
      page: params.page,
      limit: params.limit,
      productType:
        params.productType && params.productType !== "all"
          ? params.productType
          : "",
    },
  });

  const items = await Promise.all(
    response.data.map(async (item) => {
      const detail = await getProduct(token, item._id);
      return {
        _id: detail._id,
        productName: detail.productName,
        serialNumber: detail.serialNumber,
        productType: detail.productType,
      } satisfies ProductDetail;
    }),
  );

  return {
    items,
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export async function listProductItems(
  token: string,
  params: { page: number; limit: number },
): Promise<ProductListItemPage> {
  const response = await apiClient.get<ProductListApiResponse>("/products", {
    token,
    cache: "no-store",
    params: {
      page: params.page,
      limit: params.limit,
      productType: "",
    },
  });

  return {
    items: response.data.map(
      (item): ProductListItem => ({
        _id: item._id,
        productName: item.productName,
        serialNumber: item.serialNumber,
      }),
    ),
    page: response.meta.currentPage,
    pageSize: response.meta.limit,
    totalItems: response.meta.totalDoc,
    totalPages: response.meta.totalPages,
  };
}

export async function getProduct(token: string, id: string): Promise<ProductDetail> {
  const response = await apiClient.get<ProductDetailApiResponse>(`/products/${id}`, {
    token,
    cache: "no-store",
  });
  const product = response.product;

  return {
    _id: product._id,
    productName: product.productName,
    serialNumber: product.serialNumber,
    productType: product.productType,
  };
}

export async function createProduct(
  token: string,
  request: CreateProductRequest,
): Promise<ProductCreateApiResponse> {
  return apiClient.post<ProductCreateApiResponse>("/products", request, { token });
}

export async function updateProduct(
  token: string,
  id: string,
  request: UpdateProductRequest,
): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(`/products/${id}`, request, { token });
}

export async function deleteProduct(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/products/${id}`, { token });
}

export function getInitialProducts(productTypes?: ProductType[]): ProductDetail[] {
  return initialProducts.map((product) => {
    const productType = productTypes?.find(
      (item) => item._id === product.productTypeId,
    );

    return {
      _id: product._id,
      productName: product.productName,
      serialNumber: product.serialNumber,
      productType: productType
        ? { _id: productType._id, name: productType.name }
        : null,
    };
  });
}

export function filterProducts(
  products: ProductDetail[],
  query: string,
  productTypeId = "all",
): ProductDetail[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      (product.productName ?? "").toLocaleLowerCase().includes(normalizedQuery) ||
      (product.serialNumber ?? "").toLocaleLowerCase().includes(normalizedQuery);
    const matchesProductType =
      productTypeId === "all" || product.productType?._id === productTypeId;

    return matchesQuery && matchesProductType;
  });
}

export function paginateProducts(
  products: ProductDetail[],
  requestedPage: number,
  pageSize: number,
): ProductPage {
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize || 1));
  const page = totalPages === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: products.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}
