import type { Branch } from "../types/branch";

export const initialBranches = [
  { _id: "downtown", name: "Downtown" },
  { _id: "nasrCity", name: "Nasr City" },
  { _id: "alexandria", name: "Alexandria" },
  { _id: "giza", name: "Giza" },
] as const satisfies readonly Branch[];

export type InitialBranchId = (typeof initialBranches)[number]["_id"];
