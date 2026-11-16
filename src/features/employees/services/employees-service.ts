import { initialEmployees } from "../data/mock-employees";
import type {
  CreateEmployeeInput,
  EmployeeCredentials,
  EmployeeItem,
  EmployeeListFilters,
  EmployeePage,
  UpdateEmployeeInput,
} from "../types/employee";

export const mockCurrentCashierId = "employee-0003";

let employees: EmployeeItem[] = initialEmployees.map((employee) => ({
  ...employee,
}));
let passwordSequence = 0;

function cloneEmployee(employee: EmployeeItem): EmployeeItem {
  return { ...employee };
}

function requireEmployee(id: string): EmployeeItem {
  const employee = employees.find((item) => item._id === id);
  if (!employee) {
    throw new Error(`Employee "${id}" does not exist.`);
  }
  return employee;
}

function nextEmployeeId(): string {
  const nextNumber =
    employees.reduce((maximum, employee) => {
      const suffix = Number.parseInt(employee._id.slice(-4), 10);
      return Number.isNaN(suffix) ? maximum : Math.max(maximum, suffix);
    }, 0) + 1;
  return `employee-${nextNumber.toString().padStart(4, "0")}`;
}

function nextMockPassword(): string {
  passwordSequence += 1;
  return `DemoPass-${passwordSequence.toString().padStart(4, "0")}`;
}

function emailLocalPart(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return normalized || "employee";
}

export function listEmployees(filters: EmployeeListFilters): EmployeePage {
  const filtered = employees.filter((employee) => {
    if (filters.branchId && employee.branchId !== filters.branchId) {
      return false;
    }
    if (filters.role && employee.role !== filters.role) {
      return false;
    }
    if (filters.active !== undefined && employee.active !== filters.active) {
      return false;
    }
    return true;
  });
  const totalDoc = filtered.length;
  const totalPages = Math.ceil(totalDoc / filters.limit);
  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, filters.page), totalPages);
  const start = (currentPage - 1) * filters.limit;

  return {
    meta: {
      totalDoc,
      currentPage,
      totalPages,
      limit: filters.limit,
    },
    data: filtered.slice(start, start + filters.limit).map(cloneEmployee),
  };
}

export function getEmployeeById(id: string): EmployeeItem | undefined {
  const employee = employees.find((item) => item._id === id);
  return employee ? cloneEmployee(employee) : undefined;
}

export function createEmployee(
  input: CreateEmployeeInput,
): { message: string; employee: EmployeeItem; credentials: EmployeeCredentials } {
  const name = input.name.trim();
  const role = input.role;
  const branchId = input.branchId?.trim() ?? "";

  if (!name) {
    throw new Error("Employee name is required.");
  }
  if (role !== "admin" && !branchId) {
    throw new Error("A branch is required for this employee role.");
  }

  const id = nextEmployeeId();
  const email = `${emailLocalPart(name)}.${id.slice(-4)}@pos.example`;
  const employee: EmployeeItem = {
    _id: id,
    name,
    email,
    role,
    branchId,
    active: true,
  };
  const credentials = { email, password: nextMockPassword() };
  employees = [employee, ...employees];

  return {
    message: "employee created successfully",
    employee: cloneEmployee(employee),
    credentials,
  };
}

export function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): { message: string } {
  const existing = requireEmployee(id);
  const name = input.name?.trim();
  const role = input.role ?? existing.role;
  const branchId =
    input.branchId === undefined ? existing.branchId : input.branchId.trim();

  if (name === "") {
    throw new Error("Employee name cannot be empty.");
  }
  if (role !== "admin" && !branchId) {
    throw new Error("A branch is required for this employee role.");
  }

  employees = employees.map((employee) =>
    employee._id === id
      ? {
          ...employee,
          ...(name !== undefined && { name }),
          role,
          branchId,
        }
      : employee,
  );
  return { message: "employee updated successfully" };
}

export function deleteEmployee(id: string): { message: string } {
  requireEmployee(id);
  employees = employees.filter((employee) => employee._id !== id);
  return { message: "employee deleted successfully" };
}

export function setEmployeeActive(
  id: string,
  active: boolean,
): { message: string } {
  requireEmployee(id);
  employees = employees.map((employee) =>
    employee._id === id ? { ...employee, active } : employee,
  );
  return {
    message: active
      ? "employee activated successfully"
      : "employee deactivated successfully",
  };
}

export function regenerateEmployeePassword(
  id: string,
): { message: string; password: string } {
  requireEmployee(id);
  return {
    message: "password regenerated successfully",
    password: nextMockPassword(),
  };
}
