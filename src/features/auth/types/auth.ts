import type { Branch } from "@/features/branches/types/branch";

export type AuthRole = "admin" | "inventory-man" | "cashier" | "salesman";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  branchId?: string;
  branch?: Branch;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
  issuedAt: string;
};

export type StoredMockSession = {
  token?: string;
  userId?: string;
  issuedAt?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
