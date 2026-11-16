import type { AuthRole } from "../types/auth";

const allRoles: readonly AuthRole[] = [
  "admin",
  "inventory-man",
  "cashier",
  "salesman",
];

const routePermissions: Record<string, readonly AuthRole[]> = {
  "/dashboard": ["admin"],
  "/cashier/dashboard": ["cashier"],
  "/product-types": ["admin", "inventory-man"],
  "/products": ["admin", "inventory-man"],
  "/inventory": ["admin", "inventory-man"],
  "/stock-history": ["admin", "inventory-man"],
  "/stock-transfers": ["admin", "inventory-man"],
  "/suppliers": ["admin", "inventory-man"],
  "/supplier-deposits": ["admin", "inventory-man"],
  "/supplier-transactions": ["admin", "inventory-man"],
  "/branches": ["admin"],
  "/branch-inventory": ["admin", "cashier"],
  "/employees": ["admin"],
  "/sales": ["admin"],
  "/sales/dashboard": ["admin"],
  "/clients": ["admin"],
  "/wallets": ["admin"],
  "/expenses": ["admin"],
  "/maintenance": ["admin"],
  "/access-denied": allRoles,
};

function normalizePathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] && ["en", "ar"].includes(segments[0])) {
    segments.shift();
  }

  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
}

export function canAccessRoute(role: AuthRole, pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/") {
    return true;
  }

  const allowedRoles = routePermissions[normalizedPath];
  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(role);
}
