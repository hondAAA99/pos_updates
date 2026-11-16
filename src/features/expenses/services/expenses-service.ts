import { formatDateKey } from "@/lib/format";
import { initialExpenses } from "../data/mock-expenses";
import type {
  Expense,
  ExpenseInput,
  ExpenseListParams,
  ExpensePage,
} from "../types/expense";

export class ExpenseServiceError extends Error {
  constructor(readonly code: "expense-not-found" | "expense-invalid") {
    super(code);
    this.name = "ExpenseServiceError";
  }
}

let expenses = initialExpenses.map(cloneExpense);
let nextExpenseId = 1;

function cloneExpense(expense: Expense): Expense {
  return { ...expense };
}

function validateInput(input: ExpenseInput): ExpenseInput {
  const expenseName = input.expenseName.trim();
  const expenseDetail = input.expenseDetail.trim();
  const timestamp = new Date(input.timestamp);

  if (
    !expenseName ||
    !expenseDetail ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isFinite(timestamp.getTime())
  ) {
    throw new ExpenseServiceError("expense-invalid");
  }

  return {
    expenseName,
    expenseDetail,
    price: input.price,
    timestamp: timestamp.toISOString(),
  };
}

export function serializeExpenseTimestampFilter(value: string): string | undefined {
  const timestamp = value.trim();
  if (!timestamp) return undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
    throw new ExpenseServiceError("expense-invalid");
  }
  const [year, month, day] = timestamp.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ExpenseServiceError("expense-invalid");
  }

  return timestamp;
}

export async function listExpenses({
  page,
  limit,
  timestamp,
}: ExpenseListParams): Promise<ExpensePage> {
  const normalizedTimestamp = serializeExpenseTimestampFilter(timestamp ?? "");
  const filtered = expenses
    .filter((expense) =>
      !normalizedTimestamp ||
      formatDateKey(new Date(expense.timestamp)) === normalizedTimestamp,
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  const totalDoc = filtered.length;
  const totalPages = Math.ceil(totalDoc / limit);
  const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const start = (currentPage - 1) * limit;

  return {
    meta: { totalDoc, currentPage, totalPages, limit },
    data: filtered.slice(start, start + limit).map(cloneExpense),
  };
}

export async function getExpenseById(id: string): Promise<Expense> {
  const expense = expenses.find((item) => item._id === id);
  if (!expense) throw new ExpenseServiceError("expense-not-found");
  return cloneExpense(expense);
}

export async function createExpense(input: ExpenseInput): Promise<{ message: string }> {
  const expense = {
    ...validateInput(input),
    _id: `expense-mock-${nextExpenseId++}`,
  };
  expenses = [expense, ...expenses];
  return { message: "expense added successfully" };
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<{ message: string }> {
  if (!expenses.some((expense) => expense._id === id)) {
    throw new ExpenseServiceError("expense-not-found");
  }
  const updated = { ...validateInput(input), _id: id };
  expenses = expenses.map((expense) => (expense._id === id ? updated : expense));
  return { message: "expense updated successfully" };
}

export async function deleteExpense(id: string): Promise<{ message: string }> {
  if (!expenses.some((expense) => expense._id === id)) {
    throw new ExpenseServiceError("expense-not-found");
  }
  expenses = expenses.filter((expense) => expense._id !== id);
  return { message: "expense deleted successfully" };
}
