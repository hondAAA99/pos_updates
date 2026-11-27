# Sales Operations Frontend Integration Report

## A. Current Architecture

The cashier's create-sale entry point is the cashier dashboard. The localized
sales route renders the separate sales-management screen:

- `src/app/[locale]/(app)/cashier/dashboard/page.tsx` renders
  `CashierDashboard`.
- `src/features/dashboard/components/cashier-dashboard.tsx` opens
  `CreateSaleSheet` and displays a success feedback message when the sheet
  reports a completed sale.
- `src/features/sales/components/create-sale-sheet.tsx` owns the interactive
  two-step workflow: build a sale, call Process Sale, preview the returned
  receipt, then call Confirm Sale.
- `src/features/sales/components/receipt-presentation.tsx` presents the
  process response in the confirmation step. It is also reused by
  `src/features/dashboard/components/cashier-receipt-details-sheet.tsx`.
- `src/features/sales/services/sales-api-service.ts` defines the process and
  confirm request/response types and wraps those POST calls with `apiClient`.
- `src/lib/api-client.ts` builds the configured API URL, serializes JSON,
  attaches the authorization header, and turns non-2xx responses into
  `ApiClientError`.
- `src/features/auth/providers/auth-provider.tsx` exposes the current user and
  token through `useAuth()`. `src/features/auth/services/auth-api.ts` handles
  token storage and JWT payload decoding.

The operations form is not wired to the existing product or employee list
services. In particular, `CreateSaleSheet` collects a product serial number
directly instead of looking up a product record. The cashier dashboard's
receipts/KPIs remain mock-backed. The separate Sales Management screen now uses
the receipt API for listing, details, edits, and deletes.

There are also older domain structures in `src/features/sales/types/sale.ts`
and mock workflow functions in `src/features/sales/services/sales-service.ts`.
Those functions calculate local quotes, check mock stock, and create local
receipt records; the current `CreateSaleSheet` does not call them. The
sales-management screen no longer calls that service for receipt data.

### Sales Records management — current implementation

The Sales Management screen uses `listReceiptDocuments`, `searchReceipt`,
`getReceiptDetails`, `updateReceipt`, and `deleteReceipt` from
`src/features/sales/services/sales-api-service.ts`. The API client uses the
configured base URL and sends the raw JWT in `Authorization`.

- Listing is server-paginated and displays `receiptNumber`; `_id` is retained
  only for detail, update, and delete requests.
- Admins can list all branches or select one; branch names are resolved using
  the existing branch API. Cashiers are scoped by the backend.
- Status filtering uses only `pending`, `paid`, and `canceled`.
- The `dateFrom` and `dateTo` controls send their date strings directly as
  `dateFrom` and `dateTo`; the updated backend DTO accepts both keys.
- Admin receipt-number search calls
  `GET /sales/receipts/search?receiptNumber=...`. The backend performs exact,
  case-sensitive matching and returns one receipt, so active branch, status,
  and date filters are applied to that single result in the UI.
- Receipt search is unavailable to cashiers because the new search endpoint
  does not scope its lookup to the authenticated user's branch. This avoids
  using an unscoped receipt lookup as a cashier.
- Details are fetched only after View. The backend returns `lineItems` with
  `quantity`, `unitPriceAtSale`, `lineTotal`, and `productName`; it removes the
  saved serial-number snapshot, so the frontend cannot display a
  `serialNumber` from this response.
- Edit and delete controls are admin-only. The edit form sends changed fields,
  plus the current `branchId` because the backend service requires it even
  though the DTO marks that field optional.
- The backend list does not populate `branchId`, so the screen resolves branch
  names from the branch API. Employee and cashier names come from populated
  list references.

Known backend limitations affecting this screen:

- Receipt-number search is exact and case-sensitive, not partial or
  case-insensitive.
- The search endpoint does not apply the authenticated user's branch scope;
  frontend search is therefore admin-only until the backend scopes this lookup.
- List date bounds are sent as date-only strings. Verify how the backend/MongoDB
  interprets `dateTo` against timestamps; a date-only upper bound may exclude
  receipts later on that day.
- The details endpoint omits line-item serial-number snapshots.
- Delete is scoped to the authenticated admin's branch, while admins can list
  receipts from all branches. Deleting a receipt from another branch can
  therefore fail.
- The PATCH service requires a valid `branchId`, regardless of other changed
  fields.

## B. Process Sale — Current Implementation

1. A cashier opens the sheet from `CashierDashboard`.
2. `CreateSaleSheet` initializes the salesman ID from `user?.id`, the client
   phone and cart as empty, and each new quantity as `"1"`.
3. The form accepts one manually entered product serial number and integer
   quantity at a time. `addLineItem` rejects blank serials, duplicate serial
   strings, and quantities below one or not integral. The cart allows quantity
   edits and removal.
4. On submit, `handleProcessSale` checks for a token, cashier role, branch ID,
   an employee ID, a nonblank client phone, at least one line item, and valid
   quantities. The only salesman choice rendered is the authenticated user's
   own ID; the handler also rejects any ID different from `user.id`.
5. It calls `processSale(token, request)`. The request uses the current
   salesman ID and phone, and maps each cart entry to
   `{ productSerialNumber, productQuantity }`. Quantity is normalized and
   sent as a string.
6. On success it stores the `ProcessSaleResponse`, fills client name and phone
   from `clientData`, and moves to the receipt/confirmation step. The receipt
   is rendered using the backend's receipt ID, items, price, and totals.

**Product ID source:** None is obtained for this live workflow. The input is a
serial number, it is not resolved through `listProductItems` or `getProduct`,
and the request type and body use `productSerialNumber`. `ProductDetail` does
have an `_id` and `serialNumber`, and `products-service.ts` has authenticated
product-list/detail API functions, but the create-sale component does not
import or call them. The mock `listSaleProducts`/`getSaleProductOption`
functions use mock product and stock data and are likewise not called here.

**Client information:** The Process Sale step collects a required phone number
but not a name. The name is populated from the optional process response, then
can be entered or edited in the confirmation step. Phone validation checks
only that the trimmed value is nonempty; it does not validate international
format.

## C. Confirm Sale — Current Implementation

After Process Sale succeeds, the component renders the receipt preview and
confirmation controls. The receipt ID comes directly from
`processedSale.receiptId`; `allowed_sale_perc` from the process response is
displayed to the user. The user can set a desired discount, choose a payment
method, enter comments, and edit client name/phone.

`handleConfirmSale` validates the process result exists, token/cashier/branch
state, cashier ID, client name and phone, a nonnegative finite discount, and a
selected payment method. It does **not** compare the discount to
`processedSale.allowed_sale_perc`. It calls `confirmSale` with the stored
receipt ID, discount string, client data, and trimmed comments. The API service
converts the component choice `"cash"` to `"CASH"` and `"wallet"` to
`"E-PAYMENT"`.

On a successful response, the sheet transitions to a local success screen.
When the user closes that screen, it passes the receipt ID to the dashboard,
which displays a success message. The dashboard does not reload its mock
receipts or totals as part of this callback.

The separate `handleRejectSale` action only changes the local UI to a rejected
state; it makes no backend request. Its accompanying translation is explicitly
described as a mock note.

The confirmation handler has no automatic retry loop, which is good, but it
does not enforce the required “submit only once per receipt” safety rule. A
request-in-flight ref prevents concurrent submissions, and the button is
disabled while a request is pending. However, after any caught error—including
a timeout—the ref is reset, the receipt step remains active, and the confirm
button becomes available again. A user can submit the same receipt again
without first checking receipt or inventory state. There is no idempotency key,
timeout-specific state, or receipt-status verification in this flow.

## D. API Contract Compatibility

The API paths below are passed to `apiClient` as `/sales/process` and
`/sales/confirm`. The client appends paths to
`NEXT_PUBLIC_API_BASE_URL`; those resolve to the requested full endpoints only
when that configured base URL includes the `/api/v1` prefix.

### Process Sale request

| Contract field | Current frontend | Status |
|---|---|---|
| Method and endpoint `POST /api/v1/sales/process` | `processSale` calls `apiClient.post("/sales/process", ...)`; final URL depends on configured base URL. | **Unclear / requires verification** |
| Authorization: raw JWT in `Authorization` | API service passes `token`; `apiClient` sets `Authorization` to that exact value without prepending an authorization scheme. | **Already supported** |
| No `branchId` in body; backend derives branch from token | No branch ID is added to the process request body. The UI does require `user.branchId` locally. | **Already supported** |
| `employeeId` | Sent from `salesmanId`, initialized to authenticated cashier's `user.id`; only that user can be selected. | **Already supported**, if backend `employeeId` means the authenticated cashier; otherwise **unclear** |
| `client_phone_number` | Same snake-case property is sent from the required phone input. | **Already supported** |
| `lineItems` | Array is sent. | **Already supported** |
| `lineItems[].productId` | Current type/body uses `productSerialNumber`; no serial-to-ID lookup occurs. | **Requires modification** |
| `lineItems[].productQuantity` as a string | Quantity is normalized and converted to `String(...)`. | **Already supported** |
| Repeated entries for one product combined by backend | UI rejects duplicate serial strings rather than combining them. This is not equivalent to grouping by product ID. | **Requires modification** if duplicate product entries can be produced |

### Process Sale response

| Contract field | Current frontend | Status |
|---|---|---|
| HTTP 201 response | Typed response is parsed for any successful status; the component does not explicitly check that status is 201. | **Unclear / requires verification** |
| `receiptId` | Present in `ProcessSaleResponse`, stored, previewed, and later passed to confirm. | **Already supported** |
| `items[]` | Typed and mapped to receipt rows. | **Already supported** |
| `items[].productName` | Typed and shown. | **Already supported** |
| `items[].productSerialNumber` | Typed and shown as the receipt serial number. | **Already supported** |
| `items[].productPrice` (number) | Typed as number and mapped to unit price. | **Already supported** |
| `items[].productQuantity` (number) | Typed as number and mapped to quantity. | **Already supported** |
| `items[].total` (number) | Typed as number and mapped to line total. | **Already supported** |
| `receiptPrice` (number) | Typed and displayed as the receipt total. | **Already supported** |
| `allowed_sale_perc` (number) | Typed and displayed; not used to constrain confirmation input. | **Requires modification** for enforcement |
| `clientData.name` (possibly missing) | Type is optional; component falls back to empty string and requires an entered name at confirmation. | **Already supported** |
| `clientData.phoneNumber` | Typed and copied into the phone state. | **Already supported** |

### Confirm Sale request and response

| Contract field | Current frontend | Status |
|---|---|---|
| Method and endpoint `POST /api/v1/sales/confirm` | `confirmSale` calls `apiClient.post("/sales/confirm", ...)`; final URL depends on configured base URL. | **Unclear / requires verification** |
| Authorization: raw JWT in `Authorization` | Uses the same raw-token API-client behavior as Process Sale. | **Already supported** |
| `receiptId` from Process Sale response | Uses `processedSale.receiptId`. | **Already supported** |
| `paymentMethod: "CASH" \| "E-PAYMENT"` | Component choices are `"cash"`/`"wallet"` and service maps them to the required uppercase values. | **Already supported**, though “wallet” is a UI label rather than the contract term “E-PAYMENT” |
| `desiredSalePercentage` as string | Component state and request type are strings; trimmed string is sent. | **Already supported** |
| Discount not above `allowed_sale_perc` | UI checks only finite and nonnegative; does not enforce the process response cap. | **Requires modification** |
| `clientData.name` | Collected and sent as a trimmed string. | **Already supported** |
| `clientData.phoneNumber` | Contract uses camel case; frontend request type/body sends `clientData.phone_number`. | **Requires modification** |
| `comments` (optional) | The UI sends a string, including `""` when blank. | **Already supported**; confirm whether backend accepts empty string |
| HTTP 201 response `{ "message": "operation succeed" }` | Typed as `{ message: string }`; component awaits but does not inspect the message or status code. | **Unclear / requires verification** |
| One confirmation submission per receipt; no timeout retry | No automatic retry exists, but an error re-enables manual resubmission without a receipt-state check. | **Requires modification** |

## E. Authentication

`AuthProvider.login` calls `loginWithBackend`, receives the JWT, builds a user
profile from its decoded payload, persists both token and user, and puts them
in React context. The token is stored in browser `localStorage` under
`pos.auth-token`; the user is stored under `pos.auth-user`. A separate
`pos_session` cookie stores only the role for route middleware and is not the
API authorization token.

On app initialization, `AuthProvider` retrieves the token with
`getStoredAuthToken`, decodes its claims to restore the user (including
`userId`/`sub`/`_id`/`id`, role, and optional `branchId`), and exposes both via
`useAuth()`. `CreateSaleSheet` passes `token` to `processSale` and
`confirmSale`; those functions pass it to `apiClient`.

`requestJson` sets `requestHeaders.set("Authorization", token)` directly. It
does not prepend an authorization scheme, so the outgoing header value is the
raw token, as required. This confirms the header construction in frontend
code; a live network request was not made during this source inspection. On a
401, the API client dispatches the rejected-session event and the sheet also
displays a session-expired message, logs out, and routes to login.

## F. Error and Loading States

- **Process loading:** `isProcessing` drives button labels and disables process
  inputs. A shared `requestInFlight` ref suppresses concurrent process or
  confirm handler calls.
- **Confirm loading:** `isConfirming` changes the button label and disables
  confirmation controls and close/reject actions while the request is pending.
- **Client validation:** The sheet displays translated inline errors for
  missing salesman, phone, serial, name, invalid quantity/discount, duplicate
  serial, missing items, and missing payment. There is no phone-format check,
  allowed-discount cap check, or client-side product existence/stock check.
- **Server/network errors:** `showRequestError` displays an `ApiClientError`
  message when available, otherwise a generic translated operation error.
  401s trigger logout and navigation to login. Validation/request errors are
  cleared when relevant inputs change.
- **Success:** Confirm success changes the view to a success state and the
  dashboard shows a local feedback string. The backend response message is
  not otherwise used, and dashboard data is not reloaded.
- **Duplicate submissions:** Concurrent submissions are blocked, but the lock
  is always cleared in `finally`. There is no persistent confirmed/unknown
  state. In particular, a confirmation timeout can be followed by a manual
  second POST against the same receipt without a state check.
- **Discard/rejection:** Closing a nonempty in-progress form prompts for
  discard. The reject action is local-only; it does not reject or cancel the
  server-created pending receipt.
- **Other views:** Sales-management and cashier-dashboard loading/error/retry
  UI exists, but those screens call local mock services and do not represent
  live loading/error behavior for these two sales endpoints.

## G. Required Changes

The following are the exact existing implementation files to update for a
contract-compatible integration:

1. `src/features/sales/services/sales-api-service.ts`
   - Change the process line-item type to `productId` and ensure the request
     body sends that field.
   - Change confirmation `clientData.phone_number` to `phoneNumber`.
   - Keep the existing uppercase backend payment mapping, but align the
     exposed UI choice/label with the supported `CASH` and `E-PAYMENT` options.
   - Consider modeling the contract response/status explicitly if the app must
     enforce HTTP 201 rather than accepting any 2xx.
2. `src/features/sales/components/create-sale-sheet.tsx`
   - Replace raw serial entry with product lookup/selection that carries the
     actual product `_id` into each line item; prevent or combine repeated
     product IDs consistently with the backend behavior.
   - Enforce the requested percentage `<= processedSale.allowed_sale_perc`.
   - Submit camel-case `clientData.phoneNumber`.
   - Make confirmation outcome ambiguous after timeout/non-response and block
     another confirm attempt until the receipt/inventory state has been
     checked. Do not automatically retry the confirmation POST. Consider
     equivalent protection against a second Process Sale if its outcome is
     unknown, since that could create another pending receipt.
   - Clarify whether the selected employee should be the authenticated cashier
     or an independently selectable salesperson. If it is another employee,
     the current self-only selector and `user.id` equality validation must
     change.
3. `src/features/products/services/products-service.ts` (only if needed by
   the product-picker design)
   - Existing authenticated `listProductItems`/`getProduct` already expose
     product `_id`, name, and serial. The sale UI can use them; add or adjust
     an API method only if the existing pagination/detail responses are
     insufficient. No change is required merely to send the `productId` once
     the UI has resolved it.

The cashier dashboard still uses mock receipt and KPI data and does not
refresh from completed API receipts. That separate behavior can be integrated
independently by updating:

- `src/features/dashboard/services/cashier-dashboard-service.ts` and
  `src/features/dashboard/components/cashier-dashboard.tsx` to load live
  receipt/dashboard data or refresh after completion.

These are adjacent visibility/integration changes, not prerequisites for
making the two POST requests themselves.

## H. Risks and Missing Information

- The runtime value of `NEXT_PUBLIC_API_BASE_URL` was not verified. It must
  resolve `/sales/process` and `/sales/confirm` under `/api/v1`.
- The contract calls the employee value `employeeId`, while the screen labels
  it “salesman” but supplies the authenticated cashier ID. Backend semantics
  must confirm which employee is expected.
- Product ID lookup must use a stable, current backend product record. The
  current sale UI accepts arbitrary serial text, and serials are not
  necessarily interchangeable with IDs.
- The client sends no branch ID as required, but the process handler currently
  refuses to proceed unless a branch ID was decoded locally from the token.
  Verify that the token claims used by the frontend and backend agree.
- The frontend cannot verify whether a timeout means a confirmation succeeded.
  A receipt status/details endpoint and expected recovery procedure should be
  identified before enabling repeat attempts.
- Confirm what state/status API can determine that a receipt is still pending
  and whether inventory deduction is observable, to satisfy the safe recovery
  requirement after an ambiguous confirmation.
- Confirm whether comments may be an empty string or should be omitted when
  not provided, and whether the backend accepts empty optional values.
- Backend process response names/serials are described as available “when
  available,” while the current frontend types require both for every item.
  Make these fields optional or define fallback display behavior if the API
  can omit them.
- Product price/receipt totals are backend-calculated as specified; the
  current live receipt preview correctly uses response values, while local
  quote and stock calculations remain in unused/mock service code.
- The backend response status and exact message casing/content have not been
  verified against a live server.
- Local-only “reject sale” does not cancel the pending receipt created by
  Process Sale; clarify whether an API cancellation operation exists or
  whether abandoned pending receipts are expected to expire.

## I. Recommended Implementation Order

1. **Process Sale:** Resolve product IDs from backend product data, correct
   `lineItems[].productId`, retain string quantities and raw-token auth, and
   confirm the meaning of `employeeId` and API base URL.
2. **Test Process Sale:** Verify the exact URL, raw `Authorization` header,
   request field names and types, backend branch derivation, client creation,
   pending receipt creation, and the returned receipt preview values. Include
   invalid product, stock, and duplicate-product cases.
3. **Confirm Sale:** Correct the client phone casing, map only supported
   payment methods, enforce `allowed_sale_perc`, and implement a safe
   ambiguous-outcome state that prevents confirmation resubmission until
   receipt/inventory state is checked. Do not retry automatically.
4. **Test Confirm Sale:** Verify the request body and successful paid receipt,
   branch inventory deduction, and sales totals. Simulate a timeout after the
   backend may have accepted the request and verify that the UI does not
   submit again before state verification.
