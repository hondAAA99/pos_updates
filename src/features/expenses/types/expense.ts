export interface Expense {
  _id: string;
  expenseName: string;
  expenseDetail: string;
  price: number;
  timestamp: string;
}

export type ExpenseInput = Omit<Expense, "_id">;

export type ExpensePage = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: Expense[];
};

export type ExpenseListParams = {
  page: number;
  limit: number;
  timestamp?: string;
};
