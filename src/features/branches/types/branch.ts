export type Branch = {
  _id: string;
  name: string;
};

export type BranchSupply = {
  id?: string;
  salesSum: number;
  salesTotal: number;
  maintenanceSum: number;
  maintenanceTotal: number;
  branchId: string;
  timestamp: string;
};

export type BranchDetails = {
  branch: Branch;
  supply: BranchSupply | null;
};
