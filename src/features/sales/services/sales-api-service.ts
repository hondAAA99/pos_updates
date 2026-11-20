import {
  ApiClientError,
  ApiConfigurationError,
  apiClient,
} from "@/lib/api-client";

export type SaleLineItemRequest = {
  productId: string;
  productQuantity: string;
};

export type ProcessSaleRequest = {
  employeeId: string;
  client_phone_number: string;
  lineItems: SaleLineItemRequest[];
};

export type ProcessSaleItem = {
  productName: string;
  productSerialNumber: string;
  productPrice: number;
  productQuantity: number;
  total: number;
};

export type ProcessSaleResponse = {
  receiptId: string;
  items: ProcessSaleItem[];
  receiptPrice: number;
  allowed_sale_perc: number;
  clientData: {
    name?: string;
    phoneNumber: string;
  };
};

export type SalePaymentChoice = "cash" | "wallet";
type BackendPaymentMethod = "CASH" | "E-PAYMENT";

export type ConfirmSaleRequest = {
  receiptId: string;
  paymentMethod: BackendPaymentMethod;
  desiredSalePercentage: string;
  clientData: {
    name: string;
    phoneNumber: string;
  };
  comments?: string;
};

export type ConfirmSaleResponse = {
  message: string;
};

export type ReceiptApiDocument = {
  id?: string;
  _id?: string;
  employeeId?: string;
  clientId?: string;
  branchId?: string;
  receiptPrice?: number;
  sale_perc?: number;
  allowed_sale_perc?: number;
  price_after_sale?: number;
  payment_method?: string;
  confirm?: boolean;
  status?: string;
  comments?: string;
  timestamp?: string;
};

export type ReceiptPage = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: ReceiptApiDocument[];
};

export type ReceiptLineItemApi = Partial<ProcessSaleItem> & {
  productId?: string;
};

export type ReceiptDetailsApiResponse = {
  receipt: ReceiptApiDocument;
  lineItem?: ReceiptLineItemApi[];
  lineItems?: ReceiptLineItemApi[];
};

export type ReceiptListParams =
  | {
      role: "cashier";
      page?: number;
      limit?: number;
    }
  | {
      role: "admin";
      branchId: string;
      page?: number;
      limit?: number;
    };

type ReceiptPageApiResponse =
  | ReceiptPage
  | {
      meta: {
        totalDoc: number;
        currentPage: number;
        totalPages: number;
        limit: number;
      };
      data: ReceiptApiDocument[];
    };

export type ReceiptUpdateRequest = Partial<
  Record<
    | "employeeId"
    | "clientId"
    | "receiptPrice"
    | "sale_perc"
    | "allowed_sale_perc"
    | "price_after_sale"
    | "payment_method"
    | "confirm"
    | "comments"
    | "timestamp",
    unknown
  >
>;

export async function processSale(
  token: string,
  request: ProcessSaleRequest,
): Promise<ProcessSaleResponse> {
  return apiClient.post<ProcessSaleResponse>("/sales/process", request, {
    token,
  });
}

export async function confirmSale(
  token: string,
  request: Omit<ConfirmSaleRequest, "paymentMethod"> & {
    paymentMethod: SalePaymentChoice;
  },
): Promise<ConfirmSaleResponse> {
  const paymentMethod: BackendPaymentMethod =
    request.paymentMethod === "cash" ? "CASH" : "E-PAYMENT";

  return apiClient.post<ConfirmSaleResponse>(
    "/sales/confirm",
    { ...request, paymentMethod },
    { token },
  );
}

export function isConfirmSaleOutcomeUnknown(error: unknown): boolean {
  if (error instanceof ApiConfigurationError) return false;
  if (error instanceof ApiClientError) {
    return error.status === 0 || error.status >= 500;
  }
  return true;
}

export async function listReceipts(
  token: string,
  params: ReceiptListParams,
): Promise<ReceiptPage> {
  if (params.role === "admin" && !params.branchId.trim()) {
    throw new Error("Admin receipt requests require a selected branch.");
  }

  const response = await apiClient.get<ReceiptPageApiResponse>("/sales/receipts", {
    token,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.role === "admin"
        ? { branchId: params.branchId.trim() }
        : {}),
    },
  });

  if ("meta" in response) {
    return validateReceiptPage({
      data: response.data,
      total: response.meta.totalDoc,
      page: response.meta.currentPage,
      limit: response.meta.limit,
      totalPages: response.meta.totalPages,
    });
  }

  return validateReceiptPage(response);
}

function validateReceiptPage(page: ReceiptPage): ReceiptPage {
  if (
    !Array.isArray(page.data) ||
    !Number.isInteger(page.total) ||
    page.total < 0 ||
    !Number.isInteger(page.page) ||
    page.page < 1 ||
    !Number.isInteger(page.limit) ||
    page.limit < 1 ||
    !Number.isInteger(page.totalPages) ||
    page.totalPages < 0
  ) {
    throw new Error("Receipt API returned invalid pagination information.");
  }
  return page;
}

export async function getReceiptDetails(
  token: string,
  id: string,
): Promise<ReceiptDetailsApiResponse> {
  return apiClient.get<ReceiptDetailsApiResponse>(
    `/sales/receipt/${encodeURIComponent(id)}`,
    { token },
  );
}

export async function updateReceipt(
  token: string,
  id: string,
  request: ReceiptUpdateRequest,
): Promise<ReceiptApiDocument> {
  return apiClient.patch<ReceiptApiDocument>(
    `/sales/receipts/${encodeURIComponent(id)}`,
    request,
    { token },
  );
}

export async function deleteReceipt(
  token: string,
  id: string,
): Promise<{ message: string }> {
  return apiClient.del<{ message: string }>(
    `/sales/receipts/${encodeURIComponent(id)}`,
    { token },
  );
}
