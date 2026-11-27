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

export type ReceiptRelationship =
  | string
  | {
      _id: string;
      name?: string;
      role?: string;
      phone_number?: string;
    }
  | null;

export type ReceiptApiDocument = {
  id?: string;
  _id: string;
  receiptNumber: string;
  employeeId?: ReceiptRelationship;
  cashierId?: ReceiptRelationship;
  clientId?: ReceiptRelationship;
  branchId?: ReceiptRelationship;
  receiptPrice?: number;
  sale_perc?: number;
  allowed_sale_perc?: number;
  discountAmount?: number;
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

export type ReceiptDocumentPage = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: ReceiptApiDocument[];
};

export type ReceiptLineItemApi = {
  _id: string;
  productId: ReceiptRelationship;
  productName?: string;
  serialNumber?: string;
  quantity: number;
  unitPriceAtSale: number;
  lineTotal: number;
};

export type ReceiptDetailsApiResponse = {
  receipt: ReceiptApiDocument;
  lineItems: ReceiptLineItemApi[];
};

export type ReceiptDocumentListParams = {
  branchId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export type ReceiptListParams =
  | {
      role: "cashier";
      page?: number;
      limit?: number;
    }
  | {
      role: "admin";
      branchId?: string;
      page?: number;
      limit?: number;
    };

export type ReceiptUpdateRequest = {
  branchId: string;
  employeeId?: string;
  clientId?: string;
  receiptPrice?: number;
  sale_perc?: number;
  allowed_sale_perc?: number;
  price_after_sale?: number;
  payment_method?: BackendPaymentMethod;
  confirm?: boolean;
  comments?: string;
  timestamp?: string;
};

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
  const response = await listReceiptDocuments(token, {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    ...(params.role === "admin" && params.branchId?.trim()
      ? { branchId: params.branchId.trim() }
      : {}),
  });

  return {
    total: response.meta.totalDoc,
    page: response.meta.currentPage,
    limit: response.meta.limit,
    totalPages: response.meta.totalPages,
    data: response.data,
  };
}

export async function listReceiptDocuments(
  token: string,
  params: ReceiptDocumentListParams,
): Promise<ReceiptDocumentPage> {
  const response = await apiClient.get<ReceiptDocumentPage>("/sales/receipts", {
    token,
    cache: "no-store",
    params: {
      page: String(params.page),
      limit: String(params.limit),
      ...(params.branchId?.trim()
        ? { branchId: params.branchId.trim() }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
      ...(params.dateTo ? { dateTo: params.dateTo } : {}),
    },
  });

  return validateReceiptDocumentPage(response);
}

export async function searchReceipt(
  token: string,
  receiptNumber: string,
): Promise<ReceiptApiDocument> {
  const normalizedReceiptNumber = receiptNumber.trim();
  if (!normalizedReceiptNumber) {
    throw new Error("Receipt number is required.");
  }

  return apiClient.get<ReceiptApiDocument>("/sales/receipts/search", {
    token,
    cache: "no-store",
    params: { receiptNumber: normalizedReceiptNumber },
  });
}

function validateReceiptDocumentPage(
  page: ReceiptDocumentPage,
): ReceiptDocumentPage {
  if (
    !page.meta ||
    !Array.isArray(page.data) ||
    !Number.isInteger(page.meta.totalDoc) ||
    page.meta.totalDoc < 0 ||
    !Number.isInteger(page.meta.currentPage) ||
    page.meta.currentPage < 1 ||
    !Number.isInteger(page.meta.limit) ||
    page.meta.limit < 1 ||
    !Number.isInteger(page.meta.totalPages) ||
    page.meta.totalPages < 0
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
    `/sales/receipts/${encodeURIComponent(id)}`,
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
