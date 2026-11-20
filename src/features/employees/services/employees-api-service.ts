import { apiClient } from "@/lib/api-client";
import {
  toSwaggerCreateEmployeeDto,
  toSwaggerUpdateEmployeeDto,
  toBackendEmployeeRole,
  toFrontendEmployeeRole,
} from "./employee-role-adapter";
import type {
  CreateEmployeeInput,
  BackendEmployeeRole,
  EmployeeCredentials,
  EmployeeItem,
  EmployeeListFilters,
  EmployeePage,
  BranchSalesman,
  UpdateEmployeeInput,
} from "../types/employee";

type EmployeeApiItem = {
  _id: string;
  name: string;
  email: string;
  role: BackendEmployeeRole;
  branchId: string;
  active: boolean;
};

type EmployeeListApiResponse = {
  meta: EmployeePage["meta"];
  data: EmployeeApiItem[];
};

type EmployeeCredentialApiResponse = {
  message: string;
  email: string;
  password: string;
};

type EmployeePasswordApiResponse = {
  message: string;
  password: string;
};

function mapEmployee(item: EmployeeApiItem): EmployeeItem {
  return {
    _id: item._id,
    name: item.name,
    email: item.email,
    role: toFrontendEmployeeRole(item.role),
    branchId: item.branchId,
    active: item.active,
  };
}

export async function listBranchSalesmen(
  token: string,
): Promise<BranchSalesman[]> {
  return apiClient.get<BranchSalesman[]>("/branch/salesmen", {
    token,
    cache: "no-store",
  });
}

export async function listEmployeesFromApi(
  token: string,
  filters: EmployeeListFilters,
): Promise<EmployeePage> {
  const response = await apiClient.get<EmployeeListApiResponse>("/employees", {
    token,
    preserveSessionOnUnauthorized: true,
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.active !== undefined ? { active: filters.active } : {}),
      ...(filters.role
        ? { role: toBackendEmployeeRole(filters.role) }
        : {}),
    },
  });

  return {
    meta: response.meta,
    data: response.data.map(mapEmployee),
  };
}

export async function getEmployeeFromApi(
  token: string,
  id: string,
): Promise<EmployeeItem> {
  const response = await apiClient.get<EmployeeApiItem>(`/employees/${id}`, {
    token,
  });
  return mapEmployee(response);
}

export async function createEmployeeOnApi(
  token: string,
  input: CreateEmployeeInput,
): Promise<EmployeeCredentials> {
  const request = toSwaggerCreateEmployeeDto(input);
  const response = await apiClient.post<EmployeeCredentialApiResponse>(
    "/employees",
    request,
    { token },
  );
  return { email: response.email, password: response.password };
}

export async function updateEmployeeOnApi(
  token: string,
  id: string,
  input: UpdateEmployeeInput,
): Promise<{ message: string }> {
  const request = toSwaggerUpdateEmployeeDto(input);
  return apiClient.put<{ message: string }>(
    `/employees/${id}`,
    request,
    { token },
  );
}

export async function deleteEmployeeFromApi(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/employees/${id}`, { token });
}

export async function setEmployeeActiveOnApi(
  token: string,
  id: string,
  active: boolean,
): Promise<{ message: string }> {
  const action = active ? "activate" : "de-activate";
  return apiClient.put<{ message: string }>(
    `/employees/${id}/${action}`,
    undefined,
    { token },
  );
}

export async function regenerateEmployeePasswordOnApi(
  token: string,
  id: string,
): Promise<EmployeePasswordApiResponse> {
  return apiClient.put<EmployeePasswordApiResponse>(
    `/employees/${id}/password`,
    undefined,
    { token },
  );
}
