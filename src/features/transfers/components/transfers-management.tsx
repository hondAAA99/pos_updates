"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { listBranchesFromApi } from "@/features/branches/services/branches-api-service";
import type { Branch } from "@/features/branches/types/branch";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { listInventory } from "@/features/inventory/services/inventory-api-service";
import { listProductItems } from "@/features/products/services/products-service";
import type { StockRecord } from "@/features/inventory/types/stock";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import type {
  TransferFormValues,
  TransferItem,
  TransferProductReference,
} from "../types/transfer";
import {
  createTransfer,
  deleteTransfer,
  getTransfer,
  listTransfers,
  resolveTransferProduct,
  updateTransfer,
} from "../services/transfers-service";
import { DeleteTransferSheet } from "./delete-transfer-sheet";
import { TransferDetailsSheet } from "./transfer-details-sheet";
import { TransferFormSheet } from "./transfer-form-sheet";
import { TransfersTable } from "./transfers-table";

const pageSizes = [5, 10, 20] as const;
const productLookupPageSize = 100;

async function loadInventoryRecords(token: string): Promise<StockRecord[]> {
  const firstPage = await listInventory(token, {
    page: 1,
    limit: productLookupPageSize,
  });
  const records = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await listInventory(token, {
      page,
      limit: productLookupPageSize,
    });
    records.push(...result.items);
  }

  return records;
}

async function loadProductOptions(
  token: string,
): Promise<TransferProductReference[]> {
  const firstPage = await listProductItems(token, {
    page: 1,
    limit: productLookupPageSize,
  });
  const products: TransferProductReference[] = firstPage.items.map(
    ({ _id, productName }) => ({ _id, productName }),
  );

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await listProductItems(token, {
      page,
      limit: productLookupPageSize,
    });
    products.push(
      ...result.items.map(({ _id, productName }) => ({ _id, productName })),
    );
  }

  return products;
}

export function TransfersManagement() {
  const t = useTranslations("transfers");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "inventory-man";
  const canManage = user?.role === "admin";
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<TransferProductReference[]>([]);
  const [inventoryQuantities, setInventoryQuantities] = useState<
    Record<string, number>
  >({});
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [inventoryLoadError, setInventoryLoadError] = useState(false);
  const [transfers, setTransfers] = useState({
    items: [] as TransferItem[],
    page: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 1,
  });
  const [branchId, setBranchId] = useState("all");
  const [productId, setProductId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizes)[number]>(5);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferItem | null>(
    null,
  );
  const [viewingTransfer, setViewingTransfer] = useState<TransferItem | null>(
    null,
  );
  const [deletingTransfer, setDeletingTransfer] =
    useState<TransferItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLookupsLoading, setIsLookupsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const listRequestId = useRef(0);

  const handleApiError = useCallback(
    (caught: unknown, fallback: string) => {
      const isUnauthorized =
        caught instanceof ApiClientError && caught.status === 401;
      setError(isUnauthorized ? t("feedback.unauthorized") : fallback);
      if (isUnauthorized) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadLookups = useCallback(async () => {
    if (!token) {
      setBranches([]);
      setProducts([]);
      setInventoryQuantities({});
      setLookupError(t("feedback.unauthorized"));
      setIsInventoryLoading(false);
      setIsLookupsLoading(false);
      return;
    }

    try {
      setIsLookupsLoading(true);
      setIsInventoryLoading(true);
      setLookupError("");
      setInventoryLoadError(false);
      const [nextBranches, nextProducts, inventoryRecords] = await Promise.all([
        listBranchesFromApi(token),
        loadProductOptions(token),
        loadInventoryRecords(token),
      ]);
      setBranches(nextBranches);
      setProducts(nextProducts);
      setInventoryQuantities(
        Object.fromEntries(
          inventoryRecords.flatMap((record) =>
            record.product_id
              ? [[record.product_id._id, record.total_quantity] as const]
              : [],
          ),
        ),
      );
    } catch (caught) {
      setInventoryQuantities({});
      setInventoryLoadError(true);
      setLookupError(
        caught instanceof ApiClientError && caught.status === 401
          ? t("feedback.unauthorized")
          : t("feedback.optionsError"),
      );
      handleApiError(caught, t("feedback.optionsError"));
    } finally {
      setIsInventoryLoading(false);
      setIsLookupsLoading(false);
    }
  }, [handleApiError, t, token]);

  const loadTransferPage = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      nextBranchId = branchId,
      nextProductId = productId,
    ) => {
      if (!token) {
        setIsLoading(false);
        setError(t("feedback.unauthorized"));
        return;
      }

      const requestId = ++listRequestId.current;
      try {
        setIsLoading(true);
        setError("");
        const result = await listTransfers(token, {
          page: nextPage,
          limit: nextPageSize,
          branchId: nextBranchId,
          productId: nextProductId,
        });
        if (requestId !== listRequestId.current) return;
        setTransfers({
          ...result,
          items: result.items.map((transfer) =>
            resolveTransferProduct(transfer, products),
          ),
        });
        const lastPage = Math.max(1, result.totalPages);
        if (nextPage > lastPage) {
          setPage(lastPage);
        } else if (result.page !== page) {
          setPage(result.page);
        }
      } catch (caught) {
        if (requestId === listRequestId.current) {
          handleApiError(caught, t("feedback.loadError"));
        }
      } finally {
        if (requestId === listRequestId.current) {
          setIsLoading(false);
        }
      }
    },
    [
      branchId,
      handleApiError,
      page,
      pageSize,
      productId,
      products,
      t,
      token,
    ],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTransferPage(page, pageSize, branchId, productId);
  }, [branchId, loadTransferPage, page, pageSize, productId]);

  function getBranchName(id?: string) {
    return (
      (id ? branches.find((branch) => branch._id === id)?.name : undefined) ??
      viewingTransfer?.branchId?.name ??
      deletingTransfer?.branchId?.name ??
      t("details.notAvailable")
    );
  }

  function openCreateForm() {
    if (!canCreate || isLookupsLoading || lookupError) return;
    setEditingTransfer(null);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function openEditForm(transfer: TransferItem) {
    if (!canManage || !transfer.branchId?._id || !transfer.productId?._id) return;
    setViewingTransfer(null);
    setEditingTransfer(transfer);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingTransfer(null);
  }

  async function handleSave(values: TransferFormValues) {
    if (!token || (!editingTransfer && !canCreate) || (editingTransfer && !canManage)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      if (editingTransfer) {
        await updateTransfer(token, editingTransfer._id, values);
        setFeedback(t("feedback.updated"));
        setEditorOpen(false);
        setEditingTransfer(null);
        await loadTransferPage(page, pageSize, branchId, productId);
      } else {
        await createTransfer(token, values);
        setFeedback(t("feedback.created"));
        setEditorOpen(false);
        setPage(1);
        await loadTransferPage(1, pageSize, branchId, productId);
        try {
          const inventoryRecords = await loadInventoryRecords(token);
          setInventoryQuantities(
            Object.fromEntries(
              inventoryRecords.flatMap((record) =>
                record.product_id
                  ? [[record.product_id._id, record.total_quantity] as const]
                  : [],
              ),
            ),
          );
          setInventoryLoadError(false);
        } catch {
          setInventoryLoadError(true);
        }
      }
    } catch (caught) {
      handleApiError(caught, t("feedback.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingTransfer || !token || !canManage) return;

    try {
      setIsDeleting(true);
      setError("");
      await deleteTransfer(token, deletingTransfer._id);
      setFeedback(t("feedback.deleted"));
      setDeletingTransfer(null);
      setViewingTransfer(null);
      const nextPage =
        transfers.items.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadTransferPage(nextPage, pageSize, branchId, productId);
    } catch (caught) {
      handleApiError(caught, t("feedback.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleView(transfer: TransferItem) {
    if (!token) return;
    try {
      setIsDetailLoading(true);
      setError("");
      const details = await getTransfer(token, transfer._id);
      const resolvedDetails = resolveTransferProduct(details, products);
      setViewingTransfer({
        ...resolvedDetails,
        timestamp: resolvedDetails.timestamp ?? transfer.timestamp,
      });
    } catch (caught) {
      handleApiError(caught, t("feedback.detailsError"));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function clearFilters() {
    setBranchId("all");
    setProductId("all");
    setPage(1);
  }

  const canOpenForm =
    canCreate &&
    !isLookupsLoading &&
    !lookupError &&
    branches.length > 0 &&
    products.length > 0;

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={openCreateForm}
            disabled={!canOpenForm}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" />
            {t("actions.new")}
          </Button>
        )}
      </header>

      {feedback && (
        <p role="status" className="text-sm text-success">
          {feedback}
        </p>
      )}
      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          {!isLoading && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void loadTransferPage(page, pageSize, branchId, productId)
              }
            >
              {t("actions.retry")}
            </Button>
          )}
        </div>
      )}
      {lookupError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            {lookupError}
          </p>
          {!isLookupsLoading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadLookups()}
            >
              {t("actions.retry")}
            </Button>
          )}
        </div>
      )}
      {isLookupsLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingOptions")}
        </p>
      )}
      {isDetailLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loadingDetails")}
        </p>
      )}

      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("feedback.loading")}
        </p>
      ) : error ? null : (
        <TransfersTable
          transfers={transfers}
          branches={branches}
          products={products}
          branchId={branchId}
          productId={productId}
          filtersDisabled={isLoading || isLookupsLoading || Boolean(lookupError)}
          canAdd={canCreate}
          addDisabled={!canOpenForm}
          canEdit={canManage}
          canDelete={canManage}
          onBranchChange={(id) => {
            setBranchId(id);
            setPage(1);
            setFeedback("");
          }}
          onProductChange={(id) => {
            setProductId(id);
            setPage(1);
            setFeedback("");
          }}
          onClearFilters={clearFilters}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            const nextPageSize = pageSizes.find((size) => size === value);
            if (nextPageSize !== undefined) {
              setPageSize(nextPageSize);
              setPage(1);
            }
          }}
          onAdd={openCreateForm}
          onView={(transfer) => {
            setFeedback("");
            void handleView(transfer);
          }}
          onEdit={openEditForm}
          onDelete={(transfer) => {
            if (!canManage) return;
            setDeletingTransfer(transfer);
            setFeedback("");
          }}
        />
      )}

      <TransferFormSheet
        key={`${editorOpen}:${editingTransfer?._id ?? "new"}`}
        open={editorOpen}
        transfer={editingTransfer}
        branches={branches}
        products={products}
        inventoryQuantities={inventoryQuantities}
        isInventoryLoading={isInventoryLoading}
        inventoryLoadError={inventoryLoadError}
        isSubmitting={isSubmitting}
        onOpenChange={closeEditor}
        onSubmit={handleSave}
      />
      <TransferDetailsSheet
        transfer={viewingTransfer}
        branchName={
          viewingTransfer
            ? getBranchName(viewingTransfer.branchId?._id)
            : t("details.notAvailable")
        }
        canEdit={canManage}
        canDelete={canManage}
        onOpenChange={(open) => {
          if (!open) setViewingTransfer(null);
        }}
        onEdit={openEditForm}
        onDelete={(transfer) => {
          if (!canManage) return;
          setViewingTransfer(null);
          setDeletingTransfer(transfer);
        }}
      />
      <DeleteTransferSheet
        transfer={deletingTransfer}
        branchName={
          deletingTransfer
            ? getBranchName(deletingTransfer.branchId?._id)
            : t("details.notAvailable")
        }
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) setDeletingTransfer(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
