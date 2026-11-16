import { apiClient } from "@/lib/api-client";
import type {
  ProductType,
  ProductTypeApiItem,
  ProductTypeSortKey,
  SortDirection,
} from "../types/product-type";

function mapProductType(item: ProductTypeApiItem): ProductType {
  return {
    _id: item._id,
    name: item.name,
  };
}

export async function listProductTypes(token: string): Promise<ProductType[]> {
  const productTypes = await apiClient.get<ProductTypeApiItem[]>("/products-type", {
    token,
  });

  return productTypes.map(mapProductType);
}

export async function getProductType(
  token: string,
  id: string,
): Promise<ProductType> {
  const productType = await apiClient.get<ProductTypeApiItem>(
    `/products-type/${id}`,
    { token },
  );
  return mapProductType(productType);
}

export async function createProductType(token: string, name: string): Promise<void> {
  await apiClient.post<{ message: string }>(
    "/products-type",
    { name },
    { token },
  );
}

export async function updateProductType(
  token: string,
  id: string,
  name: string,
): Promise<void> {
  await apiClient.patch<{ message: string }>(`/products-type/${id}`, { name }, { token });
}

export async function deleteProductType(token: string, id: string): Promise<void> {
  await apiClient.del<{ message: string }>(`/products-type/${id}`, { token });
}

export function getInitialProductTypes(): ProductType[] {
  return [];
}

export function searchProductTypes(
  productTypes: ProductType[],
  query: string,
): ProductType[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return productTypes;
  }

  return productTypes.filter((productType) =>
    productType.name.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function sortProductTypes(
  productTypes: ProductType[],
  key: ProductTypeSortKey,
  direction: SortDirection,
  locale: string,
): ProductType[] {
  const multiplier = direction === "ascending" ? 1 : -1;

  return [...productTypes].sort((first, second) => {
    const comparison =
      key === "name"
        ? first.name.localeCompare(second.name, locale)
        : (first.createdAt ?? "").localeCompare(second.createdAt ?? "", locale);

    return comparison * multiplier;
  });
}
