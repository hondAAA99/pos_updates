export type StockHistoryProduct = {
  _id: string;
  productName?: string;
  serialNumber?: string;
};

export type StockHistorySupplier = {
  _id: string;
  name: string;
  phoneNumber?: string;
};

export type StockHistoryItem = {
  _id: string;
  productId: StockHistoryProduct | null;
  supplierId: StockHistorySupplier | null;
  timestamp: string;
  quantity: number;
  batch_selling_price: number;
  batch_purchase_price: number;
  batch_wholesale_price: number;
  profit_margin: number;
};

export type StockHistoryPage = {
  items: StockHistoryItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
