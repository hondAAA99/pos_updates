import { ApiClientError, apiClient } from "@/lib/api-client";
import type { Branch, BranchDetails, BranchSupply } from "../types/branch";

type BranchApiItem = {
  _id: string;
  name: string;
};

type BranchPageApiResponse = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: BranchApiItem[];
};

type BranchDetailApiResponse = {
  branch: BranchApiItem;
  supply?: BranchSupply | null;
};

const branchPageSize = 100;

function isEmptyBranchListError(error: unknown): boolean {
  if (
    !(error instanceof ApiClientError) ||
    error.status !== 404 ||
    typeof error.details !== "object" ||
    error.details === null ||
    !("message" in error.details)
  ) {
    return false;
  }

  return error.details.message === "branch not found";
}

export async function listBranchesFromApi(token: string): Promise<Branch[]> {
  let firstPage: BranchPageApiResponse;
  try {
    firstPage = await apiClient.get<BranchPageApiResponse>("/branch", {
      token,
      params: { page: 1, limit: branchPageSize },
    });
  } catch (error) {
    if (isEmptyBranchListError(error)) return [];
    throw error;
  }

  const branches = [...firstPage.data];
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const response = await apiClient.get<BranchPageApiResponse>("/branch", {
      token,
      params: { page, limit: branchPageSize },
    });
    branches.push(...response.data);
  }

  return branches.map((branch) => ({ _id: branch._id, name: branch.name }));
}

export async function getBranchDetailsFromApi(
  token: string,
  id: string,
): Promise<BranchDetails> {
  const response = await apiClient.get<BranchDetailApiResponse>(`/branch/${id}`, {
    token,
  });
  return {
    branch: {
      _id: response.branch._id,
      name: response.branch.name,
    },
    supply: response.supply ?? null,
  };
}

export async function createBranchOnApi(
  token: string,
  name: string,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/branch", { name }, { token });
}

export async function updateBranchOnApi(
  token: string,
  id: string,
  name: string,
): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(
    `/branch/${id}`,
    { name },
    { token },
  );
}

export async function deleteBranchFromApi(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(`/branch/${id}`, { token });
}
