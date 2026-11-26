"use client";

import {
  Check,
  CheckCircle2,
  LoaderCircle,
  Minus,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/providers/auth-provider";
import type { BranchInventoryPage } from "@/features/branches/types/branch-inventory";
import { listBranchInventory } from "@/features/branches/services/branch-inventory-service";
import { listBranchSalesmen } from "@/features/employees/services/employees-api-service";
import type { BranchSalesman } from "@/features/employees/types/employee";
import type { ProductListItem } from "@/features/products/types/product";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ApiClientError, ApiConfigurationError } from "@/lib/api-client";
import {
  confirmSale,
  isConfirmSaleOutcomeUnknown,
  processSale,
  type ProcessSaleResponse,
  type SaleLineItemRequest,
  type SalePaymentChoice,
} from "../services/sales-api-service";
import { ReceiptPresentation } from "./receipt-presentation";
import { ReceiptPrintDocument } from "./receipt-print-document";

type CreateSaleSheetProps = {
  open: boolean;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
  onSaleComplete: (receiptId: string) => void;
};

type WorkflowStep = "build" | "receipt" | "success";
type LookupState = "loading" | "ready" | "error";

const productLookupPageSize = 100;
const processSaleUncertainKey = "pos.sales.process-outcome-uncertain";

function mapInventoryProducts(
  items: BranchInventoryPage["items"],
): ProductListItem[] {
  return items.flatMap(({ productId }) =>
    productId
      ? [{
          _id: productId._id,
          productName: productId.productName,
          serialNumber: productId.serialNumber,
        }]
      : [],
  );
}

async function loadSaleProducts(
  token: string,
  branchId: string,
): Promise<ProductListItem[]> {
  const firstPage = await listBranchInventory(token, {
    page: 1,
    limit: productLookupPageSize,
    branchId,
  });
  const products = mapInventoryProducts(firstPage.items);

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await listBranchInventory(token, {
      page,
      limit: productLookupPageSize,
      branchId,
    });
    products.push(...mapInventoryProducts(result.items));
  }

  return products;
}

export function CreateSaleSheet({
  open,
  locale,
  onOpenChange,
  onSaleComplete,
}: CreateSaleSheetProps) {
  const t = useTranslations("saleWorkflow");
  const cashier = useTranslations("cashierDashboard");
  const currentLocale = useLocale();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [step, setStep] = useState<WorkflowStep>("build");
  const [salesmen, setSalesmen] = useState<BranchSalesman[]>([]);
  const [salesmenState, setSalesmenState] = useState<LookupState>("loading");
  const [salesmenError, setSalesmenError] = useState("");
  const [salesmenRetry, setSalesmenRetry] = useState(0);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsState, setProductsState] = useState<LookupState>("loading");
  const [productsError, setProductsError] = useState("");
  const [productsRetry, setProductsRetry] = useState(0);
  const [salesmanId, setSalesmanId] = useState("");
  const [lineItems, setLineItems] = useState<SaleLineItemRequest[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const [clientPhoneNumber, setClientPhoneNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [desiredSalePercentage, setDesiredSalePercentage] = useState("0");
  const [comments, setComments] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentChoice | "">("");
  const [processedSale, setProcessedSale] =
    useState<ProcessSaleResponse | null>(null);
  const [validationError, setValidationError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmOutcomeUncertain, setConfirmOutcomeUncertain] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [processOutcomeUncertain, setProcessOutcomeUncertain] = useState(false);
  const requestInFlight = useRef(false);

  const requestErrorMessage = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof ApiClientError && error.status === 401) {
        logout();
        router.replace("/login");
        return t("sessionExpired");
      }

      return error instanceof ApiClientError && error.message
        ? error.message
        : fallback;
    },
    [logout, router, t],
  );

  function showRequestError(error: unknown) {
    setOperationError(requestErrorMessage(error, t("operationError")));
  }

  useEffect(() => {
    if (!open || !token) return;

    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setSalesmenState("loading");
      setSalesmenError("");
      try {
        const result = await listBranchSalesmen(token);
        if (!active) return;
        setSalesmen(result);
        setSalesmenState("ready");
      } catch (error) {
        if (!active) return;
        setSalesmenError(requestErrorMessage(error, t("salesmenLoadError")));
        setSalesmenState("error");
      }
    });

    return () => {
      active = false;
    };
  }, [open, requestErrorMessage, salesmenRetry, t, token]);

  useEffect(() => {
    if (!open || !token || !user?.branchId) return;

    const branchId = user.branchId;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setProductsState("loading");
      setProductsError("");
      try {
        const result = await loadSaleProducts(token, branchId);
        if (!active) return;
        setProducts(result);
        setProductsState("ready");
      } catch (error) {
        if (!active) return;
        setProductsError(requestErrorMessage(error, t("productsLoadError")));
        setProductsState("error");
      }
    });

    return () => {
      active = false;
    };
  }, [open, productsRetry, requestErrorMessage, t, token, user?.branchId]);

  useEffect(() => {
    if (window.sessionStorage.getItem(processSaleUncertainKey) === "true") {
      // Preserve the process lock when a cashier closes and reopens this sheet.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProcessOutcomeUncertain(true);
    }
  }, []);

  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase();
  const matchingProducts = products.filter(
    (product) =>
      !normalizedProductSearch ||
      product.productName.toLocaleLowerCase().includes(normalizedProductSearch) ||
      product.serialNumber.toLocaleLowerCase().includes(normalizedProductSearch),
  );
  const selectedProduct = products.find(
    (product) => product._id === selectedProductId,
  );
  const selectedSalesman = salesmen.find(
    (salesman) => salesman._id === salesmanId,
  );
  const salesmenLoadState =
    open && !token ? "error" : salesmenState;
  const salesmenLoadError =
    open && !token ? t("sessionExpired") : salesmenError;
  const productsLoadState =
    open && (!token || !user?.branchId) ? "error" : productsState;
  const productsLoadError =
    open && !token
      ? t("sessionExpired")
      : open && !user?.branchId
        ? t("validation.employeeUnavailable")
        : productsError;

  function addLineItem() {
    const quantity = Number(quantityInput);

    if (!selectedProduct) {
      setValidationError(t("validation.productRequired"));
      return;
    }
    if (lineItems.some((item) => item.productId === selectedProduct._id)) {
      setValidationError(t("validation.duplicateProduct"));
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setValidationError(t("validation.quantityInvalid"));
      return;
    }

    setLineItems((items) => [
      ...items,
      {
        productId: selectedProduct._id,
        productQuantity: String(quantity),
      },
    ]);
    setSelectedProductId("");
    setProductSearch("");
    setQuantityInput("1");
    setValidationError("");
    setOperationError("");
  }

  function updateLineItem(index: number, productQuantity: string) {
    setLineItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, productQuantity } : item,
      ),
    );
    setValidationError("");
    setOperationError("");
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setValidationError("");
    setOperationError("");
  }

  async function handleProcessSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;
    if (
      processOutcomeUncertain ||
      window.sessionStorage.getItem(processSaleUncertainKey) === "true"
    ) {
      setProcessOutcomeUncertain(true);
      return;
    }

    if (!token || user?.role !== "cashier") {
      setValidationError(t("validation.employeeUnavailable"));
      return;
    }
    if (!salesmanId) {
      setValidationError(t("validation.salesmanRequired"));
      return;
    }
    if (salesmenLoadState !== "ready" || !selectedSalesman) {
      setValidationError(t("validation.salesmanUnavailable"));
      return;
    }
    if (!clientPhoneNumber.trim()) {
      setValidationError(t("validation.clientPhoneRequired"));
      return;
    }
    if (lineItems.length === 0) {
      setValidationError(t("validation.itemsRequired"));
      return;
    }
    if (productsLoadState !== "ready") {
      setOperationError(productsLoadError || t("productsLoadError"));
      return;
    }
    if (
      lineItems.some(
        (item) =>
          !item.productId.trim() ||
          !products.some((product) => product._id === item.productId),
      )
    ) {
      setValidationError(t("validation.productRequired"));
      return;
    }
    if (
      lineItems.some(
        (item) =>
          !Number.isInteger(Number(item.productQuantity)) ||
          Number(item.productQuantity) < 1,
      )
    ) {
      setValidationError(t("validation.quantityInvalid"));
      return;
    }

    requestInFlight.current = true;
    setIsProcessing(true);
    setValidationError("");
    setOperationError("");
    try {
      const result = await processSale(token, {
        employeeId: salesmanId,
        client_phone_number: clientPhoneNumber.trim(),
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          productQuantity: String(Number(item.productQuantity)),
        })),
      });
      setProcessedSale(result);
      setClientName(result.clientData.name ?? "");
      setClientPhoneNumber(result.clientData.phoneNumber);
      setStep("receipt");
    } catch (error) {
      const outcomeMayBeUnknown =
        error instanceof ApiClientError
          ? error.status === 0 || error.status >= 500
          : !(error instanceof ApiConfigurationError);
      if (outcomeMayBeUnknown) {
        setProcessOutcomeUncertain(true);
        window.sessionStorage.setItem(processSaleUncertainKey, "true");
      } else {
        showRequestError(error);
      }
    } finally {
      requestInFlight.current = false;
      setIsProcessing(false);
    }
  }

  async function handleConfirmSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      requestInFlight.current ||
      confirmOutcomeUncertain ||
      !processedSale?.receiptId.trim()
    ) {
      return;
    }

    if (!token || user?.role !== "cashier" || !salesmanId) {
      setValidationError(t("validation.employeeUnavailable"));
      return;
    }
    if (!clientPhoneNumber.trim()) {
      setValidationError(t("validation.clientPhoneRequired"));
      return;
    }
    if (!clientName.trim()) {
      setValidationError(t("validation.clientNameRequired"));
      return;
    }
    const percentage = Number(desiredSalePercentage);
    if (
      desiredSalePercentage.trim() === "" ||
      !Number.isFinite(percentage) ||
      percentage < 0
    ) {
      setValidationError(t("validation.discountInvalid"));
      return;
    }
    if (percentage > processedSale.allowed_sale_perc) {
      setValidationError(
        t("validation.discountTooHigh", {
          percentage: processedSale.allowed_sale_perc,
        }),
      );
      return;
    }
    if (!paymentMethod) {
      setValidationError(t("validation.paymentRequired"));
      return;
    }

    requestInFlight.current = true;
    setIsConfirming(true);
    setValidationError("");
    setOperationError("");
    try {
      await confirmSale(token, {
        receiptId: processedSale.receiptId,
        paymentMethod,
        desiredSalePercentage: desiredSalePercentage.trim(),
        clientData: {
          name: clientName.trim(),
          phoneNumber: clientPhoneNumber.trim(),
        },
        ...(comments.trim() ? { comments: comments.trim() } : {}),
      });
      setStep("success");
    } catch (error) {
      if (isConfirmSaleOutcomeUnknown(error)) {
        setConfirmOutcomeUncertain(true);
        setOperationError("");
      } else {
        showRequestError(error);
      }
    } finally {
      requestInFlight.current = false;
      setIsConfirming(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step === "build") {
      void handleProcessSale(event);
    } else if (step === "receipt") {
      void handleConfirmSale(event);
    } else {
      event.preventDefault();
    }
  }

  function resetWorkflow() {
    setStep("build");
    setSalesmanId("");
    setLineItems([]);
    setProductSearch("");
    setSelectedProductId("");
    setQuantityInput("1");
    setClientPhoneNumber("");
    setClientName("");
    setDesiredSalePercentage("0");
    setComments("");
    setPaymentMethod("");
    setProcessedSale(null);
    setValidationError("");
    setOperationError("");
    setShowDiscardConfirmation(false);
  }

  function hasUnsavedSale() {
    return (
      lineItems.length > 0 ||
      Boolean(clientPhoneNumber.trim()) ||
      Boolean(productSearch.trim()) ||
      Boolean(selectedProductId) ||
      quantityInput !== "1" ||
      Boolean(clientName.trim()) ||
      Boolean(comments.trim()) ||
      desiredSalePercentage !== "0" ||
      Boolean(paymentMethod) ||
      Boolean(salesmanId) ||
      step === "receipt"
    );
  }

  function handleClose(nextOpen: boolean, discardConfirmed = false) {
    if (requestInFlight.current) return;
    if (step === "receipt" && confirmOutcomeUncertain) return;
    if (!nextOpen) {
      if (
        !discardConfirmed &&
        step !== "success" &&
        hasUnsavedSale()
      ) {
        setShowDiscardConfirmation(true);
        return;
      }
      if (step === "success" && processedSale) {
        onSaleComplete(processedSale.receiptId);
      }
      resetWorkflow();
    }
    onOpenChange(nextOpen);
  }

  function handleDone() {
    handleClose(false, true);
  }

  function handleRejectSale() {
    if (requestInFlight.current || confirmOutcomeUncertain) return;
    setValidationError("");
    setOperationError(t("rejectUnavailable"));
  }

  const validationText = validationError;
  const isReceiptStep = step === "receipt";
  const isResultStep = step === "success";
  const currentStep = isReceiptStep || isResultStep ? 2 : 1;
  const salesmanName = selectedSalesman?.name ?? t("notAvailable");
  const discountTooHighMessage = processedSale
    ? t("validation.discountTooHigh", {
        percentage: processedSale.allowed_sale_perc,
      })
    : "";
  const buildInlineValidationMessages = [
    t("validation.employeeUnavailable"),
    t("validation.salesmanRequired"),
    t("validation.salesmanUnavailable"),
    t("validation.clientPhoneRequired"),
    t("validation.productRequired"),
    t("validation.duplicateProduct"),
    t("validation.quantityInvalid"),
  ];
  const confirmInlineValidationMessages = [
    t("validation.clientPhoneRequired"),
    t("validation.clientNameRequired"),
    t("validation.discountInvalid"),
    discountTooHighMessage,
    t("validation.paymentRequired"),
  ];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => handleClose(nextOpen)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          dir={currentLocale === "ar" ? "rtl" : "ltr"}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-popover text-sm text-popover-foreground shadow-2xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]"
        >
        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="relative shrink-0 border-b border-border p-5 pe-14 sm:p-6 sm:pe-14">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={cashier("actions.close")}
              title={cashier("actions.close")}
              onClick={() => handleClose(false)}
              disabled={
                isProcessing || isConfirming || confirmOutcomeUncertain
              }
              className="absolute end-3 top-3"
            >
              <X aria-hidden="true" />
            </Button>
            <Dialog.Title className="font-heading text-lg font-semibold text-foreground">
              {step === "build"
                ? t("title")
                : step === "receipt"
                  ? t("receipt.title")
                  : t("result.successTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {step === "build" ? t("description") : t("receipt.description")}
            </Dialog.Description>
          </header>

          <ol
            aria-label={t("steps.label")}
            className="grid shrink-0 grid-cols-2 gap-3 border-b border-border px-5 py-4 sm:px-6"
          >
            {(["process", "confirm"] as const).map((stepName, index) => {
              const isComplete = currentStep > index + 1 || isResultStep;
              const isCurrent = currentStep === index + 1 && !isResultStep;
              return (
                <li
                  key={stepName}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-w-0 items-center gap-2 text-sm ${
                    isCurrent
                      ? "font-semibold text-primary"
                      : isComplete
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-current text-xs">
                    {isComplete ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="truncate">{t(`steps.${stepName}`)}</span>
                </li>
              );
            })}
          </ol>

          {step === "build" ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="sale-salesman" className="text-sm font-medium">
                    {t("salesman")}
                  </label>
                  <select
                    id="sale-salesman"
                    value={salesmanId}
                    onChange={(event) => {
                      setSalesmanId(event.currentTarget.value);
                      setValidationError("");
                    }}
                    disabled={isProcessing || salesmenLoadState !== "ready"}
                    aria-required="true"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  >
                    <option value="">{t("selectSalesman")}</option>
                    {salesmen.map((salesman) => (
                      <option key={salesman._id} value={salesman._id}>
                        {salesman.name} — {salesman.email}
                      </option>
                    ))}
                  </select>
                  {salesmenLoadState === "loading" && (
                    <p role="status" className="text-sm text-muted-foreground">
                      {t("salesmenLoading")}
                    </p>
                  )}
                  {salesmenLoadState === "error" && (
                    <div className="flex items-center justify-between gap-3">
                      <p role="alert" className="text-sm text-destructive">
                        {salesmenLoadError}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSalesmenRetry((count) => count + 1)}
                      >
                        {t("actions.retry")}
                      </Button>
                    </div>
                  )}
                  {salesmenLoadState === "ready" && salesmen.length === 0 && (
                    <p role="status" className="text-sm text-muted-foreground">
                      {t("salesmenEmpty")}
                    </p>
                  )}
                  {validationError &&
                    [
                      t("validation.employeeUnavailable"),
                      t("validation.salesmanRequired"),
                      t("validation.salesmanUnavailable"),
                    ].includes(validationError) && (
                      <p role="alert" className="text-sm text-destructive">
                        {validationError}
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="sale-client-phone" className="text-sm font-medium">
                    {t("clientPhone")}
                  </label>
                  <Input
                    id="sale-client-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={clientPhoneNumber}
                    disabled={isProcessing}
                    onChange={(event) => {
                      setClientPhoneNumber(event.currentTarget.value);
                      setValidationError("");
                      setOperationError("");
                    }}
                    aria-required="true"
                  />
                  {validationError === t("validation.clientPhoneRequired") && (
                    <p role="alert" className="text-sm text-destructive">
                      {validationError}
                    </p>
                  )}
                </div>
              </div>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold">{t("productSelect")}</h2>
                <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                  <div className="space-y-2">
                    <label htmlFor="sale-product-search" className="text-sm font-medium">
                      {t("productSearch")}
                    </label>
                    <Input
                      id="sale-product-search"
                      dir="ltr"
                      value={productSearch}
                      disabled={isProcessing || productsLoadState !== "ready"}
                      placeholder={t("productSearchPlaceholder")}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      onChange={(event) => {
                        setProductSearch(event.currentTarget.value);
                        setSelectedProductId("");
                        setValidationError("");
                        setOperationError("");
                      }}
                    />
                    <label htmlFor="sale-product-select" className="sr-only">
                      {t("productSelect")}
                    </label>
                    <select
                      id="sale-product-select"
                      value={selectedProductId}
                      disabled={
                        isProcessing ||
                        productsLoadState !== "ready" ||
                        matchingProducts.length === 0
                      }
                      onChange={(event) => {
                        setSelectedProductId(event.currentTarget.value);
                        setValidationError("");
                        setOperationError("");
                      }}
                      aria-required="true"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    >
                      <option value="">{t("selectProduct")}</option>
                      {matchingProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.productName} — {product.serialNumber}
                        </option>
                      ))}
                    </select>
                    {productsLoadState === "loading" && (
                      <p role="status" className="text-sm text-muted-foreground">
                        {t("productsLoading")}
                      </p>
                    )}
                    {productsLoadState === "error" && (
                      <div className="flex items-center justify-between gap-3">
                        <p role="alert" className="text-sm text-destructive">
                          {productsLoadError}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setProductsRetry((count) => count + 1)}
                        >
                          {t("actions.retry")}
                        </Button>
                      </div>
                    )}
                    {productsLoadState === "ready" && products.length === 0 && (
                      <p role="status" className="text-sm text-muted-foreground">
                        {t("productsEmpty")}
                      </p>
                    )}
                    {productsLoadState === "ready" &&
                      products.length > 0 &&
                      matchingProducts.length === 0 && (
                        <p role="status" className="text-sm text-muted-foreground">
                          {t("productNoMatches")}
                        </p>
                      )}
                    {validationError &&
                      [
                        t("validation.productRequired"),
                        t("validation.duplicateProduct"),
                      ].includes(validationError) && (
                        <p role="alert" className="text-sm text-destructive">
                          {validationError}
                        </p>
                      )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="sale-product-quantity" className="text-sm font-medium">
                      {t("productQuantity")}
                    </label>
                    <Input
                      id="sale-product-quantity"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={quantityInput}
                      disabled={isProcessing}
                      onChange={(event) => {
                        setQuantityInput(event.currentTarget.value);
                        setValidationError("");
                        setOperationError("");
                      }}
                    />
                    {validationError === t("validation.quantityInvalid") && (
                      <p role="alert" className="text-sm text-destructive">
                        {validationError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={addLineItem}
                    disabled={isProcessing || productsLoadState !== "ready"}
                  >
                    <Plus aria-hidden="true" />
                    {t("addLineItem")}
                  </Button>
                </div>
              </section>

              {validationText &&
                !buildInlineValidationMessages.includes(validationText) && (
                <p role="alert" className="text-sm text-destructive">
                  {validationText}
                </p>
                )}
              {operationError && (
                <p role="alert" className="text-sm text-destructive">
                  {operationError}
                </p>
              )}
              {processOutcomeUncertain && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {t("processOutcomeUncertain")}
                </p>
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">{t("cartTitle")}</h2>
                  <span className="text-xs text-muted-foreground">
                    {t("cartCount", { count: lineItems.length })}
                  </span>
                </div>
                {lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {lineItems.map((item, index) => {
                      const product = products.find(
                        (candidate) => candidate._id === item.productId,
                      );
                      const productSerialNumber =
                        product?.serialNumber ?? item.productId;
                      const quantity = Number(item.productQuantity);
                      const quantityValid =
                        Number.isInteger(quantity) && quantity >= 1;
                      return (
                        <Card
                          key={item.productId}
                          className="gap-3 p-4"
                        >
                          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
                            <div className="min-w-0 space-y-1">
                              <p className="break-words text-sm font-medium">
                                {product?.productName ?? t("notAvailable")}
                              </p>
                              <p dir="ltr" className="break-all text-xs text-muted-foreground">
                                {productSerialNumber}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t("actions.decreaseNamed", {
                                  serialNumber: productSerialNumber,
                                })}
                                disabled={
                                  isProcessing || !quantityValid || quantity <= 1
                                }
                                onClick={() =>
                                  updateLineItem(index, String(quantity - 1))
                                }
                              >
                                <Minus aria-hidden="true" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                aria-label={t("quantityNamed", {
                                  serialNumber: productSerialNumber,
                                })}
                                value={item.productQuantity}
                                disabled={isProcessing}
                                onChange={(event) =>
                                  updateLineItem(index, event.currentTarget.value)
                                }
                                className="h-8 w-20 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t("actions.increaseNamed", {
                                  serialNumber: productSerialNumber,
                                })}
                                disabled={isProcessing || !quantityValid}
                                onClick={() =>
                                  updateLineItem(index, String(quantity + 1))
                                }
                              >
                                <Plus aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("actions.removeNamed", {
                                  serialNumber: productSerialNumber,
                                })}
                                onClick={() => removeLineItem(index)}
                                disabled={isProcessing}
                                className="text-destructive"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </CardContent>
                          {!quantityValid && (
                            <p role="alert" className="text-xs text-destructive">
                              {t("validation.quantityInvalid")}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border px-5 text-center">
                    <p className="text-sm font-medium">{t("empty.cartTitle")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("empty.cartDescription")}
                    </p>
                  </div>
                )}
              </section>
            </div>
          ) : isReceiptStep ? (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              {validationText &&
                !confirmInlineValidationMessages.includes(validationText) && (
                <p role="alert" className="text-sm text-destructive">
                  {validationText}
                </p>
                )}
              {operationError && (
                <p role="alert" className="text-sm text-destructive">
                  {operationError}
                </p>
              )}
              {confirmOutcomeUncertain && processedSale && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {t("confirmOutcomeUncertain", {
                    receiptId: processedSale.receiptId,
                  })}
                </p>
              )}
              {processedSale && (
                <>
                  <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("salesman")}
                      </dt>
                      <dd className="break-words text-sm">{salesmanName}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("clientName")}
                      </dt>
                      <dd className="break-words text-sm">
                        {clientName || processedSale.clientData.name || t("notAvailable")}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("clientPhone")}
                      </dt>
                      <dd dir="ltr" className="break-words text-sm">
                        {clientPhoneNumber || processedSale.clientData.phoneNumber}
                      </dd>
                    </div>
                  </dl>
                  <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                    {t("allowedDiscount", {
                      percentage: processedSale.allowed_sale_perc,
                    })}
                  </p>
                  <div className="min-w-0 overflow-x-auto">
                    <ReceiptPresentation
                      receipt={{
                        referenceNumber: processedSale.receiptId,
                        totalLabel: t("receipt.receiptPrice"),
                        items: processedSale.items.map((item) => ({
                          productName: item.productName,
                          serialNumber: item.productSerialNumber,
                          quantity: item.productQuantity,
                          unitPrice: item.productPrice,
                          lineTotal: item.total,
                        })),
                        totalAmount: processedSale.receiptPrice,
                      }}
                      locale={locale}
                      paymentMethodControl={
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label
                              htmlFor="sale-client-name"
                              className="text-sm font-medium"
                            >
                              {t("clientName")}
                            </label>
                            <Input
                              id="sale-client-name"
                              value={clientName}
                              disabled={isConfirming || confirmOutcomeUncertain}
                              onChange={(event) => {
                                setClientName(event.currentTarget.value);
                                setValidationError("");
                                setOperationError("");
                              }}
                              aria-required="true"
                            />
                            {validationError ===
                              t("validation.clientNameRequired") && (
                              <p role="alert" className="text-sm text-destructive">
                                {validationError}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="sale-client-phone-confirm"
                              className="text-sm font-medium"
                            >
                              {t("clientPhone")}
                            </label>
                            <Input
                              id="sale-client-phone-confirm"
                              type="tel"
                              inputMode="tel"
                              value={clientPhoneNumber}
                              disabled={isConfirming || confirmOutcomeUncertain}
                              onChange={(event) => {
                                setClientPhoneNumber(event.currentTarget.value);
                                setValidationError("");
                                setOperationError("");
                              }}
                              aria-required="true"
                            />
                            {validationError ===
                              t("validation.clientPhoneRequired") && (
                              <p role="alert" className="text-sm text-destructive">
                                {validationError}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="sale-desired-percentage"
                              className="text-sm font-medium"
                            >
                              {t("desiredDiscount")}
                            </label>
                            <Input
                              id="sale-desired-percentage"
                              type="number"
                              min="0"
                              step="any"
                              inputMode="decimal"
                              value={desiredSalePercentage}
                              disabled={isConfirming || confirmOutcomeUncertain}
                              onChange={(event) => {
                                setDesiredSalePercentage(event.currentTarget.value);
                                setValidationError("");
                              }}
                            />
                            {(validationError ===
                              t("validation.discountInvalid") ||
                              validationError === discountTooHighMessage) && (
                              <p role="alert" className="text-sm text-destructive">
                                {validationError}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="sale-payment-method"
                              className="text-sm font-medium"
                            >
                              {t("paymentMethod")}
                            </label>
                            <select
                              id="sale-payment-method"
                              value={paymentMethod}
                              disabled={isConfirming || confirmOutcomeUncertain}
                              onChange={(event) => {
                                const value = event.currentTarget.value;
                                setPaymentMethod(
                                  value === "cash" || value === "wallet"
                                    ? value
                                    : "",
                                );
                                setValidationError("");
                              }}
                              aria-required="true"
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                            >
                              <option value="">{t("selectPaymentMethod")}</option>
                              <option value="cash">
                                {cashier("paymentMethods.cash")}
                              </option>
                              <option value="wallet">
                                {cashier("paymentMethods.wallet")}
                              </option>
                            </select>
                            {validationError ===
                              t("validation.paymentRequired") && (
                              <p role="alert" className="text-sm text-destructive">
                                {validationError}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <label
                              htmlFor="sale-comments"
                              className="text-sm font-medium"
                            >
                              {t("comments")}
                            </label>
                            <textarea
                              id="sale-comments"
                              value={comments}
                              disabled={isConfirming || confirmOutcomeUncertain}
                              onChange={(event) =>
                                setComments(event.currentTarget.value)
                              }
                              rows={3}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                            />
                          </div>
                        </div>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-8 text-center sm:p-12">
              <CheckCircle2
                aria-hidden="true"
                className="size-16 text-emerald-600 dark:text-emerald-400"
              />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {t("result.successTitle")}
                </h2>
                <p className="text-muted-foreground">
                  {t("result.successMessage")}
                </p>
                {processedSale && (
                  <p dir="ltr" className="font-mono text-sm text-muted-foreground">
                    {processedSale.receiptId}
                  </p>
                )}
              </div>
            </div>
          )}

          {!isResultStep && (
            <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-popover p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              {isReceiptStep ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("build");
                      setValidationError("");
                      setOperationError("");
                    }}
                    disabled={isConfirming || confirmOutcomeUncertain}
                  >
                    {t("actions.backToEdit")}
                  </Button>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleRejectSale}
                      disabled={isConfirming || confirmOutcomeUncertain}
                    >
                      {t("actions.rejectSale")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isConfirming ||
                        confirmOutcomeUncertain ||
                        !processedSale?.receiptId.trim()
                      }
                      aria-busy={isConfirming}
                    >
                      {isConfirming ? (
                        <>
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-4 animate-spin"
                          />
                          {t("states.confirming")}
                        </>
                      ) : (
                        t("actions.confirmPayment")
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                    disabled={isProcessing}
                  >
                    {t("actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing || processOutcomeUncertain}
                  >
                    {isProcessing
                      ? t("states.processing")
                      : t("actions.showReceipt")}
                  </Button>
                </>
              )}
            </footer>
          )}
        </form>
        {isResultStep && (
          <footer className="shrink-0 border-t border-border bg-popover p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Printer aria-hidden="true" />
                {cashier("receipts.print")}
              </Button>
              <Button
                type="button"
                onClick={handleDone}
                variant={step === "success" ? "default" : "destructive"}
              >
                {t("actions.done")}
              </Button>
            </div>
          </footer>
        )}
        {showDiscardConfirmation && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/80 p-5 backdrop-blur-sm">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="sale-discard-title"
              aria-describedby="sale-discard-description"
              className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-popover p-5 shadow-xl"
            >
              <div className="space-y-1">
                <h2 id="sale-discard-title" className="font-semibold">
                  {t("discard.title")}
                </h2>
                <p
                  id="sale-discard-description"
                  className="text-sm text-muted-foreground"
                >
                  {t("discard.description")}
                </p>
              </div>
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDiscardConfirmation(false)}
                >
                  {t("discard.keepEditing")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleClose(false, true)}
                >
                  {t("discard.discard")}
                </Button>
              </div>
            </section>
          </div>
        )}
        </Dialog.Popup>
        {isResultStep && processedSale && (
          <ReceiptPrintDocument
            locale={locale}
            receipt={{
              referenceNumber: processedSale.receiptId,
              salesmanName: selectedSalesman?.name,
              clientName: clientName.trim() || processedSale.clientData.name,
              clientPhoneNumber:
                clientPhoneNumber.trim() || processedSale.clientData.phoneNumber,
              paymentMethod: paymentMethod || undefined,
              comments: comments.trim() || undefined,
              subtotal: processedSale.receiptPrice,
              items: processedSale.items.map((item) => ({
                productName: item.productName,
                serialNumber: item.productSerialNumber,
                quantity: item.productQuantity,
                unitPrice: item.productPrice,
                lineTotal: item.total,
              })),
            }}
          />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
