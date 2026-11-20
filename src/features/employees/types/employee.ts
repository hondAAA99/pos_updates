export type EmployeeRole =
  | "admin"
  | "inventory-man"
  | "cashier"
  | "sales-man";

export type BackendEmployeeRole =
  | "admin"
  | "inventory-man"
  | "cashier"
  | "salesMan";

export type EmployeeItem = {
  _id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  branchId: string;
  active: boolean;
};

export type BranchSalesman = Pick<EmployeeItem, "_id" | "name" | "email">;

export type CreateEmployeeInput = {
  name: string;
  role: EmployeeRole;
  branchId?: string;
};

export type UpdateEmployeeInput = {
  name?: string;
  role?: EmployeeRole;
  branchId?: string;
};

export type CreateEmployeeDto = {
  name: string;
  role: BackendEmployeeRole;
  branchId?: string;
};

export type UpdateEmployeeDto = {
  name?: string;
  role?: BackendEmployeeRole;
  branchId?: string;
};

export type EmployeePage = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: EmployeeItem[];
};

export type EmployeeListFilters = {
  page: number;
  limit: number;
  branchId?: string;
  role?: EmployeeRole;
  active?: boolean;
};

export type EmployeeCredentials = {
  email: string;
  password: string;
};
