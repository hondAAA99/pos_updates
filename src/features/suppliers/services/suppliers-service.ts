import { apiClient } from "@/lib/api-client";
import type {
  CreateSupplierDto,
  SupplierDetail,
  SupplierListFilters,
  SupplierListItem,
  SupplierPage,
  UpdateSupplierDto,
} from "../types/supplier";

type SupplierApiItem = {
  _id: string;
  name: string;
  phoneNumber: string;
};

type SupplierApiPage = {
  meta: SupplierPage["meta"];
  data: SupplierApiItem[];
};

type SupplierListApiResponse = SupplierApiPage | [];

type SupplierDetailApiResponse = {
  supplier: SupplierApiItem;
  account: SupplierDetail["account"];
};

function mapSupplier(item: SupplierApiItem): SupplierListItem {
  return {
    _id: item._id,
    name: item.name,
    phoneNumber: item.phoneNumber,
  };
}

export async function listSupplierOptionsFromApi(
  token: string,
): Promise<SupplierListItem[]> {
  const limit = 100;
  const firstPage = await listSuppliers(token, { page: 1, limit });
  const suppliers = [...firstPage.data];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const response = await listSuppliers(token, { page, limit });
    suppliers.push(...response.data);
  }

  return suppliers;
}

export async function listSuppliers(
  token: string,
  filters: SupplierListFilters,
): Promise<SupplierPage> {
  const response = await apiClient.get<SupplierListApiResponse>("/suppliers", {
    token,
    params: { page: filters.page, limit: filters.limit },
  });
  const page: SupplierApiPage = Array.isArray(response)
    ? {
        meta: {
          totalDoc: 0,
          currentPage: filters.page,
          totalPages: 0,
          limit: filters.limit,
        },
        data: [],
      }
    : response;

  const phoneNumber = filters.phoneNumber?.trim().toLocaleLowerCase();
  const data = phoneNumber
    ? page.data.filter((supplier) =>
        supplier.phoneNumber.toLocaleLowerCase().includes(phoneNumber),
      )
    : page.data;

  return {
    meta: page.meta,
    data: data.map(mapSupplier),
  };
}

export async function getSupplierById(
  token: string,
  id: string,
): Promise<SupplierDetail> {
  const response = await apiClient.get<SupplierDetailApiResponse>(
    `/suppliers/${id}`,
    { token },
  );
  return {
    supplier: mapSupplier(response.supplier),
    account: response.account,
  };
}

export async function createSupplier(
  token: string,
  dto: CreateSupplierDto,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/suppliers", dto, { token });
}

export async function updateSupplier(
  token: string,
  id: string,
  dto: UpdateSupplierDto,
): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>(`/suppliers/${id}`, dto, {
    token,
  });
}

export async function deleteSupplier(
  token: string,
  id: string,
): Promise<string> {
  return apiClient.del<string>(`/suppliers/${id}`, { token });
}
