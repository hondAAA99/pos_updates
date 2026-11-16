import { apiClient } from "@/lib/api-client";

export type SaleLineItemRequest = {
  productSerialNumber: string;
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
    phone_number: string;
  };
  comments: string;
};

export type ConfirmSaleResponse = {
  message: string;
};

export type ReceiptApiDocument = Record<string, unknown>;

export type ReceiptPage = {
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

export async function listReceipts(
  token: string,
  params: { page?: number; limit?: number } = {},
): Promise<ReceiptPage> {
  return apiClient.get<ReceiptPage>("/sales/receipts", {
    token,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  });
}

export async function getReceipt(
  token: string,
  id: string,
): Promise<ReceiptApiDocument> {
  return apiClient.get<ReceiptApiDocument>(
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
