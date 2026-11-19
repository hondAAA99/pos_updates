"use client";

import {
  ArrowDownUp,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { ApiClientError } from "@/lib/api-client";
import {
  createWallet,
  createWalletType,
  depositWallet,
  deleteWallet,
  deleteWalletType,
  deleteWalletTransaction,
  getWalletById,
  getWalletTransactionById,
  getWalletTypeById,
  listWalletTransactions,
  listWalletTypes,
  listWallets,
  updateWallet,
  updateWalletType,
  transferWallet,
  withdrawWallet,
} from "../services/wallets-service";
import type {
  PaginatedResponse,
  Wallet,
  WalletInput,
  WalletTransaction,
  WalletType,
  WalletTypeInput,
} from "../types/wallet";
import { WalletFormSheet } from "./wallet-form-sheet";
import {
  WalletDeleteSheet,
  WalletDetailsSheet,
  WalletTransactionDeleteSheet,
  WalletTransactionDetailsSheet,
  type WalletDeleteTarget,
} from "./wallet-record-sheets";
import { WalletTypeFormSheet } from "./wallet-type-form-sheet";
import {
  WalletOperationSheet,
  type WalletOperationKind,
  type WalletOperationSubmission,
} from "./wallet-operation-sheet";

type Section = "wallets" | "types" | "transactions";
type SortOrder = "phone-asc" | "phone-desc" | "balance-asc" | "balance-desc";

const EMPTY_WALLET_PAGE: PaginatedResponse<Wallet> = {
  meta: { totalDoc: 0, currentPage: 1, totalPages: 1, limit: 10 },
  data: [],
};

const EMPTY_TRANSACTION_PAGE: PaginatedResponse<WalletTransaction> = {
  meta: { totalDoc: 0, currentPage: 1, totalPages: 1, limit: 10 },
  data: [],
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-1 p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
    </Card>
  );
}

function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  rangeStart?: number;
  rangeEnd?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const t = useTranslations("wallets");
  const pageCount = Math.max(1, totalPages ?? Math.ceil(totalItems / pageSize));
  const start = rangeStart ?? (totalItems === 0 ? 0 : (page - 1) * pageSize + 1);
  const end = rangeEnd ?? Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("pagination.range", { start, end, total: totalItems })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("pagination.rows")}
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
            className="h-9 rounded-md border border-input bg-background px-2 text-foreground"
          >
            {[5, 10, 20].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t("pagination.previous")}
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {t("pagination.page", { page, pages: pageCount })}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
}

export function WalletsManagement() {
  const t = useTranslations("wallets");
  const locale = useLocale() as Locale;
  const { token, isLoading: isAuthLoading } = useAuth();
  const [walletResponse, setWalletResponse] = useState(EMPTY_WALLET_PAGE);
  const wallets = walletResponse.data;
  const [walletTypes, setWalletTypes] = useState<WalletType[]>([]);
  const [transactionResponse, setTransactionResponse] = useState(EMPTY_TRANSACTION_PAGE);
  const transactions = transactionResponse.data;
  const [section, setSection] = useState<Section>("wallets");
  const [selectedOperationWalletId, setSelectedOperationWalletId] = useState("");
  const [operationType, setOperationType] = useState<WalletOperationKind | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("phone-asc");
  const [typeQuery, setTypeQuery] = useState("");
  const [transactionType, setTransactionType] = useState("all");
  const [walletFormOpen, setWalletFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingType, setEditingType] = useState<WalletType | null>(null);
  const [details, setDetails] = useState<{ wallet: Wallet | null; type: WalletType | null }>({
    wallet: null,
    type: null,
  });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsLoadError, setDetailsLoadError] = useState("");
  const [detailsRetryCount, setDetailsRetryCount] = useState(0);
  const [viewingTransaction, setViewingTransaction] = useState<WalletTransaction | null>(null);
  const [transactionDetailsLoading, setTransactionDetailsLoading] = useState(false);
  const [transactionDetailsError, setTransactionDetailsError] = useState("");
  const [transactionDetailsRetryCount, setTransactionDetailsRetryCount] = useState(0);
  const [deletingTransaction, setDeletingTransaction] = useState<WalletTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WalletDeleteTarget | null>(null);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletTypesLoading, setWalletTypesLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [walletsLoadError, setWalletsLoadError] = useState("");
  const [walletTypesLoadError, setWalletTypesLoadError] = useState("");
  const [transactionsLoadError, setTransactionsLoadError] = useState("");
  const [walletsReloadCounter, setWalletsReloadCounter] = useState(0);
  const [walletTypesReloadCounter, setWalletTypesReloadCounter] = useState(0);
  const [transactionsReloadCounter, setTransactionsReloadCounter] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const selectedOperationWallet =
    wallets.find((wallet) => wallet.id === selectedOperationWalletId) ??
    wallets[0] ??
    null;

  useEffect(() => {
    if (isAuthLoading || section !== "wallets") return;

    let cancelled = false;

    async function loadWallets() {
      if (!token) {
        setWalletsLoadError(t("feedback.unauthorized"));
        setWalletsLoading(false);
        return;
      }

      setWalletsLoading(true);
      setWalletsLoadError("");
      try {
        const result = await listWallets(token, { page, limit: pageSize });
        if (!cancelled) {
          setWalletResponse(result);
          setWalletsLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setWalletsLoadError(
            error instanceof ApiClientError && error.status === 401
              ? t("feedback.unauthorized")
              : t("feedback.walletsLoadError"),
          );
        }
      } finally {
        if (!cancelled) setWalletsLoading(false);
      }
    }

    void loadWallets();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, page, pageSize, section, t, token, walletsReloadCounter]);

  useEffect(() => {
    if (isAuthLoading) return;

    let cancelled = false;

    async function loadWalletTypes() {
      if (!token) {
        setWalletTypesLoadError(t("feedback.unauthorized"));
        setWalletTypesLoading(false);
        return;
      }

      setWalletTypesLoading(true);
      setWalletTypesLoadError("");
      try {
        const result = await listWalletTypes(token);
        if (!cancelled) {
          setWalletTypes(result);
          setWalletTypesLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setWalletTypesLoadError(
            error instanceof ApiClientError && error.status === 401
              ? t("feedback.unauthorized")
              : t("feedback.typesLoadError"),
          );
        }
      } finally {
        if (!cancelled) setWalletTypesLoading(false);
      }
    }

    void loadWalletTypes();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, t, token, walletTypesReloadCounter]);

  useEffect(() => {
    if (isAuthLoading || section !== "transactions") return;

    let cancelled = false;

    async function loadTransactions() {
      if (!token) {
        setTransactionsLoadError(t("feedback.unauthorized"));
        setTransactionsLoading(false);
        return;
      }

      setTransactionsLoading(true);
      setTransactionsLoadError("");
      try {
        const result = await listWalletTransactions(token, {
          page,
          limit: pageSize,
          transactionType: transactionType === "all" ? undefined : transactionType,
        });
        if (!cancelled) {
          setTransactionResponse(result);
          setTransactionsLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setTransactionsLoadError(
            error instanceof ApiClientError && error.status === 401
              ? t("feedback.unauthorized")
              : t("transactions.loadError"),
          );
        }
      } finally {
        if (!cancelled) setTransactionsLoading(false);
      }
    }

    void loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthLoading,
    page,
    pageSize,
    section,
    t,
    token,
    transactionType,
    transactionsReloadCounter,
  ]);

  const detailsWalletId = details.wallet?.id ?? "";
  const detailsTypeId = details.type?.id ?? "";

  useEffect(() => {
    if (!detailsWalletId && !detailsTypeId) return;

    let cancelled = false;

    async function loadDetails() {
      if (!token) {
        setDetailsLoadError(t("feedback.unauthorized"));
        setDetailsLoading(false);
        return;
      }

      setDetailsLoadError("");
      try {
        if (detailsWalletId) {
          const wallet = await getWalletById(token, detailsWalletId);
          if (!cancelled) {
            setDetails((current) =>
              current.wallet?.id === detailsWalletId
                ? { ...current, wallet }
                : current,
            );
          }
        } else if (detailsTypeId) {
          const walletType = await getWalletTypeById(token, detailsTypeId);
          if (!cancelled) {
            setDetails((current) =>
              current.type?.id === detailsTypeId
                ? { ...current, type: walletType }
                : current,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setDetailsLoadError(
            error instanceof ApiClientError && error.status === 401
              ? t("feedback.unauthorized")
              : t("feedback.detailsLoadError"),
          );
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [detailsRetryCount, detailsTypeId, detailsWalletId, t, token]);

  const viewingTransactionId = viewingTransaction?.id ?? "";

  useEffect(() => {
    if (!viewingTransactionId) return;

    let cancelled = false;

    async function loadTransactionDetails() {
      if (!token) {
        setTransactionDetailsError(t("feedback.unauthorized"));
        setTransactionDetailsLoading(false);
        return;
      }

      setTransactionDetailsError("");
      try {
        const transaction = await getWalletTransactionById(token, viewingTransactionId);
        if (!cancelled) {
          setViewingTransaction((current) =>
            current?.id === viewingTransactionId ? transaction : current,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setTransactionDetailsError(
            error instanceof ApiClientError && error.status === 401
              ? t("feedback.unauthorized")
              : t("transactions.detailsLoadError"),
          );
        }
      } finally {
        if (!cancelled) setTransactionDetailsLoading(false);
      }
    }

    void loadTransactionDetails();
    return () => {
      cancelled = true;
    };
  }, [t, token, transactionDetailsRetryCount, viewingTransactionId]);

  const typeNames = useMemo(
    () => new Map(walletTypes.map((type) => [type.id, type.name])),
    [walletTypes],
  );
  const filteredWallets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return wallets
      .filter((wallet) =>
        (!normalizedQuery || wallet.phoneNumber.toLocaleLowerCase().includes(normalizedQuery)) &&
        (typeFilter === "all" || wallet.typeId === typeFilter),
      )
      .sort((left, right) => {
        const direction = sortOrder.endsWith("asc") ? 1 : -1;
        if (sortOrder.startsWith("phone")) {
          return left.phoneNumber.localeCompare(right.phoneNumber) * direction;
        }
        return (left.money_amount - right.money_amount) * direction;
      });
  }, [wallets, query, typeFilter, sortOrder]);
  const filteredTypes = useMemo(
    () => walletTypes.filter((type) => type.name.toLocaleLowerCase().includes(typeQuery.trim().toLocaleLowerCase())),
    [walletTypes, typeQuery],
  );
  const transactionTypeOptions = useMemo(
    () => Array.from(new Set(transactions.map((transaction) => transaction.transactionType))).sort(),
    [transactions],
  );
  const filteredTransactions = transactions;

  const activeItems =
    section === "wallets" ? filteredWallets :
      section === "types" ? filteredTypes : filteredTransactions;
  const visibleItems = section === "wallets" || section === "transactions"
    ? activeItems
    : activeItems.slice((page - 1) * pageSize, page * pageSize);
  const walletResultCount = query.trim() || typeFilter !== "all"
    ? filteredWallets.length
    : walletResponse.meta.totalDoc;
  const walletDataUnavailable =
    (walletsLoading || Boolean(walletsLoadError)) &&
    walletResponse.data.length === 0 &&
    walletResponse.meta.totalDoc === 0;
  const transactionDataUnavailable =
    (transactionsLoading || Boolean(transactionsLoadError)) &&
    transactionResponse.data.length === 0 &&
    transactionResponse.meta.totalDoc === 0;
  const totalBalance = wallets.reduce((total, wallet) => total + wallet.money_amount, 0);
  const totalCapacity = wallets.reduce((total, wallet) => {
    const type = walletTypes.find((item) => item.id === wallet.typeId) ?? wallet.type;
    return total + (type?.capacity ?? 0);
  }, 0);
  const remainingCapacity = wallets.reduce((total, wallet) => {
    const type = walletTypes.find((item) => item.id === wallet.typeId) ?? wallet.type;
    return total + ((type?.capacity ?? 0) - wallet.money_amount);
  }, 0);

  async function refreshWalletList() {
    if (!token) {
      setWalletsLoadError(t("feedback.unauthorized"));
      return;
    }

    const requestedPage = walletResponse.meta.currentPage;
    const limit = walletResponse.meta.limit || pageSize;
    setWalletsLoading(true);
    setWalletsLoadError("");
    try {
      let result = await listWallets(token, { page: requestedPage, limit });
      if (requestedPage > Math.max(1, result.meta.totalPages)) {
        const validPage = Math.max(1, result.meta.totalPages);
        result = await listWallets(token, { page: validPage, limit });
        if (section === "wallets") setPage(validPage);
      }
      setWalletResponse(result);
    } catch (error) {
      setWalletsLoadError(
        error instanceof ApiClientError && error.status === 401
          ? t("feedback.unauthorized")
          : t("feedback.walletsLoadError"),
      );
    } finally {
      setWalletsLoading(false);
    }
  }

  function getWalletOperationError(error: unknown) {
    if (error instanceof ApiClientError) {
      if (error.status === 401) return t("feedback.unauthorized");

      const message = error.message.trim();
      const isGenericMessage = /^Request failed(?: with status \d+)?\.?$/i.test(message);
      if (error.status >= 400 && message && !isGenericMessage) {
        return message.slice(0, 500);
      }
    }

    return t("feedback.operationError");
  }

  function startWalletOperation(operation: WalletOperationKind) {
    if (!selectedOperationWallet || isSubmitting) return;
    setFeedback(null);
    setOperationType(operation);
  }

  async function handleWalletOperation(submission: WalletOperationSubmission) {
    if (isSubmitting) return;
    if (!token || !selectedOperationWallet) {
      setFeedback({
        kind: "error",
        message: !token ? t("feedback.unauthorized") : t("feedback.operationError"),
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      switch (submission.operation) {
        case "deposit":
          await depositWallet(token, selectedOperationWallet.id, submission.input);
          break;
        case "withdraw":
          await withdrawWallet(token, selectedOperationWallet.id, submission.input);
          break;
        case "transfer":
          await transferWallet(token, selectedOperationWallet.id, submission.input);
          break;
      }

      setOperationType(null);
      setFeedback({
        kind: "success",
        message: t(`operationFeedback.${submission.operation}Success`),
      });
      void refreshWalletList();
      if (details.wallet?.id === selectedOperationWallet.id) {
        setDetailsLoading(true);
        setDetailsLoadError("");
        setDetailsRetryCount((current) => current + 1);
      }
      if (section === "transactions") {
        setTransactionsReloadCounter((current) => current + 1);
      }
    } catch (error) {
      setFeedback({ kind: "error", message: getWalletOperationError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWalletSubmit(input: WalletInput) {
    if (isSubmitting) return;
    if (!token) {
      setFeedback({ kind: "error", message: t("feedback.unauthorized") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (editingWallet) {
        await updateWallet(token, editingWallet.id, input);
        setFeedback({ kind: "success", message: t("feedback.walletUpdated") });
      } else {
        await createWallet(token, input);
        setFeedback({ kind: "success", message: t("feedback.walletCreated") });
        setPage(1);
      }
      setWalletsReloadCounter((current) => current + 1);
      setWalletFormOpen(false);
      setEditingWallet(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ApiClientError && error.status === 401
            ? t("feedback.unauthorized")
            : t("feedback.saveError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTypeSubmit(input: WalletTypeInput) {
    if (isSubmitting) return;
    if (!token) {
      setFeedback({ kind: "error", message: t("feedback.unauthorized") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (editingType) {
        await updateWalletType(token, editingType.id, input);
        setFeedback({ kind: "success", message: t("feedback.typeUpdated") });
      } else {
        await createWalletType(token, input);
        setFeedback({ kind: "success", message: t("feedback.typeCreated") });
      }
      setWalletTypesReloadCounter((current) => current + 1);
      setTypeFormOpen(false);
      setEditingType(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ApiClientError && error.status === 401
            ? t("feedback.unauthorized")
            : t("feedback.saveError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(target: WalletDeleteTarget) {
    if (isDeleting) return;
    if (!token) {
      setFeedback({ kind: "error", message: t("feedback.unauthorized") });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    try {
      if (target.kind === "wallet") {
        await deleteWallet(token, target.id);
        setFeedback({ kind: "success", message: t("feedback.walletDeleted") });
        if (wallets.length === 1 && page > 1) {
          setPage((current) => current - 1);
        } else {
          setWalletsReloadCounter((current) => current + 1);
        }
      } else {
        await deleteWalletType(token, target.id);
        setFeedback({ kind: "success", message: t("feedback.typeDeleted") });
        setWalletTypesReloadCounter((current) => current + 1);
      }
      setDeleteTarget(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ApiClientError && error.status === 401
            ? t("feedback.unauthorized")
            : t("feedback.deleteError"),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleTransactionDelete() {
    if (!deletingTransaction || isDeleting) return;
    if (!token) {
      setFeedback({ kind: "error", message: t("feedback.unauthorized") });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteWalletTransaction(token, deletingTransaction.id);
      setFeedback({ kind: "success", message: t("transactions.deleted") });
      setDeletingTransaction(null);
      if (viewingTransaction?.id === deletingTransaction.id) {
        setViewingTransaction(null);
      }

      if (transactions.length === 1 && transactionResponse.meta.currentPage > 1) {
        setPage(transactionResponse.meta.currentPage - 1);
      } else {
        setTransactionsReloadCounter((current) => current + 1);
      }
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof ApiClientError && error.status === 401
            ? t("feedback.unauthorized")
            : t("transactions.deleteError"),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function setSectionAndReset(nextSection: Section) {
    setSection(nextSection);
    setPage(1);
    setFeedback(null);
  }

  function openWalletDetails(wallet: Wallet) {
    setFeedback(null);
    setDetails({ wallet, type: null });
    setDetailsLoadError(token ? "" : t("feedback.unauthorized"));
    setDetailsLoading(Boolean(token));
    setDetailsRetryCount((current) => current + 1);
  }

  function openWalletTypeDetails(walletType: WalletType) {
    setFeedback(null);
    setDetails({ wallet: null, type: walletType });
    setDetailsLoadError(token ? "" : t("feedback.unauthorized"));
    setDetailsLoading(Boolean(token));
    setDetailsRetryCount((current) => current + 1);
  }

  function closeDetails() {
    setDetails({ wallet: null, type: null });
    setDetailsLoading(false);
    setDetailsLoadError("");
  }

  function retryDetails() {
    setDetailsLoadError("");
    setDetailsLoading(true);
    setDetailsRetryCount((current) => current + 1);
  }

  function openTransactionDetails(transaction: WalletTransaction) {
    setFeedback(null);
    setViewingTransaction(transaction);
    setTransactionDetailsError(token ? "" : t("feedback.unauthorized"));
    setTransactionDetailsLoading(Boolean(token));
    setTransactionDetailsRetryCount((current) => current + 1);
  }

  function closeTransactionDetails() {
    setViewingTransaction(null);
    setTransactionDetailsLoading(false);
    setTransactionDetailsError("");
  }

  function retryTransactionDetails() {
    setTransactionDetailsError("");
    setTransactionDetailsLoading(true);
    setTransactionDetailsRetryCount((current) => current + 1);
  }

  function walletActions(wallet: Wallet) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: wallet.phoneNumber })}
          onClick={() => openWalletDetails(wallet)}
        >
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: wallet.phoneNumber })}
          onClick={() => {
            setFeedback(null);
            setEditingWallet(wallet);
            setWalletFormOpen(true);
          }}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.deleteNamed", { name: wallet.phoneNumber })}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setFeedback(null);
            setDeleteTarget({ kind: "wallet", id: wallet.id, name: wallet.phoneNumber });
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    );
  }

  function walletTypeActions(type: WalletType) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label={t("actions.viewNamed", { name: type.name })} onClick={() => openWalletTypeDetails(type)}>
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: type.name })}
          onClick={() => {
            setFeedback(null);
            setEditingType(type);
            setTypeFormOpen(true);
          }}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.deleteNamed", { name: type.name })}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setFeedback(null);
            setDeleteTarget({
              kind: "type",
              id: type.id,
              name: type.name,
              assignedWalletCount: wallets.filter((wallet) => wallet.typeId === type.id).length,
            });
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    );
  }

  function transactionActions(transaction: WalletTransaction) {
    const name = transaction.phoneNumber || transaction.id;

    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name })}
          onClick={() => openTransactionDetails(transaction)}
        >
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.deleteNamed", { name })}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setFeedback(null);
            setDeletingTransaction(transaction);
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    );
  }

  const walletPage = visibleItems as Wallet[];
  const typePage = visibleItems as WalletType[];
  const transactionPage = visibleItems as WalletTransaction[];
  const sections = ["wallets", "types", "transactions"] as const;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <WalletIcon aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <div className="space-y-2 sm:text-end">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="wallet-operation-wallet" className="sr-only">
              {t("futureActions.walletLabel")}
            </label>
            <select
              id="wallet-operation-wallet"
              value={selectedOperationWallet?.id ?? ""}
              onChange={(event) => setSelectedOperationWalletId(event.currentTarget.value)}
              disabled={walletsLoading || wallets.length === 0 || isSubmitting}
              aria-describedby="wallets-future-action-note"
              className="h-10 min-w-48 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {wallets.length === 0 && (
                <option value="">{t("futureActions.noWallets")}</option>
              )}
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.phoneNumber}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedOperationWallet || walletsLoading || isSubmitting}
              aria-describedby="wallets-future-action-note"
              title={t("futureActions.walletHint")}
              onClick={() => startWalletOperation("deposit")}
            >
              {t("futureActions.deposit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedOperationWallet || walletsLoading || isSubmitting}
              aria-describedby="wallets-future-action-note"
              title={t("futureActions.walletHint")}
              onClick={() => startWalletOperation("withdraw")}
            >
              {t("futureActions.withdraw")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedOperationWallet || walletsLoading || isSubmitting}
              aria-describedby="wallets-future-action-note"
              title={t("futureActions.walletHint")}
              onClick={() => startWalletOperation("transfer")}
            >
              <ArrowDownUp aria-hidden="true" className="me-2 size-4" />
              {t("futureActions.transfer")}
            </Button>
          </div>
          <p id="wallets-future-action-note" className="text-xs text-muted-foreground">
            {t("futureActions.walletHint")}
          </p>
        </div>
      </header>

      <section aria-label={t("summary.title")} className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label={t("summary.wallets")} value={walletDataUnavailable ? t("details.notAvailable") : formatNumber(walletResponse.meta.totalDoc, locale)} />
        <SummaryCard label={t("summary.walletTypes")} value={formatNumber(walletTypes.length, locale)} />
      </section>

      <div role="tablist" aria-label={t("sections.label")} className="flex gap-1 overflow-x-auto border-b border-border">
        {sections.map((item, index) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={section === item}
            id={`wallets-tab-${item}`}
            onClick={() => setSectionAndReset(item)}
            onKeyDown={(event) => {
              const isNextKey = event.key === (locale === "ar" ? "ArrowLeft" : "ArrowRight");
              const isPreviousKey = event.key === (locale === "ar" ? "ArrowRight" : "ArrowLeft");
              const nextIndex = isNextKey
                ? (index + 1) % sections.length
                : isPreviousKey
                  ? (index - 1 + sections.length) % sections.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? sections.length - 1
                      : null;
              if (nextIndex !== null) {
                event.preventDefault();
                setSectionAndReset(sections[nextIndex]);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
                  ?.focus();
              }
            }}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              section === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`sections.${item}` as "sections.wallets" | "sections.types" | "sections.transactions")}
          </button>
        ))}
      </div>

      {feedback && !(
        feedback.kind === "error" &&
        (walletFormOpen || typeFormOpen || Boolean(deleteTarget) || Boolean(deletingTransaction))
      ) && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/40 text-foreground"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <section
        role="tabpanel"
        id={`wallets-panel-${section}`}
        aria-labelledby={`wallets-tab-${section}`}
        tabIndex={0}
        className="space-y-4"
      >
        {section === "wallets" && (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative block w-full lg:max-w-sm lg:flex-1">
                  <span className="sr-only">{t("search.walletsLabel")}</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="search" value={query} onChange={(event) => { setQuery(event.currentTarget.value); setPage(1); }} placeholder={t("search.walletsPlaceholder")} className="ps-9" />
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <span className="shrink-0 text-sm text-muted-foreground">{t("filter.type")}</span>
                  <select value={typeFilter} onChange={(event) => { setTypeFilter(event.currentTarget.value); setPage(1); }} className="min-w-24 bg-transparent py-2 text-sm outline-none">
                    <option value="all">{t("filter.allTypes")}</option>
                    {walletTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <span className="shrink-0 text-sm text-muted-foreground">{t("sort.label")}</span>
                  <select value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value as SortOrder)} className="min-w-32 bg-transparent py-2 text-sm outline-none">
                    <option value="phone-asc">{t("sort.phoneAsc")}</option>
                    <option value="phone-desc">{t("sort.phoneDesc")}</option>
                    <option value="balance-asc">{t("sort.balanceAsc")}</option>
                    <option value="balance-desc">{t("sort.balanceDesc")}</option>
                  </select>
                </label>
                <Button
                  type="button"
                  disabled={walletTypesLoading}
                  onClick={() => { setFeedback(null); setEditingWallet(null); setWalletFormOpen(true); }}
                >
                  <Plus aria-hidden="true" className="me-2 size-4" />
                  {t("actions.addWallet")}
                </Button>
              </div>
              {!walletDataUnavailable && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t("resultsCount", { count: walletResultCount })}
                </p>
              )}
            </div>
            {walletsLoading ? (
              <p role="status" className="p-8 text-center text-sm text-muted-foreground">
                {t("feedback.loadingWallets")}
              </p>
            ) : walletsLoadError ? (
              <div role="alert" className="flex flex-wrap items-center justify-center gap-3 p-8 text-sm text-destructive">
                <span>{walletsLoadError}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setWalletsReloadCounter((current) => current + 1)}>
                  {t("actions.retry")}
                </Button>
              </div>
            ) : walletPage.length ? (
              <>
                <CardContent className="hidden p-0 md:block">
                  <table className="w-full text-start text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("table.phone")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("table.type")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("table.balance")}</th>
                        <th scope="col" className="px-4 py-3.5 text-end font-medium">{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {walletPage.map((wallet) => (
                        <tr key={wallet.id} className="transition-colors hover:bg-muted/30">
                          <th scope="row" dir="auto" className="px-5 py-4 text-start font-medium">{wallet.phoneNumber}</th>
                          <td className="px-5 py-4 text-muted-foreground">{typeNames.get(wallet.typeId) ?? wallet.type?.name ?? t("unknownType")}</td>
                          <td className="px-5 py-4 text-end tabular-nums">{formatCurrency(wallet.money_amount, locale)}</td>
                          <td className="px-4 py-3">{walletActions(wallet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <div className="grid gap-3 p-4 md:hidden">
                  {walletPage.map((wallet) => (
                    <article key={wallet.id} className="min-w-0 rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 dir="auto" className="break-all text-sm font-semibold">{wallet.phoneNumber}</h2>
                        {walletActions(wallet)}
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("table.type")}</dt><dd>{typeNames.get(wallet.typeId) ?? wallet.type?.name ?? t("unknownType")}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("table.balance")}</dt><dd>{formatCurrency(wallet.money_amount, locale)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
                <Pagination
                  page={walletResponse.meta.currentPage}
                  pageSize={pageSize}
                  totalItems={walletResponse.meta.totalDoc}
                  totalPages={walletResponse.meta.totalPages}
                  rangeStart={walletResponse.meta.totalDoc === 0
                    ? 0
                    : (walletResponse.meta.currentPage - 1) * walletResponse.meta.limit + 1}
                  rangeEnd={Math.min(
                    walletResponse.meta.currentPage * walletResponse.meta.limit,
                    walletResponse.meta.totalDoc,
                  )}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium">{walletResponse.meta.totalDoc ? t("empty.noWalletMatches") : t("empty.noWallets")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("empty.walletsDescription")}</p>
                {walletResponse.meta.totalDoc === 0 && (
                  <Button
                    className="mt-4"
                    disabled={walletTypesLoading}
                    onClick={() => { setFeedback(null); setEditingWallet(null); setWalletFormOpen(true); }}
                  >
                    <Plus aria-hidden="true" className="me-2 size-4" />
                    {t("actions.addWallet")}
                  </Button>
                )}
                {walletResponse.meta.totalDoc > 0 && (
                  <Pagination
                    page={walletResponse.meta.currentPage}
                    pageSize={pageSize}
                    totalItems={walletResponse.meta.totalDoc}
                    totalPages={walletResponse.meta.totalPages}
                    rangeStart={(walletResponse.meta.currentPage - 1) * walletResponse.meta.limit + 1}
                    rangeEnd={Math.min(
                      walletResponse.meta.currentPage * walletResponse.meta.limit,
                      walletResponse.meta.totalDoc,
                    )}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  />
                )}
              </div>
            )}
          </Card>
        )}

        {section === "types" && (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">{t("search.typesLabel")}</span>
                <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={typeQuery} onChange={(event) => { setTypeQuery(event.currentTarget.value); setPage(1); }} placeholder={t("search.typesPlaceholder")} className="ps-9" />
              </label>
              <Button type="button" onClick={() => { setFeedback(null); setEditingType(null); setTypeFormOpen(true); }}>
                <Plus aria-hidden="true" className="me-2 size-4" />
                {t("actions.addType")}
              </Button>
            </div>
            {walletTypesLoading ? (
              <p role="status" className="p-8 text-center text-sm text-muted-foreground">
                {t("feedback.loadingTypes")}
              </p>
            ) : walletTypesLoadError ? (
              <div role="alert" className="flex flex-wrap items-center justify-center gap-3 p-8 text-sm text-destructive">
                <span>{walletTypesLoadError}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setWalletTypesReloadCounter((current) => current + 1)}>
                  {t("actions.retry")}
                </Button>
              </div>
            ) : typePage.length ? (
              <>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full min-w-[760px] text-start text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("typeTable.name")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.capacity")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.daily")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.monthly")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.walletCount")}</th>
                        <th scope="col" className="px-4 py-3.5 text-end font-medium">{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {typePage.map((type) => (
                        <tr key={type.id} className="transition-colors hover:bg-muted/30">
                          <th scope="row" className="px-5 py-4 text-start font-medium">{type.name}</th>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.capacity, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.daily, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.monthly, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatNumber(wallets.filter((wallet) => wallet.typeId === type.id).length, locale)}</td>
                          <td className="px-4 py-3">{walletTypeActions(type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <Pagination page={page} pageSize={pageSize} totalItems={filteredTypes.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium">{walletTypes.length ? t("empty.noTypeMatches") : t("empty.noTypes")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("empty.typesDescription")}</p>
                <Button className="mt-4" onClick={() => { setFeedback(null); setEditingType(null); setTypeFormOpen(true); }}><Plus aria-hidden="true" className="me-2 size-4" />{t("actions.addType")}</Button>
              </div>
            )}
          </Card>
        )}

        {section === "transactions" && (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="space-y-3 border-b border-border p-4 sm:p-5">
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {t("transactions.apiDataNotice")}
              </p>
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <span className="shrink-0 text-sm text-muted-foreground">{t("transactions.typeFilter")}</span>
                  <select
                    value={transactionType}
                    onChange={(event) => {
                      setTransactionType(event.currentTarget.value);
                      setPage(1);
                    }}
                    className="min-w-28 bg-transparent py-2 text-sm outline-none"
                  >
                    <option value="all">{t("filter.allTypes")}</option>
                    {transactionType !== "all" && !transactionTypeOptions.includes(transactionType) && (
                      <option value={transactionType}>{transactionType}</option>
                    )}
                    {transactionTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                {transactionType !== "all" && (
                  <Button type="button" variant="ghost" onClick={() => { setTransactionType("all"); setPage(1); }}>
                    {t("actions.clearFilters")}
                  </Button>
                )}
              </div>
              {!transactionDataUnavailable && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t("resultsCount", { count: transactionResponse.meta.totalDoc })}
                </p>
              )}
            </div>
            {transactionsLoading ? (
              <p role="status" className="p-8 text-center text-sm text-muted-foreground">
                {t("transactions.loading")}
              </p>
            ) : transactionsLoadError ? (
              <div role="alert" className="flex flex-wrap items-center justify-center gap-3 p-8 text-sm text-destructive">
                <span>{transactionsLoadError}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setTransactionsReloadCounter((current) => current + 1)}>
                  {t("actions.retry")}
                </Button>
              </div>
            ) : transactionPage.length ? (
              <>
                <CardContent className="hidden overflow-x-auto p-0 md:block">
                  <table className="w-full min-w-[1040px] text-start text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.date")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.wallet")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.type")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.phone")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("transactions.amount")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("transactions.fee")}</th>
                        <th scope="col" className="px-4 py-3.5 text-end font-medium">{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactionPage.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-5 py-4 text-muted-foreground">{formatDate(transaction.timestamp, locale, { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td className="px-5 py-4">{transaction.walletId || t("details.notAvailable")}</td>
                          <td className="px-5 py-4">{transaction.transactionType}</td>
                          <td dir="auto" className="px-5 py-4">{transaction.phoneNumber || t("details.notAvailable")}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(transaction.moneyAmount, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(transaction.transaction_fee, locale)}</td>
                          <td className="px-4 py-3">{transactionActions(transaction)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <div className="grid gap-3 p-4 md:hidden">
                  {transactionPage.map((transaction) => (
                    <article key={transaction.id} className="rounded-lg border border-border p-4">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{transaction.transactionType}</span>
                        <span>{formatCurrency(transaction.moneyAmount, locale)}</span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.date")}</dt><dd>{formatDate(transaction.timestamp, locale, { dateStyle: "medium" })}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.wallet")}</dt><dd>{transaction.walletId || t("details.notAvailable")}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.phone")}</dt><dd dir="auto">{transaction.phoneNumber || t("details.notAvailable")}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.fee")}</dt><dd>{formatCurrency(transaction.transaction_fee, locale)}</dd></div>
                      </dl>
                      <div className="mt-3">{transactionActions(transaction)}</div>
                    </article>
                  ))}
                </div>
                <Pagination
                  page={transactionResponse.meta.currentPage}
                  pageSize={transactionResponse.meta.limit}
                  totalItems={transactionResponse.meta.totalDoc}
                  totalPages={transactionResponse.meta.totalPages}
                  rangeStart={transactionResponse.meta.totalDoc === 0
                    ? 0
                    : (transactionResponse.meta.currentPage - 1) * transactionResponse.meta.limit + 1}
                  rangeEnd={Math.min(
                    transactionResponse.meta.currentPage * transactionResponse.meta.limit,
                    transactionResponse.meta.totalDoc,
                  )}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium">{t("empty.noTransactions")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("transactions.emptyDescription")}</p>
                {transactionResponse.meta.totalDoc > 0 && (
                  <Pagination
                    page={transactionResponse.meta.currentPage}
                    pageSize={transactionResponse.meta.limit}
                    totalItems={transactionResponse.meta.totalDoc}
                    totalPages={transactionResponse.meta.totalPages}
                    rangeStart={(transactionResponse.meta.currentPage - 1) * transactionResponse.meta.limit + 1}
                    rangeEnd={Math.min(
                      transactionResponse.meta.currentPage * transactionResponse.meta.limit,
                      transactionResponse.meta.totalDoc,
                    )}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  />
                )}
              </div>
            )}
          </Card>
        )}
      </section>

      <WalletFormSheet
        key={walletFormOpen ? `wallet-${editingWallet?.id ?? "new"}` : "wallet-closed"}
        open={walletFormOpen}
        wallet={editingWallet}
        walletTypes={walletTypes}
        isSubmitting={isSubmitting}
        submissionError={feedback?.kind === "error" ? feedback.message : ""}
        onOpenChange={(open) => {
          if (!open && isSubmitting) return;
          setWalletFormOpen(open);
          if (!open) setEditingWallet(null);
        }}
        onSubmit={handleWalletSubmit}
      />
      <WalletTypeFormSheet
        key={typeFormOpen ? `type-${editingType?.id ?? "new"}` : "type-closed"}
        open={typeFormOpen}
        walletType={editingType}
        isSubmitting={isSubmitting}
        submissionError={feedback?.kind === "error" ? feedback.message : ""}
        onOpenChange={(open) => {
          if (!open && isSubmitting) return;
          setTypeFormOpen(open);
          if (!open) setEditingType(null);
        }}
        onSubmit={handleTypeSubmit}
      />
      {operationType && selectedOperationWallet && (
        <WalletOperationSheet
          key={`${operationType}-${selectedOperationWallet.id}`}
          wallet={selectedOperationWallet}
          operation={operationType}
          isSubmitting={isSubmitting}
          submissionError={
            feedback?.kind === "error" ? feedback.message : ""
          }
          onOpenChange={(open) => {
            if (!open && isSubmitting) return;
            if (!open) setOperationType(null);
          }}
          onSubmit={handleWalletOperation}
        />
      )}
      <WalletDetailsSheet
        wallet={details.wallet}
        walletType={details.type}
        resolvedWalletType={details.wallet
          ? walletTypes.find((type) => type.id === details.wallet?.typeId) ?? details.wallet.type ?? null
          : null}
        isLoading={detailsLoading}
        error={detailsLoadError}
        onRetry={retryDetails}
        onClose={closeDetails}
      />
      <WalletTransactionDetailsSheet
        transaction={viewingTransaction}
        isLoading={transactionDetailsLoading}
        error={transactionDetailsError}
        onRetry={retryTransactionDetails}
        onClose={closeTransactionDetails}
      />
      <WalletTransactionDeleteSheet
        transaction={deletingTransaction}
        isDeleting={isDeleting}
        error={feedback?.kind === "error" ? feedback.message : ""}
        onClose={() => {
          if (!isDeleting) setDeletingTransaction(null);
        }}
        onConfirm={handleTransactionDelete}
      />
      <WalletDeleteSheet
        target={deleteTarget}
        isDeleting={isDeleting}
        error={feedback?.kind === "error" ? feedback.message : ""}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}