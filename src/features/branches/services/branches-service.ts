import { initialBranches } from "../data/mock-branches";
import type { Branch } from "../types/branch";

export function listBranches(): Branch[] {
  return initialBranches.map((branch) => ({ ...branch }));
}

export function getBranchById(
  branches: Branch[],
  id: string,
): Branch | undefined {
  const branch = branches.find((item) => item._id === id);
  return branch ? { ...branch } : undefined;
}

export function createBranch(branches: Branch[], name: string): Branch[] {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Branch name is required.");
  }

  const nextNumber =
    branches.reduce((maximum, branch) => {
      const suffix = Number.parseInt(branch._id.slice(-2), 16);
      return Number.isNaN(suffix) ? maximum : Math.max(maximum, suffix);
    }, 0x97) + 1;
  const branch: Branch = {
    _id: `64b1f2a3c9e77b1a2b3c4d${nextNumber.toString(16).padStart(2, "0")}`,
    name: normalizedName,
  };

  return [branch, ...branches];
}

export function updateBranch(
  branches: Branch[],
  id: string,
  name: string,
): Branch[] {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Branch name is required.");
  }
  if (!branches.some((branch) => branch._id === id)) {
    throw new Error(`Branch "${id}" does not exist.`);
  }

  return branches.map((branch) =>
    branch._id === id ? { ...branch, name: normalizedName } : branch,
  );
}

export function deleteBranch(branches: Branch[], id: string): Branch[] {
  if (!branches.some((branch) => branch._id === id)) {
    throw new Error(`Branch "${id}" does not exist.`);
  }

  return branches.filter((branch) => branch._id !== id);
}
