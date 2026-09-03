# test_onespend — Enterprise Expense Management API

## Overview
Multi-role expense tracking & approval platform. Users submit expenses (Travel, Reimbursement — Procurement/General future) that flow through role-based approval chains.

## Tech Stack
- **Runtime:** Node.js 22, ES Modules (`"type": "module"`)
- **Framework:** Express 5
- **ORM:** Sequelize 6 + mysql2
- **Validation:** Joi
- **Migrations:** Umzug
- **Dev:** nodemon

## Architecture

### Layered Module Pattern
```
src/modules/{module}/
├── {module}.routes.js        # Route definitions
├── {module}.controller.js    # Request/response handling (uses ApiResponse)
├── {module}.service.js       # Business logic (throws ApiError)
├── {module}.repository.js    # Data access (uses model index)
└── {module}.validation.js    # Joi schemas
```

### Dependency Flow (strict — never skip a layer)
```
Routes → Controller → Service → Repository → Model
```

## Folder Structure
```
src/
├── app.js                        # Express setup, global middleware, route mounting
├── config/
│   ├── database.js               # Sequelize instance
│   └── env.js                    # Env vars (PORT, DB_*, NODE_ENV, CORS_ORIGIN)
├── constants/
│   └── index.js                  # HTTP_STATUS, DB_TABLES
├── utils/
│   ├── ApiError.js               # Error class + static factories (.notFound(), .conflict(), etc.)
│   ├── apiResponse.js            # Standardized response helpers (.success(), .created(), .paginated(), etc.)
│   └── catchAsync.js             # Async wrapper (eliminates try/catch in controllers)
├── middleware/
│   ├── errorHandler.js           # Catches ApiError/Sequelize/Joi errors → ApiResponse
│   └── validate.js               # Joi validation middleware (body/query/params)
├── database/
│   ├── models/                   # All models (auto-loaded by index.js)
│   │   ├── index.js              # Dynamic loader — reads all *.model.js files
│   │   ├── user.model.js         # Factory pattern: export default (sequelize, DataTypes) =>
│   │   └── ...                   # 32 models total
│   ├── migrations/               # 23 migrations in FK-safe order
│   ├── migrate.js                # Run: node src/database/migrate.js
│   ├── seed.js                   # Run: node src/database/seed.js
│   └── rollback.js               # Run: node src/database/rollback.js
├── modules/
│   ├── auth/                     # Login (JWT), authMiddleware, optionalAuth, **requirePermission** (permission-based auth, replaces requireRole)
│   ├── upload/                   # Image upload (multer) → serves /uploads
│   ├── group/                    # Read-only groups (GET /groups, /groups/options) — for company group dropdown
│   ├── user/                     # CRUD + paginated list + GET /users/me
│   └── company, department, role, permission, user_employment,
│       role_permission, role_handover_rule, expense_category, expense, reimbursement,
│       travel_*, vendor, vendor_category, procurement  # CRUD modules
└── routes/
    └── index.js                  # Central route aggregator
```

## Response Format (standardized)
All API responses follow this shape via `ApiResponse`:

```json
// Success
{ "success": true, "message": "...", "data": {...} }

// Paginated
{ "success": true, "message": "...", "data": [...],
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5,
            "hasNextPage": true, "hasPrevPage": false } }

// Error
{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

## Database — 32 Tables

### Core (8)
| Table | Key FKs |
|---|---|
| groups | — |
| roles | — |
| departments | — |
| permissions | — |
| users | → roles |
| companies | → groups |
| role_permissions | → roles, permissions |
| user_employments | → users, companies, departments |

### Expense Module (13)
| Table | Key FKs |
|---|---|
| expense_categories | → roles |
| role_handover_rules | → roles |
| expenses | → expense_categories, companies, user_employments, roles, procurement_orders (procurement_po_id), procurement_requests (procurement_pr_id) |
| expense_documents | → expenses, user_employments |
| expense_handovers | → expenses, roles, user_employments |
| travel_expenses | → expenses |
| travel_expense_segments | → travel_expenses |
| travel_expense_accommodations | → travel_expenses |
| travel_expense_forex | → travel_expenses |
| travel_expense_local_transports | → travel_expenses |
| travel_expense_misc_expenses | → travel_expenses |
| reimbursement_expenses | → expenses (1:1) |
| reimbursement_expense_items | → reimbursement_expenses |

### Vendor Module (7)
| Table | Key FKs |
|---|---|
| vendors | — |
| vendor_contacts | → vendors |
| vendor_addresses | → vendors |
| vendor_bank_accounts | → vendors |
| vendor_documents | → vendors |
| vendor_categories | — |
| vendor_category_mappings | → vendors, vendor_categories (junction — business types a vendor serves) |

### Procurement Module (7)
| Table | Key FKs |
|---|---|
| procurement_intentions | → companies, user_employments, roles (Purchase Intention — no vendor) |
| procurement_requests | → procurement_intentions, companies, vendors, user_employments, roles (vendor set at quotation selection) |
| procurement_orders | → procurement_requests, companies, vendors, user_employments, roles (Purchase Order) |
| procurement_items | polymorphic → procurement_intentions / procurement_requests / procurement_orders / procurement_quotations (`pi_id`/`pr_id`/`po_id`/`quotation_id`; items carry a plain `tax_rate`) |
| procurement_handovers | polymorphic parent + roles, user_employments |
| procurement_documents | polymorphic parent + procurement_quotations (quotation / invoice / delivery files) |
| procurement_quotations | → procurement_requests, vendors (one vendor quote per PR) |

### Future models planned
- GeneralExpense

## Common Patterns
- **Soft deletes:** `paranoid: true` on every table + `deleted_at` column
- **Audit trail:** `created_by_employment_id`, `updated_by_employment_id`, `deleted_by_employment_id` on all tables
- **UUID:** Every table has a `uuid` field
- **Money:** `DECIMAL(15,2)` for amounts, `DECIMAL(15,6)` for exchange rates
- **Employment-based tracking:** Audit fields use employment ID, not user ID

## Scripts
```bash
npm run dev               # nodemon (port from .env PORT — dev runs on 3015)
npm start                 # production
npm run migrate           # run migrations
npm run migrate:rollback  # rollback last batch
npm run migrate:rollback:all  # rollback all migrations
npm run seed              # run seeders
```

> **Dev port:** backend runs on **3015** (`PORT=3015` in `.env`). The frontend's `VITE_API_URL` and hardcoded fallbacks (`src/services/api.js`, `src/utils/assets.js`, `.env.example`) all point at `http://localhost:3015/api/v1`. Keep these in sync if the port ever changes.

## What's Built / What's Pending

### API Modules
- [x] Authentication / Authorization — JWT login, authMiddleware, **requirePermission** (async: checks the user's role has a given `permission_key` from `role_permissions`; used to gate all routes via permission keys like `users:read_all`, `companies:create`, `expenses:approve`, `procurement:po`, etc. — `requireRole` has been fully removed from route files)
- [x] User API — CRUD by UUID, **paginated list** (page/limit/search/status/sort), create/update with employments, **GET /users/me** (full profile), GET /users/:uuid returns profile
- [x] Company API — CRUD by UUID + **GET /companies/options**
- [x] Department API — CRUD by UUID + **GET /departments/options**
- [x] Role API — CRUD by UUID + **GET /roles/options**
- [x] Permission API — CRUD by UUID
- [x] UserEmployment API — CRUD by UUID
- [x] Expense API — CRUD by UUID. **Combined create supports Travel AND Reimbursement** in one transaction; `estimated_amount` is computed server-side from the line items (not trusted from the client). **Scoped lists** — `GET /expenses/my` (own expenses), `GET /expenses` (role+company scoped: SUPER_ADMIN/CFO/**ADMIN_MGR** see all — ADMIN_MGR is global so it can see the procurement-converted expenses it creates — other expense-manager roles see only companies they're employed in), both server-side paginated (`page/limit/search/status/category/sort`); DRAFT expenses are editable by the creator only. **Rejected expenses can be edited and resubmitted** by the original requester — the expense goes back to REJECTED status, creator can edit module children (travel/reimbursement) and resubmit it through the approval flow again.
- [x] **Expense approval flow** — `POST /expenses/:uuid/{submit,approve,reject}` (`actionSchema` = optional remarks + `to_role_id` for approve). **Scoped lists**: `GET /expenses/my` (own), `GET /expenses` (all, role+company scoped), `GET /expenses/assigned` (pending user's role approval, company-scoped), `GET /expenses/my-payments` (pending payment at the user's role). Handover hops validated against `role_handover_rules` with `module=category.module` (travel/reimbursement/procurement — seeded: FINANCE_MGR→CFO for travel/reimbursement, ADMIN_MGR→CFO for procurement, SUPER_ADMIN→CFO). `submit` moves a DRAFT to SUBMITTED with the category's first receiver as handler; `approve` forwards to a selected handover role (validated against rules) or defaults to the category's final approver; closes as **APPROVED** when the final approver approves (routing to the **requester** for the payment step); `reject` closes as REJECTED. Each action logs an `expense_handovers` row (SUBMIT/APPROVE/REJECT/HANDOVER_PAYMENT) and returns the post-update state read inside the same transaction
- [x] ExpenseCategory API — CRUD by UUID
- [x] **Reimbursement API** — header (`reimbursement_expenses`: advance amount/date, payment method, remarks) + line items (`reimbursement_expense_items`: date, description, bill no., exps. type, total). `GET /reimbursements/by-expense/:expenseUuid`, `PUT /reimbursements/:uuid`. Amounts AES-encrypted (created via bulkCreate with `individualHooks`)
- [x] TravelExpense API — combined create with-travel endpoint
- [x] TravelSegment API — CRUD by UUID
- [x] TravelAccommodation API — CRUD by UUID
- [x] TravelLocalTransport API — CRUD by UUID
- [x] TravelForex API — CRUD by UUID
- [x] TravelMiscExpense API — CRUD by UUID
- [x] RolePermission API — sync permissions for a role
- [x] RoleHandoverRule API — CRUD by UUID + **PUT /sync** (activate/deactivate a role's to-role set; never deletes, just flips status ACTIVE/INACTIVE)
- [x] Upload API — POST /uploads (multer, 2MB limit, **any file type**), served statically at /uploads
- [x] ExpenseDocument storage — each travel/reimbursement sub-part accepts `attachments`; files are uploaded via `/uploads` and stored as `expense_documents` rows linked to the specific item (`module_name` + `module_record_id`) on create/update (update replaces them)
- [x] Vendor API — CRUD by UUID + **GET /vendors/options**; nested contacts / addresses / bank accounts in one create/update transaction; **vendor category assignment** via `vendor_category_uuids` — resolved to category ids and written to the `vendor_category_mappings` junction in the same transaction (errors on an unknown uuid)
- [x] VendorCategory API — CRUD by UUID + **GET /vendor-categories/options**; classifies vendors by the business types they serve
- [x] VendorDocument API — add/remove documents on a vendor (uploaded files via `/uploads`)
- [x] **Procurement API** — `/procurement`. **Three separate header tables**: `procurement_intentions` / `procurement_requests` / `procurement_orders` (chained via `prs.pi_id` / `pos.pr_id`); child tables (items/handovers/documents) are polymorphic (`pi_id`/`pr_id`/`po_id`/`quotation_id`). **Workflow actions**: `submit` / `approve` / `reject` / `create-pr` / `create-po` / `received` / `pay`, plus `PUT /:uuid/items` (admin edits PR line items — qty/unit price — while quotations are gathered). Totals computed server-side (qty × price × tax); amounts AES-encrypted. **Create & submit are gated by the `procurement:create` permission** (role_permissions), NOT handover rules. The **approval hops** (after submit) ARE validated against `role_handover_rules` (module='procurement') — the chain (PI → submit → ADMIN_MGR → approve → create PR → quotation → select → CFO → PO → Received → FINANCE_MGR → CFO → PAYMENT_MGR → paid). Handovers logged with an encrypted `amount_at_step` snapshot. Documents attached per request (form/invoice/delivery). Role-scoped list (SUPER_ADMIN/CFO all, managers company-scoped, requesters own) — **projected to the latest document per chain** unless filtered by a single type. **Duplicate guards**: `create-pr` once per PI, `create-po` once per PR. `GET /:uuid` returns a `price_history` chain (PI → PR → quotations → PO totals) for stage-by-stage price comparison.
- [x] **PO-created expense** — `create-po` **auto-creates a linked expense** (`expenses.procurement_po_id` → `procurement_orders.id`, FK added in the last migration batch) inside the **same transaction** (atomic — an expense error rolls back the PO). The expense starts **SUBMITTED** with the `PROCUREMENT` category's first receiver (ADMIN_MGR) as handler, `estimated_amount`/`final_amount` = the PO's grand total (decrypted once — the PO model's encrypt hook already encrypted it in-memory), and an initial SUBMIT handover (requester → first receiver). It then flows through the **expense role-handover chain** (`module='expense'` rules): ADMIN_MGR approves → CFO → APPROVED. PO detail includes its `expenses`.
- [x] **PR → expense conversion** — `POST /procurement/:uuid/convert-to-expense` (`SUPER_ADMIN`/`ADMIN_MGR`) turns a **quotation-approved PR** (`QUOTATION_APPROVED`/`APPROVED`, i.e. it has a `SELECTED` quotation) into an expense (category `PROCUREMENT`, SUBMITTED, handler ADMIN_MGR, amount = the selected quotation's grand total). **Duplicate guards**: rejected if the PR already has a PO (the PO's auto-created expense is the source of truth) or if an expense already exists for the PR (`expenses.procurement_pr_id`). **`create-po` reuses an existing PR-linked expense** instead of creating a second — the PO is attached to the same expense (`procurement_po_id`) so there is exactly **one expense per chain** regardless of which path runs first. PR detail includes its `expenses`. The expense's source procurement history is **lazy-loaded**: `GET /expenses/:uuid/procurement-chain` returns the `procurement_chain` payload (PI → PR → quotations → PO with decrypted totals, vendor masked for the requester, plus the chain's approval logs via `findChainByPrId` + `findChainHandovers`) — fetched only when the frontend expands the "Procurement history" section, keeping the detail call light.
- [x] **Procurement quotations (blind vendor)** — PI creation takes **no vendor** (requester must not know who might supply). The vendor enters only via **quotations**: admin fills one or more quotations on a PR (`POST/PUT/DELETE /procurement/:uuid/quotations`). **Each quotation carries its own line items** (polymorphic `procurement_items` rows with `quotation_id`) — item name, qty, unit price, and a per-item `tax_rate` (stored plain, not encrypted). Totals are computed **server-side** from the items (qty × price × tax), never trusted from the client. Quotation API accepts `{ vendor_uuid, valid_until, notes, items[] }` (comments → `notes`; `title`/`total_amount`/`tax_amount`/`terms` were dropped from the contract). Quotations are **editable until the requester selects** (statuses SUBMITTED/PR_CREATED/QUOTATION_SELECTION). **PR line items lock earlier** — `updateItems` is allowed only while SUBMITTED/PR_CREATED (`PR_ITEM_EDITABLE_STATUSES`); once `submit-quotations` moves the PR to `QUOTATION_SELECTION` the admin can no longer change the qty/prices the requester is comparing (quotations themselves stay editable through selection). Then `submit-quotations` moves the PR to `QUOTATION_SELECTION` with the requester as handler. The requester then **selects one quotation blind** (`select-quotation`) — the vendor stays masked but the requester **sees the line items + prices** to compare; the chosen quotation sets the PR's `vendor_id` and moves the PR to `QUOTATION_APPROVED` for CFO. The vendor stays hidden from the requester even on the final PO. Quotation files are `procurement_documents` rows linked via `procurement_quotation_id`. PI line items carry only **quantity + unit price** — no `unit`, no `tax_rate` (tax is applied at the quotation stage, not the intent); PI/PR item endpoints reject `tax_rate` (only quotations accept it, via a dedicated `quotationItemSchema`).
- [ ] ExpenseHandover API

### Seeders (14 files)
- [x] Groups — Kings Group Ventures (KGV)
- [x] Roles — 13 roles (SUPER_ADMIN → EMPLOYEE)
- [x] Departments — 10 departments
- [x] Companies — 28 companies under KGV
- [x] Permissions — 35 permissions across 9 modules
- [x] RolePermissions — role-permission assignments
- [x] ExpenseCategories — Travel category
- [x] Users — one user per role (12 users + SUPER_ADMIN)
- [x] RoleHandoverRules — travel module approval chain
- [x] VendorCategories — 5 demo business types (Corporate Travel, IT Services, Consulting, Office Supplies, Logistics)
- [x] ProcurementPermissions — `procurement:create/read/update/approve/po/received/pay` (ids 135–141) + role grants. **Every role gets `procurement:create`+`read`** so anyone can raise & submit a PI; other actions (approve/po/received/pay) are granted only to the relevant approver roles (SUPER_ADMIN/ADMIN_MGR/CFO/FINANCE_MGR/PAYMENT_MGR/HOD). **Note:** SUPER_ADMIN (100) is granted via the "everything" spread and must NOT be in `ALL_CREATE_READ_ROLES` (its omission avoids a duplicate `(role_id, permission_id)` row that violates the unique index).
- [x] ProcurementHandoverRules — `module='procurement'` role handoff rules for the PI→…→Payment chain
- [x] ProcurementExpenseCategory — `PROCUREMENT` expense category (first receiver ADMIN_MGR → final approver CFO)

### Infrastructure
- [x] Reusable ApiError + ApiResponse + errorHandler
- [x] Validation middleware (Joi) with field-level errors
- [x] AES-256-CBC encryption utility with model hooks
- [x] Umzug v3 migration/seed scripts (migrate, rollback, rollback-all, seed)

### Key Implementation Details
- **UUID-based lookups** — all APIs use UUID, not auto-increment ID
- **UUID resolution** — API accepts `*_uuid` in body, service resolves to internal ID
- **Encrypted amounts** — all `*_amount` and `exchange_rate` fields auto-encrypted via Sequelize hooks
- **Combined endpoints** — `POST /api/expenses` creates expense + travel + child items in one transaction
- **Per-item attachments** — `expense_documents` link each uploaded file to its own sub-part record (`module_name` = travel_segment / travel_accommodation / travel_forex / travel_local_transport / travel_misc_expense / reimbursement_item)
- **Approval chain** — `expense_categories` define first/final approver roles, `role_handover_rules` define handover paths
- **Permission-based authorization** — all routes use `requirePermission(permission_key)` middleware that checks `role_permissions` table (replaced hardcoded `requireRole('SUPER_ADMIN', 'ADMIN_MGR')` checks). Permission keys follow pattern `{resource}:{action}` (e.g., `roles:read_all`, `companies:create`, `expenses:approve`, `procurement:po`).
- **Password hashing** — passwords bcrypt-hashed on create and update (fixed plaintext bug). **All seeded users use password "Admin@123"**
- **UUID auto-generation** — every model's `uuid` has `defaultValue: UUIDV4` (fixed "uuid cannot be null" on create)
- **Per-employment email** — `user_employments.email` column (a user can have a different email per company)
- **Lightweight options** — `/roles|companies|departments/options` return only `[{ uuid, name }]` for dropdowns
- **Shared data-access lives in owning modules** — employment helpers (`getEmploymentIdsByUser`, `getActiveCompanyIdsByUser`, `getActiveEmploymentByUser`, `getActiveEmploymentByUserAndCompany`) live in the **`user_employment`** module; company/role uuid resolution goes through the **`company`**/**`role`** repositories; `decryptResults` lives in **`encryption.js`**. Other modules import these instead of re-querying models inline (see `user_employment.service.js`, `company.repository.js`, `role.repository.js`, `utils/encryption.js`).
- **Procurement→Expense FK direction** — Expense is the **parent**; `procurement_orders` has `expense_id` FK (no `procurement_po_id`/`procurement_pr_id` on expenses). PO creation: create PO first, then expense, then set `po.expense_id = expense.id` atomically. Matches travel/reimbursement pattern (expense_id on child table).
- **DRAFT PI visibility** — `procurement.repository.js:buildWhere()` combines the draft exclusion filter (`draftPiFilter` from service) with any additional status filters using `Op.and` instead of overwriting. DRAFT PIs are visible **only to their creator** in "All Requests" list.
- **Parent-child expense architecture confirmed** — `expenses` is parent; `travel_expenses`, `reimbursement_expenses`, and `procurement_orders` are children via `expense_id` FK (on child tables). PO creation auto-creates linked expense in same transaction; PR conversion to expense reuses existing expense if PO already created.

## Procurement Module — BUILT

Full chain implemented: `PI (Purchase Intention) → PR (Purchase Request) → Quotation → PO (Purchase Order) → Received → Finance → CFO (re-approval) → Payment`.

### Today's Updates (2026-08-18)
- **Health check debug logging**: Added `console.log('Health check endpoint hit')` to `GET /health` in `src/app.js` for monitoring.
- **SQL logging disabled**: Changed `logging: env.isDev ? console.log : false` to `logging: false` in `src/config/database.js` — no more SQL queries logged in development.
- **`markReceived` workflow removed**: Deleted the `markReceived` controller function and its route (`POST /:uuid/received`) from procurement module. The "Received" step is no longer a separate action in the PO flow.
- **Test route commented out**: Added a commented test route for `/create-po` in `procurement.routes.js` (for debugging).
- **PO handover log `toRoleId` set to `null`**: In `procurement.service.js`, the `createPo` handover log now uses `toRoleId: null` instead of `ROLE_IDS.ADMIN_MGR` — the PO creation doesn't hand off to a next role; the auto-created expense handles its own approval chain.

### Today's Updates (2026-08-17)
- **PR Quotation Selection flow fixed**: After requester selects a quotation (`SELECT_QUOTATION`), the PR status becomes `QUOTATION_APPROVED` and the handler is now `ADMIN_MGR` (not CFO) — so admin can create the PO from the selected quotation.
- **Create PO uses selected quotation items**: `createPo` copies line items (qty, unit_price, tax_rate) from the `SELECTED` quotation on the PR, not from the original PR items. Falls back to PR items if no quotation selected.
- **Create PO button appears at QUOTATION_APPROVED**: Frontend now shows "Create PO" button when PR status = `QUOTATION_APPROVED` (was checking for `APPROVED`).
- **Expense auto-creation on PO**: PO creation already auto-creates a linked expense (parent table) with the PO as child — atomic transaction. Expense uses PROCUREMENT category (first receiver ADMIN_MGR → final approver CFO).

- **Schema** (`20260806000003-create-procurement-tables.js`): **three header tables** — `procurement_intentions`, `procurement_requests`, `procurement_orders` — chained via explicit FKs (`prs.pi_id`, `pos.pr_id`). Child tables (`procurement_items`, `procurement_handovers`, `procurement_documents`) are **polymorphic**: nullable `pi_id`/`pr_id`/`po_id`/`quotation_id`, exactly one set per row. `procurement_items` also carries a **plain `tax_rate`** column (a percentage, not encrypted — only amounts are). Encrypted amounts (`total_amount`/`tax_amount`/`grand_total`, item `unit_price`/`total_with_tax`, handover `amount_at_step`) stored as TEXT.
- **Quotations**: `procurement_quotations` — one row per vendor quote on a PR (`pr_id`, `vendor_id`, encrypted `total_amount`/`tax_amount`/`grand_total`, `valid_until`, `notes`, status `ACTIVE/SELECTED/REJECTED`). **Each quotation has its own line items** (`procurement_items.quotation_id`) carrying that vendor's prices/tax. `procurement_documents.procurement_quotation_id` lets each quotation carry its own files — a quotation-linked document is stored **only** under the quotation (no header owner column), so it doesn't duplicate into the PR's Documents section. Quotations are **editable until the requester selects one** (statuses SUBMITTED/PR_CREATED/QUOTATION_SELECTION), then they lock; deleting a quotation force-deletes its items.
- **List projection (latest per chain)**: the role-scoped list (`findAll`) collapses each chain to its **most advanced document** — PO if it exists, else PR, else PI (priority `PO > PR > PI`, resolved via `pi_id`/`pr_id` chain keys). A single **type filter** (PI/PR/PO) disables the projection so every document of that type is listed for auditability.
- **Workflow engine** (`src/modules/procurement/procurement.service.js`): `submit` / `approve` / `reject` / `create-pr` / `create-po` / `received` / `pay`, plus quotation `ADD_QUOTATION` / `UPDATE_QUOTATION`. Each role→role hop is validated against an ACTIVE `role_handover_rules` row with `module='procurement'` (seeded in `20260806000013`). Totals computed server-side from items (qty × price × tax). **Duplicate guards**: `create-pr` rejects if the PI already has a PR (`prs.pi_id`), `create-po` rejects if the PR already has a PO (`pos.pr_id`).
- **Approval timeline (chain-wide)**: handovers are polymorphic (`pi_id`/`pr_id`/`po_id`) with an encrypted `amount_at_step` snapshot. The detail endpoint merges **every handover across the chain** (PI + PR + PO, via `findChainHandovers`) into the viewed document's timeline, deduped by uuid and sorted chronologically — so viewing any document shows the full journey (submit PI → approve PI → create PR → add/update quotation → submit quotations → select quotation → PO → …).
- **Price history**: `GET /procurement/:uuid` returns a `price_history` payload — the decrypted PI → PR → each quotation → PO totals for stage-by-stage comparison; vendor identity masked from the requester across the whole chain.
- **Vendor linkage**: `procurement_requests.vendor_id` / `procurement_orders.vendor_id` → `vendors` (link to the Vendors master); set on the PR at quotation selection and copied to the PO.
- **Permissions**: `procurement:*` (ids 135–141) + role grants (seeder `20260806000012`).
- **Expense category**: `PROCUREMENT` (module='procurement') seeded for future expense conversion.

### Deferred (documented follow-ups)
- **Multiple PIs → one PO** — add a `procurement_links` junction (`request_id`, `linked_request_id`).
- **Expense payment step** — expenses currently stop at APPROVED (final approver = CFO). A payment stage (PAID) would mirror the PO's Received → Finance → Payment leg.
- **Vendor masked on the expense** — the PO-created expense currently shows the PO amount; a vendor breakdown could be added if expenses need vendor-level detail.
- Frontend lives in the frontend repo (Procurement section — list, create PI, detail with action bar + handover timeline + documents).

### Today's Updates (2026-08-20) — Selected Quotation in Procurement Chain
- **Expense repository** (`expense.repository.js`): Added `ProcurementOrder` to the detail include chain — now includes the full procurement chain: PO → PR → PI, plus Vendor and PO Items. This enables fetching the selected quotation with its line items when building the procurement chain for an expense.
- **Expense service** (`expense.service.js`): In `buildProcurementChain`, added logic to find the `SELECTED` quotation from the PR's quotations and include it in the response with its full line items (name, description, quantity, unit_price, tax_rate, total_with_tax). The selected quotation is now exposed on the expense detail's procurement history card for visibility.

### Today's Updates (2026-08-21) — Final Approver Closes Expense as APPROVED
- **Expense service** (`expense.service.js`): Fixed the approve logic — if the current handler IS the category's `final_approver_role_id`, the expense is now **always closed as APPROVED** regardless of any `to_role_id` provided. Nothing hands over past the final approver. Previously, if the final approver selected a handover role in the dropdown, the expense would forward instead of closing.
- **Expense repository** (`expense.repository.js`): Added `firstReceiverRole` and `finalApproverRole` includes to the category in `detailInclude` so the frontend knows the final approver.
- **Expense controller** (`expense.controller.js`): The `approveExpense` endpoint passes `to_role_id` through to the service.

### Today's Updates (2026-08-18) — Expense Approval Handover Flow
- **New endpoint**: `GET /expenses/assigned` — returns expenses pending the logged-in user's role approval (company-scoped; SUPER_ADMIN/CFO see all, other manager roles see only their employed companies).
- **Enhanced approve action**: `POST /expenses/:uuid/approve` now accepts optional `to_role_id` for flexible handover to a specific role.
- **Role handover rules per category module**: The approval chain now uses `category.module` (travel/reimbursement/procurement) instead of hardcoded `'expense'`. Existing seeded rules work:
  - Travel: FINANCE_MGR (104) → CFO (101)
  - Reimbursement: FINANCE_MGR (104) → CFO (101)
  - Procurement: ADMIN_MGR (106) → CFO (101)
  - SUPER_ADMIN → CFO (all modules)
- **New service method**: `getValidHandoverRoles(uuid)` — returns valid handover target roles from `role_handover_rules` for the current handler.
- **New route**: `GET /expenses/:uuid/handover-roles` — exposes valid handover roles for the frontend dropdown.
- **Updated validation**: `actionSchema` now accepts optional `to_role_id` for approve action.
- **Removed redundant seeder**: `20260811000001-seed-expense-handover-rules.js` (uses existing travel/reimbursement/procurement module rules).

### Today's Updates (2026-08-31) — Unified Expense Payment System
- **New payment workflow** for ALL expense types (Travel, Reimbursement, Procurement-linked, General) — unified logic replacing the previous reimbursement-only approach.
- **New fields on `expenses` table**: `advance_amount` (default '0'), `final_amount` (computed on SUBMIT), `paid_amount` (running total, default '0'), `payment_status` (ENUM: UNPAID, PARTIAL_PAID, PAID, ADVANCE_REFUND_DUE, ADDITIONAL_PAYMENT_DUE, SETTLED).
- **New tables**: `expense_payments` (each installment: amount, payment_method, payment_date, payment_type, reference_number, remarks) and `expense_payment_proofs` (screenshots/receipts per payment).
- **Unified payment status logic** — **direction-aware** (corrected 2026-09-03): status is computed from the **individual `expense_payments`** (their `payment_type` tells money-flow direction), NOT from the single conflated `paid_amount` scalar. A scalar can't distinguish a **company→user** disbursement from a **user→company** refund, so it misfired: e.g. advance 750 / final 1100 / paid 350 wrongly showed `ADDITIONAL_PAYMENT_DUE` (should be `SETTLED`), and advance 9500 / final 4400 / refunded 5100 wrongly showed `ADVANCE_REFUND_DUE` (should be `SETTLED`).
  - **`payment_type` direction** — `PARTIAL`/`FULL`/`ADDITIONAL` = **company → user** (disbursement toward the expense); `ADVANCE_REFUND`/`REFUND_RECEIVED` = **user → company** (refund of an over-advanced amount).
  - **`computePaymentStatus(payments, final, advance)`** sums each direction separately (`sumPaymentsByDirection`) and reconciles in the correct currency of flow:
    - Over-advanced (`advance > final`): user must refund `excess = advance − final`; settled once user→company refunds `>= excess`, else `ADVANCE_REFUND_DUE`.
    - Under-advanced / no advance (`final >= advance`): the advance already counts as company money toward the expense; settled once `advance + company→user payments >= final` (→ `SETTLED` if `advance > 0`, else `PAID`); else `PARTIAL_PAID` (some paid) or `ADDITIONAL_PAYMENT_DUE`/`UNPAID` (nothing on top of the advance yet).
  - **`paid_amount`** on the expense = **net company disbursement** via recorded payments (`max(0, companyToUser − userRefund)`), backfilled for existing rows. `getPaymentSummary()` recomputes status + `amount_due` live from the direction-split payments (not from the stored scalar); `recordPayment()` recomputes from all the expense's payments (existing + the new one) before persisting.
  - `advance_amount = 0` for non-reimbursement; `reimbursement.advance_amount` for reimbursement.
  - On SUBMIT (approve-as-final): `final_amount` computed from line items, `advance_amount` set, `payment_status` initialized from `computePaymentStatus([], final, advance)`.
  - Approval `status` stays `APPROVED` on payment — only `payment_status` moves to `PAID`/`SETTLED` (see 2026-09-02 section).
- **New endpoints** (permission `expenses:pay`):
  - `POST /expenses/:uuid/payments` — record payment installment + upload proofs
  - `GET /expenses/:uuid/payments` — list all payments
  - `GET /expenses/:uuid/payment-summary` — computed summary (paid, due, status)
- **Permission grants**: `expenses:pay` (id 158) granted to SUPER_ADMIN (100), CFO (101), PAYMENT_MGR (102), PAYMENT_JR (103), FINANCE_MGR (104).
- **Proof of payment**: Each payment installment can have multiple uploaded proofs (screenshots, bank statements) via `/uploads`.

### Today's Updates (2026-09-02) — Payment Handover Feature
- **When the final approver closes an expense as APPROVED, it now routes for payment** — `approve()` sets `current_role_id` to the expense's designated payment handler (instead of clearing it to `null`). The handler then sees the APPROVED expense and can record a payment directly (if they have `expenses:pay`) or hand it over to a finance/payment role. Prior behaviour: `current_role_id` was cleared, leaving the expense with no handler. **Handler by module**: `travel`/`reimbursement` route to the **ORIGINAL REQUESTER**; `procurement`-linked expenses route to **ADMIN_MGR** (the role that raised the PO / owns the procurement chain) instead of the requester.
- **`recordPayment()` now auto-returns the expense to its handler when fully settled**: when the recomputed `payment_status` is `SETTLED` (or `PAID` with `advance_amount === 0`), the expense's `status` is set to `PAID` and `current_role_id`/`current_employment_id` are set back to the handler so they see the final PAID state in "My Expenses". The handler is the **ORIGINAL REQUESTER** for `travel`/`reimbursement`, and **ADMIN_MGR** for `procurement`-linked expenses (consistent with where they route on approval). Previously the handler was left wherever it was.
- **Payment is now a role-handover workflow** (mirrors the approval chain) — new `role_handover_rules` entries with `module='payment'` (seeded into the existing `20260724000010-seed-role-handover-rules.js`, uuid prefix `d4e5f6a7-b8c9-0123-cdef-12345678`; the `down()` deletes by module so no separate rollback). The requester (current handler) can forward the expense to any payment-eligible role per these rules.
- **New service functions** in `expense.service.js`:
  - `handoverForPayment(uuid, user, toRoleId, remarks)` — forwards an APPROVED/PAID, non-settled expense from the current holder to a target role. Verifies the actioner is the current handler (or SUPER_ADMIN), validates the `module='payment'` handover rule via `requireHandoverRule`, updates `current_role_id`, and logs an `expense_handovers` row with `actionType: 'HANDOVER_PAYMENT'`. Rejects if already `SETTLED`/`PAID` or if status is not APPROVED/PAID.
  - `getPaymentHandoverRoles(uuid)` — returns valid `module='payment'` handover targets `[{ roleId, roleUuid, roleName, roleCode }]` from `role_handover_rules` where `from_role_id = expense.current_role_id`.
  - `getMyPaymentRequests(user, params)` — paginated list of expenses pending payment at the user's role: `current_role_id = user's role`, `status IN ('APPROVED','PAID')`, `payment_status NOT IN ('SETTLED','PAID')`, company-scoped for non-global roles (mirrors `getAssigned`).
- **New endpoints**:
  - `GET /expenses/my-payments` (permission `expenses:read`) — the payment-requests list for the current role (registered before `/:uuid` so the static path wins).
  - `POST /expenses/:uuid/handover-payment` (permission `expenses:pay`, `actionSchema`) — body `{ to_role_id, remarks }`.
  - `GET /expenses/:uuid/payment-handover-roles` (permission `expenses:pay`) — valid payment handover targets for the current handler.
- **`expense_handovers.action_type`** now includes `HANDOVER_PAYMENT` (in addition to SUBMIT/APPROVE/REJECT/PAY and the procurement chain types).
- **`getPaymentSummary()` `amount_due` fix**: previously `amount_due` was computed as only `advance − final` (or `final − advance`) and **ignored already-recorded payments**, so after a partial payment the "pending" figure stayed at the full final amount (e.g. travel 5000 final, 1000 paid → still showed 5000 instead of 4000) in both the detail view and the Record-Payment modal (which defaults/clamps to `amount_due`). It now subtracts `paid_amount` in every branch — `(advance − final) − paid` (over-advance/refund), `(final − advance) − paid` (under-advance), and `final − paid` when `final === advance` — clamped to `0` if negative. `paid_amount` is unchanged (read directly from the row), so the card had always shown the correct paid total while the pending figure was wrong.

### Today's Updates (2026-09-03) — Application Logging (Winston)
- **New logger**: `src/utils/logger.js` (Winston `v3.19`, added to `dependencies`). Provides `logger.error/warn/info/http/debug` with timestamps; error stacks included.
- **Level controls**: `LOG_LEVEL` in env (default `debug` in dev, `info` in prod). Human-readable, colorized console output in all environments.
- **Year/Month/Day file buckets**: a custom `DailyFolderFile` transport writes to `logs/<YYYY>/<MM>/<DD>/` and opens a fresh stream when the date changes — no extra deps, no unbounded single file. Two files per day, level-filtered via `onlyLevel(format, ...levels)` (winston otherwise routes `level >= configured`, which would pollute the api log with info/error lines):
  - `logs/YYYY/MM/DD/error.log` — `error` + `warn` (with stacks)
  - `logs/YYYY/MM/DD/api.log` — `http` only (request traffic)
- **Request logging**: `src/middleware/requestLogger.js` mounted early in `app.js` logs every request at `http` level — `METHOD path status durationMs` plus `user=<uuid|id> role=<code>` when authenticated. Requests to the logs-viewer paths (`/api/v1/system/logs*`) are **excluded** (`SKIP_PREFIXES`) so viewing the logs page doesn't fill `api.log` with its own `GET /system/logs*` traffic.
- **Error handler**: `errorHandler.js` now logs the request route + method + user via `logger.error(... { stack })` to error.log (was a dev-only `console.error`).
- **Wiring** (replaced `console.*`): `server.js` (startup), `src/middleware/errorHandler.js`, `src/modules/dashboard/dashboard.service.js` (4 `warn`s), `src/modules/procurement/procurement.controller.js` (#createPo debug → `logger.debug`), `src/modules/procurement/procurement.service.js` (createPo debug → `logger.debug`), and the DB CLI scripts `src/database/{migrate,seed,rollback,rollback-all}.js`.
- **`.gitignore`**: added `logs/` so runtime log files are never committed. Env: `LOG_LEVEL`, `LOG_DIR` (default `logs`) in `src/config/env.js`.
- **Intentionally left as `console`**: the migration files' `down()` "Skipping constraint …" messages and the umzug instances' `logger: console` — importing the runtime winston logger into each migration file would couple pure SQL migrations to the app logger; the CLI scripts already funnel umzug output.
- **System logs API (SUPER_ADMIN only)**: new permission id **177 `system_logs:view`** (uuid `f1a2b3c4-d5e6-7890-fabc-123456789078`, resource `system_logs`, action `view`) granted **only** to SUPER_ADMIN (`[100,177]` in the role-permissions seeder; permissions seeder bumped `down()` to length 78). New `src/modules/system_logs/` module reads the `logs/<YYYY>/<MM>/<DD>/` buckets written by the logger — the service resolves the root as **3 levels up** from `src/modules/system_logs` (unlike `logger.js` at `src/utils`, which is 2 levels). Endpoints, both `requirePermission('system_logs:view')`, mounted under `/system`:
  - `GET /api/v1/system/logs/meta` — available dates, newest first.
  - `GET /api/v1/system/logs/error?date=YYYY-MM-DD` — `{ date, type: 'error', entries: [] }` from `error.log` only (error + warn, with stacks).
  - `GET /api/v1/system/logs/api?date=YYYY-MM-DD` — `{ date, type: 'api', entries: [] }` from `api.log` only (request traffic).
  - `GET /api/v1/system/logs?date=YYYY-MM-DD` — combined `{ date, error: [], api: [] }`. Each entry `{ timestamp, level, message }`; stacked error trace lines are merged into the preceding entry. `400` on a malformed date or invalid log type, `404` when no folder exists for the date.
- Configured in `src/routes/index.js` via `router.use('/system/logs', systemLogsRoutes)` — the sub-router's static `/meta`, `/error`, `/api`, and `/` routes thereby resolve to `/system/logs/meta`, `/system/logs/error`, `/system/logs/api`, and `/system/logs`. (The `/meta` static route is registered before the `/logs` root.)

## Pending Improvements (future backlog)

> Cross-cutting ideas for hardening, observability, and finishing the payment/logging work. Pick up in rough priority order.

### Logging & observability
- [ ] **Seed `system_logs:view` in the DB** — the permission exists in the seeder (`20260724000006`/`-0007`) but has not been run; run `npm run seed` so SUPER_ADMIN can actually open `/system/logs` in a fresh/prod DB.
- [ ] **Log file size rotation + retention** — the date-folder buckets grow unboundedly. Add a max size per file (winston `maxsize`/`maxFiles` or a similar cap) and a scheduled cleanup that deletes `logs/**` older than N days.
- [ ] **Request correlation IDs** — generate `req.id` and include it in both `api.log` and `error.log` entries so a single request can be traced across both files.
- [ ] **Structured JSON log transport** (optional) — in addition to the human console format, offer a JSON-formatted transport so logs can be shipped to an aggregator (ELK/Datadog/Loki).
- [ ] **`/health` enrichment** — add DB connectivity (and optionally a Redis/upload-dir check) to the health endpoint for monitoring.

### Reliability & security
- [ ] **API rate limiting** (`express-rate-limit`) per user/IP — especially on `/auth/login` (currently brute-forceable).
- [ ] **Security hardening** — add `helmet`, tighten CORS, and enforce request body/size limits (the app serves file uploads + financial data).
- [ ] **Graceful shutdown** — flush winston transports and drain in-flight requests before the process exits (custom `DailyFolderFile` transport streams should be closed cleanly).

### Finance / payments
- [ ] **Standalone Finance/Payments module list** — a global "All Payments" list across expenses (filters, totals, payment-proof viewer) to round out the unified payment system (frontend CLAUDE.md also flags this pending).

### Testing / DX
- [ ] **Automated tests** — effectively none today. Add test coverage for the highest-risk flows: the expense approval chain (submit → approve → pay / handover), the procurement chain, and the new `/system/logs` endpoints.
- [ ] **CI pipeline** on both repos — lint + typecheck + build + tests on push.
