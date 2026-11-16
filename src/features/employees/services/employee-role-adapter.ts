import type {
  CreateEmployeeDto,
  CreateEmployeeInput,
  BackendEmployeeRole,
  EmployeeRole,
  UpdateEmployeeDto,
  UpdateEmployeeInput,
} from "../types/employee";

export function toBackendEmployeeRole(
  role: EmployeeRole,
): BackendEmployeeRole {
  return role === "sales-man" ? "salesMan" : role;
}

export function toFrontendEmployeeRole(
  role: BackendEmployeeRole,
): EmployeeRole {
  return role === "salesMan" ? "sales-man" : role;
}

function requiresBranch(role: EmployeeRole): boolean {
  return role === "cashier" || role === "sales-man";
}

export function toSwaggerCreateEmployeeDto(
  input: CreateEmployeeInput,
): CreateEmployeeDto {
  const role = toBackendEmployeeRole(input.role);
  const branchId = input.branchId?.trim();
  if (requiresBranch(input.role) && !branchId) {
    throw new Error("A branch is required for this employee role.");
  }

  return {
    name: input.name,
    role,
    ...(requiresBranch(input.role) && branchId ? { branchId } : {}),
  };
}

export function toSwaggerUpdateEmployeeDto(
  input: UpdateEmployeeInput,
): UpdateEmployeeDto {
  const { name, branchId, role } = input;
  const normalizedBranchId = branchId?.trim();
  const backendRole = role === undefined ? undefined : toBackendEmployeeRole(role);
  if (
    role !== undefined &&
    requiresBranch(role) &&
    !normalizedBranchId
  ) {
    throw new Error("A branch is required for this employee role.");
  }
  if (role === undefined && branchId !== undefined && !normalizedBranchId) {
    throw new Error("A branch is required for this employee role.");
  }

  if (role === undefined) {
    return {
      ...(name !== undefined && { name }),
      ...(normalizedBranchId !== undefined && { branchId: normalizedBranchId }),
    };
  }

  return {
    ...(name !== undefined && { name }),
    role: backendRole,
    ...(requiresBranch(role) && normalizedBranchId
      ? { branchId: normalizedBranchId }
      : {}),
  };
}
