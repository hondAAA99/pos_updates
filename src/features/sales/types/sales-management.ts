import type {
  ReceiptApiDocument,
  ReceiptDocumentPage,
} from "../services/sales-api-service";

export type SalesManagementRecord = ReceiptApiDocument;

export type SalesManagementFilters = {
  search: string;
  branchId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
};

export type SalesManagementPage = ReceiptDocumentPage;
