import { getBranchById, listBranches } from "@/features/branches/services/branches-service";
import { getEmployeeById } from "@/features/employees/services/employees-service";
import type { EmployeeRole } from "@/features/employees/types/employee";
import type {
  AuthRole,
  AuthSession,
  AuthUser,
  LoginCredentials,
  StoredMockSession,
} from "../types/auth";

const mockAccounts: ReadonlyArray<{
  employeeId: string;
  password: string;
  role: Exclude<EmployeeRole, "sales-man">;
}> = [
  {
    employeeId: "employee-0001",
    password: "AdminDemo-2026",
    role: "admin",
  },
  {
    employeeId: "employee-0002",
    password: "InventoryDemo-2026",
    role: "inventory-man",
  },
  {
    employeeId: "employee-0003",
    password: "CashierDemo-2026",
    role: "cashier",
  },
];

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
  }
}

function isAuthRole(value: unknown): value is AuthRole {
  return (
    value === "admin" ||
    value === "inventory-man" ||
    value === "cashier" ||
    value === "salesman"
  );
}

function createAuthUser(employeeId: string): AuthUser | null {
  const employee = getEmployeeById(employeeId);
  if (!employee || !employee.active) return null;
  const role =
    employee.role === "sales-man" ? "salesman" : employee.role;
  if (!isAuthRole(role)) return null;

  const branch = employee.branchId
    ? getBranchById(listBranches(), employee.branchId)
    : undefined;

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role,
    ...(employee.branchId ? { branchId: employee.branchId } : {}),
    ...(branch ? { branch } : {}),
  };
}

export function loginWithMockCredentials(
  credentials: LoginCredentials,
): AuthSession {
  const email = credentials.email.trim().toLocaleLowerCase();
  const account = mockAccounts.find((candidate) => {
    const employee = getEmployeeById(candidate.employeeId);
    return (
      employee?.email.toLocaleLowerCase() === email &&
      candidate.password === credentials.password &&
      employee.role === candidate.role
    );
  });

  const user = account ? createAuthUser(account.employeeId) : null;
  if (!user) throw new InvalidCredentialsError();

  return {
    user,
    token: "mock-session-token",
    issuedAt: new Date().toISOString(),
  };
}

export function restoreMockSession(
  stored: StoredMockSession,
): AuthSession | null {
  if (
    typeof stored.userId !== "string" ||
    typeof stored.issuedAt !== "string" ||
    Number.isNaN(new Date(stored.issuedAt).getTime())
  ) {
    return null;
  }

  const user = createAuthUser(stored.userId);
  return user ? { user, token: stored.token ?? "mock-session-token", issuedAt: stored.issuedAt } : null;
}

export function getRoleHomePath(role: AuthRole): string {
  switch (role) {
    case "cashier":
      return "/cashier/dashboard";
    case "inventory-man":
      return "/inventory";
    case "salesman":
      return "/products";
    default:
      return "/dashboard";
  }
}

export function isAuthRoleValue(value: string | undefined): value is AuthRole {
  return (
    value === "admin" ||
    value === "inventory-man" ||
    value === "cashier" ||
    value === "salesman"
  );
}
