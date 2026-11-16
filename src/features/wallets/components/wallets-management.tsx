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
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, formatDateKey, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import {
  createWallet,
  createWalletType,
  deleteWallet,
  deleteWalletType,
  getWalletById,
  listWalletTransactions,
  listWalletTypes,
  listWallets,
  updateWallet,
  updateWalletType,
  WalletMockServiceError,
} from "../services/wallets-service";
import type {
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
  type WalletDeleteTarget,
} from "./wallet-record-sheets";
import { WalletTypeFormSheet } from "./wallet-type-form-sheet";

type Section = "wallets" | "types" | "transactions";
type SortOrder = "phone-asc" | "phone-desc" | "balance-asc" | "balance-desc";
type WalletMessageKey =
  | "errors.typeInUse"
  | "errors.walletNotFound"
  | "errors.typeNotFound"
  | "validation.phoneRequired"
  | "validation.amountInvalid"
  | "validation.nameRequired";

function getErrorTranslationKey(error: unknown): WalletMessageKey {
  if (error instanceof WalletMockServiceError) {
    if (error.code === "wallet-type-in-use") return "errors.typeInUse";
    if (error.code === "wallet-not-found") return "errors.walletNotFound";
    return "errors.typeNotFound";
  }
  if (error instanceof Error) {
    if (error.message === "wallet-phone-required") return "validation.phoneRequired";
    if (error.message === "wallet-balance-invalid" || error.message === "wallet-limit-invalid") {
      return "validation.amountInvalid";
    }
    if (error.message === "wallet-type-name-required") return "validation.nameRequired";
  }
  throw error;
}

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
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const t = useTranslations("wallets");
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
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
  const [wallets, setWallets] = useState(listWallets);
  const [walletTypes, setWalletTypes] = useState(listWalletTypes);
  const [transactions] = useState(listWalletTransactions);
  const [section, setSection] = useState<Section>("wallets");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("phone-asc");
  const [typeQuery, setTypeQuery] = useState("");
  const [transactionWallet, setTransactionWallet] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [walletFormOpen, setWalletFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingType, setEditingType] = useState<WalletType | null>(null);
  const [details, setDetails] = useState<{ wallet: Wallet | null; type: WalletType | null }>({
    wallet: null,
    type: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<WalletDeleteTarget | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

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
  const filteredTransactions = useMemo(
    () => transactions
      .filter((transaction) =>
        (transactionWallet === "all" || transaction.walletId === transactionWallet) &&
        (transactionType === "all" || transaction.transactionType === transactionType) &&
        (!dateFrom || formatDateKey(transaction.timestamp) >= dateFrom) &&
        (!dateTo || formatDateKey(transaction.timestamp) <= dateTo),
      )
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime()),
    [transactions, transactionWallet, transactionType, dateFrom, dateTo],
  );

  const activeItems =
    section === "wallets" ? filteredWallets :
      section === "types" ? filteredTypes : filteredTransactions;
  const visibleItems = activeItems.slice((page - 1) * pageSize, page * pageSize);
  const totalBalance = wallets.reduce((total, wallet) => total + wallet.money_amount, 0);
  const totalCapacity = wallets.reduce((total, wallet) => {
    const type = walletTypes.find((item) => item.id === wallet.typeId);
    return total + (type?.capacity ?? 0);
  }, 0);
  const remainingCapacity = wallets.reduce((total, wallet) => {
    const type = walletTypes.find((item) => item.id === wallet.typeId);
    return total + ((type?.capacity ?? 0) - wallet.money_amount);
  }, 0);

  function refreshData() {
    setWallets(listWallets());
    setWalletTypes(listWalletTypes());
  }

  function reportOperationError(error: unknown) {
    setOperationError(t(getErrorTranslationKey(error)));
  }

  function handleWalletSubmit(input: WalletInput) {
    try {
      if (editingWallet) updateWallet(editingWallet.id, input);
      else createWallet(input);
      refreshData();
      setWalletFormOpen(false);
      setEditingWallet(null);
      setOperationError(null);
    } catch (error) {
      reportOperationError(error);
    }
  }

  function handleTypeSubmit(input: WalletTypeInput) {
    try {
      if (editingType) updateWalletType(editingType.id, input);
      else createWalletType(input);
      refreshData();
      setTypeFormOpen(false);
      setEditingType(null);
      setOperationError(null);
    } catch (error) {
      reportOperationError(error);
    }
  }

  function handleDelete(target: WalletDeleteTarget) {
    try {
      if (target.kind === "wallet") deleteWallet(target.id);
      else deleteWalletType(target.id);
      refreshData();
      setDeleteTarget(null);
      setOperationError(null);
    } catch (error) {
      reportOperationError(error);
    }
  }

  function setSectionAndReset(nextSection: Section) {
    setSection(nextSection);
    setPage(1);
    setOperationError(null);
  }

  function translationKeyForTransactionType(type: string):
    | "transactions.sampleTypeA"
    | "transactions.sampleTypeB"
    | "transactions.sampleTypeC"
    | "transactions.unknownType" {
    if (type === "Sample type A") return "transactions.sampleTypeA";
    if (type === "Sample type B") return "transactions.sampleTypeB";
    if (type === "Sample type C") return "transactions.sampleTypeC";
    return "transactions.unknownType";
  }

  function walletActions(wallet: Wallet) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.viewNamed", { name: wallet.phoneNumber })}
          onClick={() => {
            try {
              setDetails({ wallet: getWalletById(wallet.id), type: null });
              setOperationError(null);
            } catch (error) {
              reportOperationError(error);
            }
          }}
        >
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: wallet.phoneNumber })}
          onClick={() => {
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
          onClick={() => setDeleteTarget({ kind: "wallet", id: wallet.id, name: wallet.phoneNumber })}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    );
  }

  function walletTypeActions(type: WalletType) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label={t("actions.viewNamed", { name: type.name })} onClick={() => setDetails({ wallet: null, type })}>
          <Eye aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("actions.editNamed", { name: type.name })}
          onClick={() => {
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
          onClick={() => setDeleteTarget({
            kind: "type",
            id: type.id,
            name: type.name,
            assignedWalletCount: wallets.filter((wallet) => wallet.typeId === type.id).length,
          })}
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
            <Button type="button" variant="outline" disabled aria-describedby="wallets-future-action-note" title={t("futureActions.disabledHint")}>
              {t("futureActions.deposit")}
            </Button>
            <Button type="button" variant="outline" disabled aria-describedby="wallets-future-action-note" title={t("futureActions.disabledHint")}>
              {t("futureActions.withdraw")}
            </Button>
            <Button type="button" variant="outline" disabled aria-describedby="wallets-future-action-note" title={t("futureActions.disabledHint")}>
              <ArrowDownUp aria-hidden="true" className="me-2 size-4" />
              {t("futureActions.transfer")}
            </Button>
          </div>
          <p id="wallets-future-action-note" className="text-xs text-muted-foreground">
            {t("futureActions.disabledHint")}
          </p>
        </div>
      </header>

      <section aria-label={t("summary.title")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label={t("summary.wallets")} value={formatNumber(wallets.length, locale)} />
        <SummaryCard label={t("summary.totalBalance")} value={formatCurrency(totalBalance, locale)} />
        <SummaryCard label={t("summary.totalCapacity")} value={formatCurrency(totalCapacity, locale)} />
        <SummaryCard label={t("summary.availableCapacity")} value={formatCurrency(remainingCapacity, locale)} />
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

      {operationError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {operationError}
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
                <Button type="button" onClick={() => { setEditingWallet(null); setWalletFormOpen(true); }}>
                  <Plus aria-hidden="true" className="me-2 size-4" />
                  {t("actions.addWallet")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {t("resultsCount", { count: filteredWallets.length })}
              </p>
            </div>
            {walletPage.length ? (
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
                          <td className="px-5 py-4 text-muted-foreground">{typeNames.get(wallet.typeId) ?? t("unknownType")}</td>
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
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("table.type")}</dt><dd>{typeNames.get(wallet.typeId) ?? t("unknownType")}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("table.balance")}</dt><dd>{formatCurrency(wallet.money_amount, locale)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
                <Pagination page={page} pageSize={pageSize} totalItems={filteredWallets.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium">{wallets.length ? t("empty.noWalletMatches") : t("empty.noWallets")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("empty.walletsDescription")}</p>
                {wallets.length === 0 && <Button className="mt-4" onClick={() => { setEditingWallet(null); setWalletFormOpen(true); }}><Plus aria-hidden="true" className="me-2 size-4" />{t("actions.addWallet")}</Button>}
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
              <Button type="button" onClick={() => { setEditingType(null); setTypeFormOpen(true); }}>
                <Plus aria-hidden="true" className="me-2 size-4" />
                {t("actions.addType")}
              </Button>
            </div>
            {typePage.length ? (
              <>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full min-w-[760px] text-start text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("typeTable.name")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.capacity")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.dailyTransfer")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.monthlyTransfer")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("typeTable.walletCount")}</th>
                        <th scope="col" className="px-4 py-3.5 text-end font-medium">{t("table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {typePage.map((type) => (
                        <tr key={type.id} className="transition-colors hover:bg-muted/30">
                          <th scope="row" className="px-5 py-4 text-start font-medium">{type.name}</th>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.capacity, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.daily.transfer, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(type.monthly.transfer, locale)}</td>
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
                <Button className="mt-4" onClick={() => { setEditingType(null); setTypeFormOpen(true); }}><Plus aria-hidden="true" className="me-2 size-4" />{t("actions.addType")}</Button>
              </div>
            )}
          </Card>
        )}

        {section === "transactions" && (
          <Card className="gap-0 overflow-hidden p-0">
            <div className="space-y-3 border-b border-border p-4 sm:p-5">
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {t("transactions.sampleDataNotice")}
              </p>
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <span className="shrink-0 text-sm text-muted-foreground">{t("transactions.walletFilter")}</span>
                  <select value={transactionWallet} onChange={(event) => { setTransactionWallet(event.currentTarget.value); setPage(1); }} className="min-w-28 bg-transparent py-2 text-sm outline-none">
                    <option value="all">{t("filter.allWallets")}</option>
                    {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.phoneNumber}</option>)}
                  </select>
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <span className="shrink-0 text-sm text-muted-foreground">{t("transactions.typeFilter")}</span>
                  <select value={transactionType} onChange={(event) => { setTransactionType(event.currentTarget.value); setPage(1); }} className="min-w-28 bg-transparent py-2 text-sm outline-none">
                    <option value="all">{t("filter.allTypes")}</option>
                    {transactionTypeOptions.map((type) => <option key={type} value={type}>{t(translationKeyForTransactionType(type))}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t("transactions.from")}
                  <Input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.currentTarget.value); setPage(1); }} className="w-auto" />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t("transactions.to")}
                  <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.currentTarget.value); setPage(1); }} className="w-auto" />
                </label>
                {(transactionWallet !== "all" || transactionType !== "all" || dateFrom || dateTo) && (
                  <Button type="button" variant="ghost" onClick={() => { setTransactionWallet("all"); setTransactionType("all"); setDateFrom(""); setDateTo(""); setPage(1); }}>
                    {t("actions.clearFilters")}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">{t("resultsCount", { count: filteredTransactions.length })}</p>
            </div>
            {transactionPage.length ? (
              <>
                <CardContent className="hidden overflow-x-auto p-0 md:block">
                  <table className="w-full min-w-[900px] text-start text-sm">
                    <thead className="bg-muted/40">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.date")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.wallet")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.type")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("transactions.amount")}</th>
                        <th scope="col" className="px-5 py-3.5 text-end font-medium">{t("transactions.fee")}</th>
                        <th scope="col" className="px-5 py-3.5 text-start font-medium">{t("transactions.phone")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactionPage.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-5 py-4 text-muted-foreground">{formatDate(transaction.timestamp, locale, { dateStyle: "medium", timeStyle: "short" })}</td>
                          <td dir="auto" className="px-5 py-4">{transaction.phoneNumber}</td>
                          <td className="px-5 py-4">{t(translationKeyForTransactionType(transaction.transactionType))}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(transaction.moneyAmount, locale)}</td>
                          <td className="px-5 py-4 text-end">{formatCurrency(transaction.transaction_fee, locale)}</td>
                          <td dir="auto" className="px-5 py-4 text-muted-foreground">{transaction.phoneNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <div className="grid gap-3 p-4 md:hidden">
                  {transactionPage.map((transaction) => (
                    <article key={transaction.id} className="rounded-lg border border-border p-4">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{t(translationKeyForTransactionType(transaction.transactionType))}</span>
                        <span>{formatCurrency(transaction.moneyAmount, locale)}</span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.date")}</dt><dd>{formatDate(transaction.timestamp, locale, { dateStyle: "medium" })}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.phone")}</dt><dd dir="auto">{transaction.phoneNumber}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("transactions.fee")}</dt><dd>{formatCurrency(transaction.transaction_fee, locale)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
                <Pagination page={page} pageSize={pageSize} totalItems={filteredTransactions.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium">{t("empty.noTransactions")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("empty.transactionsDescription")}</p>
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
        onOpenChange={(open) => {
          setWalletFormOpen(open);
          if (!open) setEditingWallet(null);
        }}
        onSubmit={handleWalletSubmit}
      />
      <WalletTypeFormSheet
        key={typeFormOpen ? `type-${editingType?.id ?? "new"}` : "type-closed"}
        open={typeFormOpen}
        walletType={editingType}
        onOpenChange={(open) => {
          setTypeFormOpen(open);
          if (!open) setEditingType(null);
        }}
        onSubmit={handleTypeSubmit}
      />
      <WalletDetailsSheet
        wallet={details.wallet}
        walletType={details.type}
        resolvedWalletType={details.wallet ? walletTypes.find((type) => type.id === details.wallet?.typeId) ?? null : null}
        onClose={() => setDetails({ wallet: null, type: null })}
      />
      <WalletDeleteSheet
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}