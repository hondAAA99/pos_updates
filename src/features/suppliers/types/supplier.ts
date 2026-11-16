export type SupplierListItem = {
  _id: string;
  name: string;
  phoneNumber: string;
};

export type SupplierDetail = {
  supplier: SupplierListItem;
  account: {
    _id: string;
    defferedAmount: number;
  };
};

export type CreateSupplierDto = {
  name: string;
  phoneNumber: string;
};

export type UpdateSupplierDto = {
  name?: string;
  phoneNumber?: string;
};

export type SupplierPage = {
  meta: {
    totalDoc: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  data: SupplierListItem[];
};

export type SupplierListFilters = {
  page: number;
  limit: number;
  phoneNumber?: string;
};
