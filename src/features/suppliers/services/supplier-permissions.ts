export type SupplierRole = "admin" | "inventory-man";

export type SupplierPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const permissionsByRole: Record<SupplierRole, SupplierPermissions> = {
  admin: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  },
  "inventory-man": {
    canRead: true,
    canCreate: true,
    canUpdate: false,
    canDelete: false,
  },
};

export function getSupplierPermissions(role: SupplierRole): SupplierPermissions {
  return permissionsByRole[role];
}
