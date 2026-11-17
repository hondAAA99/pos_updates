import { apiClient } from '@/lib/api-client'
import type {
  Expense,
  ExpenseInput,
  ExpenseListParams,
  ExpensePage,
} from '../types/expense'

type ExpenseApiResponse = {
  message: string
}

export class ExpenseServiceError extends Error {
  constructor(readonly code: 'expense-not-found' | 'expense-invalid') {
    super(code)
    this.name = 'ExpenseServiceError'
  }
}


export async function listExpenses(
  token: string,
  { page, limit, timestamp }: ExpenseListParams,
): Promise<ExpensePage> {
  return apiClient.get<ExpensePage>('/expenses', {
    token,
    cache: 'no-store',
    params: {
      page,
      limit,
      timestamp: timestamp?.trim() || undefined,
    },
  })
}

export async function getExpenseById(
  token: string,
  id: string,
): Promise<Expense> {
  return apiClient.get<Expense>(`/expenses/${id}`, {
    token,
    cache: 'no-store',
  })
}

export async function createExpense(
  token: string,
  input: ExpenseInput,
): Promise<ExpenseApiResponse> {
  return apiClient.post<ExpenseApiResponse>('/expenses', input, {
    token,
  })
}

export async function updateExpense(
  token: string,
  id: string,
  input: ExpenseInput,
): Promise<ExpenseApiResponse> {
  return apiClient.patch<ExpenseApiResponse>(`/expenses/${id}`, input, {
    token,
  })
}

export async function deleteExpense(
  token: string,
  id: string,
): Promise<ExpenseApiResponse> {
  return apiClient.del<ExpenseApiResponse>(`/expenses/${id}`, {
    token,
  });
}
