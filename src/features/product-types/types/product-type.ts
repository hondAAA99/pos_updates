export type ProductType = {
  _id: string;
  name: string;
  createdAt?: string;
};

export type ProductTypeSortKey = "name" | "createdAt";
export type SortDirection = "ascending" | "descending";

export type ProductTypeApiItem = {
  _id: string;
  name: string;
};
