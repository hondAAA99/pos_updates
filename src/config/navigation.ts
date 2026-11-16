import {
  ArrowLeftRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CalendarDays,
  ContactRound,
  CreditCard,
  History,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type NavigationItemConfig = {
  id: string;
  href: string;
  permission: string;
  icon: LucideIcon;
};

type NavigationGroupConfig = {
  id: string;
  items: readonly NavigationItemConfig[];
};

export const navigationGroups = [
  {
    id: "overview",
    items: [
      {
        id: "dashboard",
        href: "/dashboard",
        permission: "dashboard:read",
        icon: LayoutDashboard,
      },
      {
        id: "cashierDashboard",
        href: "/cashier/dashboard",
        permission: "cashier-dashboard:read",
        icon: ShoppingCart,
      },
    ],
  },
  {
    id: "productsInventory",
    items: [
      {
        id: "productTypes",
        href: "/product-types",
        permission: "product-types:read",
        icon: Boxes,
      },
      {
        id: "products",
        href: "/products",
        permission: "products:read",
        icon: Package,
      },
      {
        id: "inventory",
        href: "/inventory",
        permission: "inventory:read",
        icon: Warehouse,
      },
      {
        id: "branchInventory",
        href: "/branch-inventory",
        permission: "branch-inventory:read",
        icon: Store,
      },
      {
        id: "stockHistory",
        href: "/stock-history",
        permission: "stock-history:read",
        icon: History,
      },
      {
        id: "stockTransfers",
        href: "/stock-transfers",
        permission: "stock-transfers:read",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    id: "purchasing",
    items: [
      {
        id: "suppliers",
        href: "/suppliers",
        permission: "suppliers:read",
        icon: Truck,
      },
      {
        id: "supplierDeposits",
        href: "/supplier-deposits",
        permission: "supplier-deposits:read",
        icon: CalendarDays,
      },
      {
        id: "supplierTransactions",
        href: "/supplier-transactions",
        permission: "supplier-transactions:read",
        icon: ReceiptText,
      },
    ],
  },
  {
    id: "organization",
    items: [
      {
        id: "branches",
        href: "/branches",
        permission: "branches:read",
        icon: Building2,
      },
      {
        id: "employees",
        href: "/employees",
        permission: "employees:read",
        icon: Users,
      },
    ],
  },
  {
    id: "sales",
    items: [
      {
        id: "salesDashboard",
        href: "/sales/dashboard",
        permission: "sales-dashboard:read",
        icon: ChartNoAxesCombined,
      },
      {
        id: "salesManagement",
        href: "/sales",
        permission: "sales:read",
        icon: ShoppingCart,
      },
    ],
  },
  {
    id: "customers",
    items: [
      {
        id: "clients",
        href: "/clients",
        permission: "clients:read",
        icon: ContactRound,
      },
    ],
  },
  {
    id: "finance",
    items: [
      {
        id: "wallets",
        href: "/wallets",
        permission: "wallets:read",
        icon: Wallet,
      },
      {
        id: "expenses",
        href: "/expenses",
        permission: "expenses:read",
        icon: CreditCard,
      },
    ],
  },
  {
    id: "maintenance",
    items: [
      {
        id: "maintenanceManagement",
        href: "/maintenance",
        permission: "maintenance:read",
        icon: Wrench,
      },
    ],
  },
] as const satisfies readonly NavigationGroupConfig[];

export type NavigationItem =
  (typeof navigationGroups)[number]["items"][number];
export type NavigationGroup = (typeof navigationGroups)[number];
export type NavigationItemId = NavigationItem["id"];
export type NavigationGroupId = NavigationGroup["id"];

export const navigationItems = navigationGroups.reduce<NavigationItem[]>(
  (items, group) => {
    items.push(...group.items);
    return items;
  },
  [],
);

export function getNavigationItem(href: string) {
  return navigationItems.find((item) => item.href === href);
}
