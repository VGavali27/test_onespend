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

### Seeders (15 files)
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
- [x] Vendors — 5 real-world demo vendors (MakeMyTrip, Microsoft India, Accenture, 3M India, Blue Dart), each with a primary contact/address/bank account (account numbers AES-encrypted at seed time) + a `vendor_category_mappings` row. (2026-09-08: uuids corrected to valid RFC-4122 — an earlier string-concat scheme wrote 34-char uuids that Joi's `string().uuid()` rejected on quotation submission; live rows updated in the dev DB.)

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
- **Request logging**: `src/middleware/requestLogger.js` mounted early in `app.js` logs every request at `http` level — `METHOD path status durationMs` plus `user=<uuid|id> role=<code>` when authenticated. Requests to the logs-viewer paths (`/api/v1/system/logs*`) and the notification polling paths (`/api/v1/notifications` and `/api/v1/notifications/count`) are **excluded** (`SKIP_PREFIXES`) — viewing the logs page fills `api.log` with its own `GET /system/logs*` traffic, and the bell's 30s polling would otherwise spam it with near-identical `GET /notifications*` lines.
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

### Today's Updates (2026-09-07) — Stage-Wise Procurement Chain + Merged Approval Timeline for the Expense Detail
The expense detail became a tabbed view (Overview / PI / PR / Quotations / PO / Approvals / Payments), so the backend's procurement chain work now serves **per-stage documents with their own line items**, plus the **chain's own approval logs** so the frontend can merge everything into one chronological timeline.

- **`expense.service.js`**:
  - `getProcurementChain(uuid, user)` — visibility check (global roles / requester / company, 404 on hidden), then finds the PO **via `expense_id`** (expense is the parent). **Returns `{ procurement_chain: null }` when the expense has no linked PO** instead of erroring — keeps non-procurement detail calls light.
  - `buildProcurementChain(expense, requesterIsOwner)` rebuilt for **stage-wise display**: PO found by `expense_id` → `procurementRepository.findChainByPrId(po.pr_id)` → PI / PR / quotations / PO, each returned with its **own fully-decrypted line items** (name, qty, unit_price, tax_rate, total_with_tax). **Requester-aware vendor masking**: `vendorOf()` returns `null` when the viewer is the requester; the **PR always exposes `vendor: null`** by construction (the supplier only enters at quotation stage — blind-vendor rule). Each quotation also carries its **uploaded documents** (`{ uuid, original_file_name, file_path }` from `ProcurementDocument`) so the expense detail's Quotations tab can show them — **masked to `[]` for the requester** (a scanned quotation would reveal the supplier). The **selected quotation** (`status === 'SELECTED'`) is returned separately with its items. The chain's **own handovers** (`findChainHandovers({piId, prId, poId})`) are mapped to `{action_type, remarks, from_role, to_role, action_by, created_at}` for the expense detail's merged Approval Trail.
- **`procurement.repository.js`**:
  - **`findChainByPrId(prId)`** (`:306`) — new chain query rooted at a **PR id** (the expense-detail entry point; the existing detail chain remains rooted at the viewed document's uuid). Loads PR (+vendor, +items) → PI (+items) → quotations (+vendor, +items) → PO (+vendor, +items).
  - **`findChainHandovers({piId, prId, poId})`** (`:341`) — polymorphic OR across `pi_id`/`pr_id`/`po_id`, ordered by `createdAt`, including `fromRole`/`toRole`/`actionBy.user` — the chain-wide approval feed behind the merged timeline.
- **`procurement.service.js`**:
  - PI `create` now resolves the requester's employment **at the selected company** first (`getActiveEmploymentByUserAndCompany(userId, company.id)`), falling back to any active employment (`getActiveEmploymentByUser`).
  - `createProcurementExpense({ po, pr, t })` — decrypts `pr.grand_total` + the (already in-memory encrypted) `po.grand_total` **exactly once** so the expense hook doesn't double-encrypt; `createProcurementExpenseRecord` stores **`estimated_amount` = the PR total** (pre-quotation estimate) and **`final_amount` = the PO grand total** (the selected quotation's committed amount).
- **Wire-up**: `GET /expenses/:uuid/procurement-chain` returns `{ procurement_chain: chain }` (frontend reads `data.procurement_chain`); the expense detail **eagerly loads** it on mount for `isProcurement` expenses (no longer lazy-on-expand, see frontend 2026-09-07).
- **PO PDF (frontend-only, no new backend endpoint)**: the procurement detail's **PO tab** renders a real-world A4 Purchase Order for the vendor (letterhead, vendor bill-to, ship-to, line items, tax totals, amount in words, signatures) and prints via `window.print()`. All data comes from the existing `price_history`/`findChainByPrId` chain payload already served by `GET /procurement/:uuid` — the PO include already carries company (address/GST/PAN), vendor (name/code/GST/platform payment_terms), requester, items, and decrypted `total_amount`/`tax_amount`/`grand_total`.
- **PR PDF (frontend-only, no new backend endpoint)**: the procurement detail's **PR tab** renders an A4 Purchase Request after a **vendor picker step** (the PR stores no vendor, so the user chooses one — options from `GET /vendors/options`, full record from `GET /vendors/:uuid`) and prints via `window.print()`. The PR sheet reuses the chain's PR payload (company letterhead, requester, items, decrypted totals, notes, expected delivery). PDFs are generated **during the procurement process only** — once a PO/PR is converted to an expense, no PDF is offered on the expense detail.

### Today's Updates (2026-09-08) — Procurement Approvals API + Reject Permission
- **`GET /procurement/assigned`** — new endpoint (`procurement.routes.js`, registered before `/:uuid` so the static path wins) returns procurement documents pending the logged-in user's role for approval. Permission: `procurement:approve`. Mirrors the expense module's `GET /expenses/assigned`.
- **`procurement.service.js`** — new `getAssigned(user, params)` function: resolves the user's role via `findRoleByCode`, builds a visibility-scoped where clause (GLOBAL_ROLES see all, MANAGER_ROLES company-scoped, requesters own), then filters by `current_role_id = user's role`. Uses the existing `procurementRepository.findAll` + `decryptRequest` + `maskVendorForRequester` pipeline.
- **`procurement.controller.js`** — new `getAssignedProcurements` controller, same pattern as `getAllProcurements` (paginated response).
- **New permission `procurement:print_pr`** (id 179, uuid `f1a2b3c4-d5e6-7890-fabc-123456789080`) — "View / print a Purchase Request as PDF". Granted to SUPER_ADMIN (100), ADMIN_MGR (106), ADMIN_JR (107). Permissions seeder `down()` bumped to 80. Frontend gates the "View / Print PR as PDF" button in `ProcurementDetail.jsx` behind `hasPermission('procurement:print_pr')`.
- **New permission `procurement:reject`** (id 178, uuid `f1a2b3c4-d5e6-7890-fabc-123456789079`) — separated from `procurement:approve` (which now has description "Approve procurement documents" only). Granted to SUPER_ADMIN (100), CFO (101), PAYMENT_MGR (102), FINANCE_MGR (104), ADMIN_MGR (106). Permissions seeder `down()` bumped to 79.
- **Reject route updated** — `POST /procurement/:uuid/reject` now uses `requirePermission('procurement:reject')` instead of `requirePermission('procurement:approve')`.

### Today's Updates (2026-09-08) — Derived Notifications API (no table)
Zero new tables/migrations — the bell feed is **computed live** from the existing `assigned`/`my-payments` where-clauses plus the handover trails. New `src/modules/notification/` module, auth-only, mounted at `/api/v1/notifications`.
- **`GET /notifications/count`** — `{ expenses, procurement, payments, total }` for the badge. COUNTs reuse the exact same visibility scoping as the assigned lists: expense assigned (`current_role_id = role`, `SUBMITTED`, company-scoped except global), procurement assigned (same scoping via `GLOBAL_ROLES`/`MANAGER_ROLES`), and payment requests (`current_role_id`, `APPROVED`/`PAID`, `payment_status NOT IN ('SETTLED','PAID')`).
- **`GET /notifications?limit=&type=&scope=`** — merged dropdown feed, newest-first. `type=assigned|activity`, `scope=expense|procurement`. Each item: `{ bundle, kind, module, uuid, ref, title, status, amount, at, link }`; `link` deep-links to `/expenses/:uuid` or `/procurement/:uuid`. Amounts AES-decrypted (`formatAmount`).
- **Assignment feed** = expense + procurement + payment rows pending the user's role (via the existing repositories).
- **Activity feed** = recent `expense_handovers`/`procurement_handovers` where `to_role_id = my role`, company-scoped; enabled only for manager/global roles. Procurement handovers are resolved to their parent header (PI/PR/PO via `pi_id`/`pr_id`/`po_id`) so they deep-link correctly.
- Scope/role/company helpers mirror `expense.service.js` (`EXPENSE_GLOBAL_ROLES`/`EXPENSE_MANAGER_ROLES`, imported) and `procurement.service.js` (`GLOBAL_ROLES`/`MANAGER_ROLES`, duplicated here).

### Today's Updates (2026-09-08) — Notification Feed Bugfix
- **Fixed `ReferenceError: expenseRoleIds is not defined`** in `notification.service.js` expense-activity feed. A cleanup pass removed the `expenseRoleIds` variable but left the reference at line 136; it should be `roleId` (the logged-in user's role). This made `GET /notifications` (the dropdown feed) throw a 500 for manager/global roles (e.g. CFO), and — because the frontend originally fetched count and feed in one `Promise.all` — a feed error also blanked the count badge to 0.
- Lesson for future edits: when a helper/repositories cleanup deletes a variable, grep the whole file for stale references before committing.

### Today's Updates (2026-09-08) — Procurement Expense Approval Flow + Admin Fulfilment
The procurement expense now runs a **fixed 6-step approval ladder** (no handover dropdown) and, once approved, is fulfilled by ADMIN_MGR: signed PO PDF + received quantities + vendor invoice. PO line items track delivered quantities, and a backstop blocks payment until every item is fully received. **Flow (2026-09-09 correction):** CFO → ADMIN_MGR → FINANCE_MGR → CFO → PAYMENT_MGR → **final CFO** → payment manager processes payment (the redundant middle CFO step was removed — the old 7-step ladder `…→ PAYMENT_MGR → CFO → CFO(final)` collapsed to 6).

- **Migrations**: folded directly into the existing create-table migrations (dev, no standalone files):
  - `20260724000011-create-expenses-table.js` — `expenses.flow_position` SMALLINT.UNSIGNED nullable + index `idx_expenses_flow_position`.
  - `20260806000003-create-procurement-tables.js` — `procurement_items.received_quantity` DECIMAL(10,2) NOT NULL DEFAULT 0 (never encrypted).
  - The standalone `20260908000001`/`20260908000002` add-column files were created, applied, then **removed** and their schema merged into the create-table migrations after the columns had drifted in (dev) — `sequelize_meta` cleaned of the stale records.
- **Seeders**:
  - `20260806000014-seed-procurement-expense-category.js` — `first_receiver_role_id` **101 (CFO)**, final approver **101 (CFO)** (first/final both CFO — the ordered ladder is driven by `flow_position`).
  - `20260806000013-seed-procurement-handover-rules.js` — includes `[102, 101]` (PAYMENT_MGR → CFO) for the final re-approval leg.
- **`expense.service.js` — fixed ladder + fulfilment**:
  - **`PROCUREMENT_EXPENSE_FLOW`** (exported): `[{1,CFO},{2,ADMIN_MGR},{3,FINANCE_MGR},{4,CFO},{5,PAYMENT_MGR},{6,CFO,final}]`. `approve()` branches on `category.module === 'procurement'` → `approveProcurementFlow(expense, user, remarks, ...)`: ignores `to_role_id`, advances purely by `flow_position` (position → next). The **final step (6)** gates on `allProcurementItemsReceived` and closes **`APPROVED` with `current_role_id` = PAYMENT_MGR** (payment manager processes payment), sets `final_amount`/`advance_amount`/`paid_amount` (via `computePaymentStatus([], finalAmount, 0)`), and logs a handover were fromRole→toRole. Intermediate steps log handover from current → next step's role. **`submit()`** (re)starts the ladder (`flow_position: 1`, handler CFO); **`reject()`** routes any rejection to **ADMIN_MGR** and clears `flow_position`. **Only CFO/ADMIN_MGR/FINANCE_MGR/PAYMENT_MGR/SUPER_ADMIN can act** (role gates per step).
  - **`allProcurementItemsReceived(expenseId)`** — finds the PO by `expense_id` and requires `every item received_quantity >= quantity` (false when the PO has no items).
  - **`recordPayment()`** — added backstop: on a procurement expense, `allProcurementItemsReceived` must pass or it throws "All PO items must be marked as received before payment". On settle, procurement expenses close as **`COMPLETED`** with `current_role_id` null (fully paid = done); travel/reimbursement keep the existing handler-return.
  - **New exported functions + endpoints** (all `requirePermission('expenses:update')`, which ADMIN_MGR holds):
    - `POST /expenses/:uuid/items-received` — `{ items: [{ procurement_item_id, received_quantity }] }`; procurement-only, status SUBMITTED, ADMIN_MGR/SUPER_ADMIN; each quantity **clamps to 0..ordered qty**, scoped to the expense's PO (`po_id` must match); returns the post-update expense. When at least one item is updated inside the transaction it now logs an **`ITEMS_RECEIVED` expense_handovers** row (`action_type: 'ITEMS_RECEIVED'`, from/to = the actor's role, `action_by_employment_id` = the actor, `remarks` = `"Items received: <item_name> ×<received>/<ordered>, …"`) — so the expense's approval trail shows **who marked the delivery and the received quantities**.
    - `POST /expenses/:uuid/documents` — `{ document_type: 'PO_PDF'|'INVOICE', url, original_file_name, file_size?, mime_type?, file_extension? }`; creates an `expense_documents` row with `module_name` = document_type, `module_record_id` null (header-level), `uploaded_by_employment_id` from the actor's active employment. Blocked on DRAFT/REJECTED/COMPLETED.
    - `DELETE /expenses/:uuid/documents/:documentUuid` — force-deletes a header-level document scoped to the expense.
  - **Chain PO node enriched for the expense-side PO PDF**: `buildProcurementChain` now returns the PO with `company` (letterhead/GST/PAN), `vendor_record` (full object **masked to null for the requester** — `vendor` stays the display string), `requestedByEmployment.user`, `notes`, `created_at`, `expected_delivery_date`, `total_amount`/`tax_amount`/`grand_total`; `mapItems` now emits both `item_name` and `name` plus `received_quantity`. The expense detail feeds this straight into the existing `PurchaseOrderPdfOverlay`.
- **`procurement.service.js` — `updateItems` freeze**: `PUT /:uuid/items` now rejects once **any quotation exists** on the PR (`ProcurementQuotation.count({ where: { pr_id } })` → badRequest "PR line items are locked once quotations exist — edit the quotations instead"). This is earlier and stricter than the old rule (which waited for QUOTATION_SELECTION).
- **Verified**: `expense.repository.js` `detailInclude` (via `listInclude`) already includes the `category` association, so `recordPayment`'s `expense.category?.module === 'procurement'` branch cannot silently no-op.

### Today's Updates (2026-09-10) — DB-driven Approval Flows (no more hardcoded ladder)
The procurement ladder is no longer a hardcoded array — it's **rows in a new `expense_flow_steps` table**, so editing a flow is a data change with zero deploys.

- **New table `expense_flow_steps`** (migration `20260910000001`): `category_id` FK → `expense_categories` (CASCADE), `step_position` SMALLINT (unique `(category_id, step_position)`), `role_id` FK → `roles`, `step_label` STRING(80), `is_final` BOOLEAN, `status` (ACTIVE/…), paranoid audit columns. New model `expense_flow_step.model.js` (auto-loaded; belongsTo `category` + `role`).
- **New column `expense_categories.flow_mode`** STRING(20) NOT NULL DEFAULT `'HANDOVER'` + index on the new table. `'FIXED'` = ladder-driven (procurement); `'HANDOVER'` = legacy `role_handover_rules` engine (travel/reimbursement). Dev DBs get `flow_mode='FIXED'` backfilled by the migration's `UPDATE … WHERE module='procurement'`.
- **Seeder `20260910000002-seed-procurement-expense-flow-steps.js`**: inserts the 6 steps for category 102 (PROCUREMENT) — 1 CFO review → 2 Procurement admin → 3 Finance manager → 4 CFO → 5 Payment manager → 6 CFO (final). Also re-flips `flow_mode='FIXED'` for procurement so **fresh installs** (where the migration ran on an empty table) work too.
- **`expense.service.js`**:
  - Removed `PROCUREMENT_EXPENSE_FLOW`. New `getActiveFlowSteps(categoryId)` returns `[{ position, roleId, roleCode, roleName, final }]` (active steps ASC, role joined).
  - `approveProcurementFlow` → **`approveFixedFlow`** — reads the step from the DB table by `flow_position` (stale-position stanzas still fall back to the last step); `approve()` now branches on **`category.flow_mode === 'FIXED'`** instead of `module === 'procurement'`. Final behavior unchanged (received-gate → APPROVED → PAYMENT_MGR).
  - `submit()` resolves the start handler from **step 1 of the DB ladder** for FIXED categories (falls back to `first_receiver_role_id` for HANDOVER) and still resets `flow_position: 1` on (re)submit. Handover-of-a-FIXED-flow error if the category has no steps.
- **`expense.repository.js`**: the `category` include now also loads `flowSteps` (alias) — `where: { status: 'ACTIVE' }`, `required: false` (so a HANDOVER category with zero steps keeps its full category row), `include: role`, ordered by `step_position`. → `GET /expenses*` payloads expose `category.flowSteps` and `category.flow_mode` at zero new endpoints.
- **API surface: none changed** — the ladder rides the existing expense detail/list payloads (`category.flowSteps`), so there is no new endpoint and no frontend rebuild needed when a step changes. (A future admin editor would add `GET /expense-categories/:uuid/flow` + step CRUD.)
- **PO-auto-created expense SUBMIT handover credits the actor** — `createProcurementExpense({ po, pr, t })` gained `actorRoleId`/`actorEmploymentId`; `createPo` passes the admin's role + employment. The initial `SUBMIT` expense_handovers row is now logged as **actor (ADMIN_MGR) → first receiver (CFO)** instead of requester → CFO, so the merged trail reads `Create_po · ADMIN_MGR` then `Submit · ADMIN_MGR → CFO` — never "through the requester". (The CREATED_PO chain log and the expense SUBMIT log used to visually imply admin → requester → CFO; only the SUBMIT actor/from changed.)
- **Fulfilment gate before ADMIN_MGR → FINANCE_MGR** — in `approveFixedFlow`, when the current step's handler role is `ADMIN_MGR` the approve now requires the **vendor invoice uploaded** (`hasProcurementInvoice`: an `expense_documents` row with `module_name='INVOICE'`, header-level) **and** `allProcurementItemsReceived` before advancing to the Finance manager. Error 400s: "Upload the vendor invoice before approving to the Finance manager" / "Mark all PO items as received before approving…". The final CFO step keeps its existing received-items gate; the invoice gate is only at the admin→finance transition.

### Today's Updates (2026-09-10) — Payment Encryption, Paid-Amount Doubling, and List Fixes
- **`expense_payments.amount` was stored plaintext** — `encryptAmounts` only matches keys ending `_amount`/`exchange_rate`; the column is literally `amount`, so the AES hooks never touched it. `expense_payment.model.js` `beforeCreate`/`beforeUpdate` now call `encrypt()` on `amount` explicitly, and `decryptAmounts` in `utils/encryption.js` also decrypts the bare `amount` key (only `ExpensePayment` rows carry a field named exactly `amount`) so `getPayments`/`getPaymentSummary`/`recordPayment` reads decode it. The existing payment row was backfilled to ciphertext.
- **`paid_amount` was doubling on every record** — `recordPayment` ran `findAndCountAll` **after** the payment `create`, so `existingPayments.rows` already included the new installment, then the code appended it again: one ₹494,029.2 payment produced `paid_amount` = ₹988,058.40. Fix: `allPayments = existingPayments.rows.map(...)` (no re-append). The stored `paid_amount` on the affected expense was backfilled.
- **`(intermediate value) is not iterable`** — `findAndCountAll` returns `{ count, rows }`, an object, not an array; the code array-destructured `const [existingPayments] = await …findAndCountAll()`, which threw at runtime (and a first fix attempt then hit `undefined.map`). `recordPayment` now uses the result object directly. (Root-caused via the day's `logs/…/error.log` stack — `expense.service.js:1292`/`:1298`.)
- **Procurement lists hide converted chains** — `procurement.repository.js:findAll` (all-types projection behind the "All Requests" / "My Requests" tabs) now drops rows whose PO carries a **non-null `expense_id`** — i.e. a chain that already spawned an expense is no longer listed. Nothing is deleted; the dedicated type-filtered PI/PR/PO views still show them for auditability.
- **Role-permission matrix additions** — `20260724000007-seed-role-permissions.js` gained 22 new `(role_id, permission_id)` pairs (verified already present in the dev DB, so no live insert). Adds view/create perms only, no revocations: **CFO (101)** `roles:read`, `expense_categories:read`; **PAYMENT_MGR (102)** `users:read`, `expense_categories:read`; **FINANCE_MGR (104)** `companies:read`, `expense_categories:read`; **TRAVEL_MGR (108)** `users:read`/`companies:read`/`departments:read`/`expense_categories:read` + `reimbursements:create/read/update`; **HOD (110)** `users:read`, `vendor_categories:read`; **EMP_MGR (111)** `users:read`, `companies:read`, `departments:read`, `vendors:read`, `vendor_categories:read`, `roles:read`, `expense_categories:read`.
- **Final-approval trail shows correct destination role** — `expense.service.js` logged the closing APPROVE handover with `toRoleId: fromRole` (rendered as "Approve CFO → CFO") even though the expense actually routed to the payment handler. Now logged as the real destination: `approve()` uses `paymentHandlerRoleId` (requester role for travel/reimbursement, ADMIN_MGR for procurement) and `approveFixedFlow()` uses `paymentMgr?.id`. Backfilled mis-logged dev-DB rows (handover h12 → TRAVEL_MGR 108; h8 → PAYMENT_MGR 102).
- **Single terminal state: COMPLETED for every module** — `recordPayment` settlement previously closed procurement expenses as `COMPLETED` (no handler) but left travel/reimbursement as `APPROVED` with the requester re-attached as handler. Now all fully paid/settled expenses close as **`COMPLETED`** with `current_role_id`/`current_employment_id` null (the old `settledHandler`/ADMIN_MGR re-route branch was removed). Backfilled travel exp2 (`status APPROVED→COMPLETED`). Frontend `StatusBadge`/`ExpenseDetail` already render COMPLETED; `MyExpenses` added `COMPLETED` to `STATUS_OPTIONS`.

### Today's Updates (2026-09-09) — Payments Report module (Finance / CA, read-only)
- **New `reports` module** (`src/modules/reports/reports.{routes,controller,service,repository}.js`) mounted at `router.use('/reports', ...)` in `src/routes/index.js`:
  - `GET /reports/payments` — paginated **payment ledger** (page/limit/sortBy/sortOrder/search + filters). Filters: `dateFrom`/`dateTo` (on `payment_date`), `module` (`$expense.category.module$`), `companyUuid` (resolved via company repo), `paymentMethod`, `paymentType` (ENUM values), `expenseStatus` (`$expense.status$`), `paymentStatus` (`$expense.payment_status$`), `search` (title/expense_number/reference_number, %/_ escaped). Sort whitelist: payment_date (default, DESC), reference_number, payment_method, payment_type, created_at.
  - `GET /reports/payments/summary` — totals computed **in JS over decrypted amounts** (encrypted columns can't aggregate in SQL): `total_disbursed` / `total_refunds` / `net_paid` / `payment_count` / `disbursement_count` / `refund_count`, `by_module`, `by_company`, `by_month`, and `outstanding {count, amount_due}` from approved not-settled expenses (`amount_due = final − advance − paid`). Disbursement types = PARTIAL/FULL/ADDITIONAL; the rest are refunds.
  - `GET /reports/payments/export` — full filtered result as **BOM-prefixed CSV** (`\uFEFF`) with `Content-Disposition: attachment; filename="payments-report-YYYYMMDD.csv"`.
- **Permission gating**: all three behind `requirePermission('payments:reports')` (module-wide `authMiddleware`). Scope: `REPORT_GLOBAL_ROLES = ['SUPER_ADMIN','CFO']` see every company; `REPORT_MANAGER_ROLES = ['SUPER_ADMIN','CFO','PAYMENT_MGR','PAYMENT_JR','FINANCE_MGR','FINANCE_JR']` are company-scoped via `getActiveCompanyIdsByUser`; any other role → `ApiError.forbidden`.
- **New permission id 180**: `payments:reports` (`f1a2b3c4-d5e6-7890-fabc-123456789081`, resource `payments`, action `reports`) added to seeders `20260724000006` (permission row) and `20260724000007` (grants `[100,180]`..`[105,180]`); **permissions seeder `down()` length bumped 80 → 81** (ids 100-180). The dev DB was updated via SQL (permission 180 + 6 role grants) since the seeders were already applied.
- **Data notes**: `expenses` has no procurement PO/PR columns — vendor comes via `hasOne expense.procurementOrder` → `ProcurementOrder.vendor` (its number column is `document_number`, not `po_number`; travel/reimbursement → null). `proofCount` = literal subquery `(SELECT COUNT(*) FROM expense_payment_proofs p WHERE p.expense_payment_id = ExpensePayment.id)` with `findAndCountAll({ distinct: true })`.
- **Reimbursement advances count as disbursements** — `reports.service.js` synthesizes one `ADVANCE` payment row per reimbursement expense with `advance_amount > 0` via `buildSyntheticAdvances(rows)` (operation in `mapPayment`-mapped rows; `uuid` = `advance-<expense uuid>`, `payment_date` = the expense's earliest recorded payment ?? `submitted_at`, method/type `ADVANCE`) and merges it into the ledger, summary, and CSV. `DISBURSEMENT_TYPES` = `PARTIAL/FULL/ADDITIONAL/ADVANCE`, so the synthetic rows land in `total_disbursed`/`disbursement_count` and the by_module/by_company/by_month aggregates. No `paymentType` filter is offered for `ADVANCE` (it's synthetic — the filter queries the real `expense_payments.payment_type` column, which has no ADVANCE ENUM value).
- **Per-expense net view (`summary.by_expense`)** — the payments summary now also groups the merged rows (recorded payments + synthetic advances) by expense uuid: `{ expense_uuid, expense_number, title, module, category_name, company_name, advance, disbursed, refunded, net: disbursed − refunded }`. This is the CA-level "what did this expense really cost" line — e.g. advance 800 + ADDITIONAL 200 → `advance 800, disbursed 1000, net 1000`; advance 900 + ADVANCE_REFUND 300 → `advance 900, refunded 300, net 600`. More expense entries up-front; Net out is negative only when refunds exceed disbursements (never for an advance). Each row also carries the **latest transaction date per column** (`advance_date` = the synthetic ADVANCE row's date, `disbursed_date`/`refund_date` = latest payment/refund date, `last_date` = overall latest), shown under the amounts in the UI.

### Today's Updates (2026-09-10) — Standalone per-expense net endpoint + expense-list filter fix
- **`GET /reports/payments/by-expense`** — paginated **per-expense net summary** (one row per expense, grouped in JS from the merged payment + synthetic-advance rows). Same filters as the ledger (`buildWhere`); sort whitelist `expense_number/title/advance/disbursed/refunded/net/last_date` with **`last_date` DESC as the default** (latest payment activity first; null `last_date` rows sort to the end via the null-safe comparator). Returns `{ rows, total, page, limit, totalPages }` via `ApiResponse.paginated`. Service `getExpenseNetSummary`; controller `getExpenseNetSummary`.
- **`GET /reports/payments/by-expense/export`** — BOM-prefixed CSV of the full filtered net view (columns: Expense No., Title, Module, Category, Company, Advance(+date), Paid Out(+date), Refunded(+date), Net, Last Activity), `Content-Disposition: attachment; filename="expense-net-YYYYMMDD.csv"`. Service `exportExpenseNetCsv`; controller `exportExpenseNet`. **Route order matters**: both new routes are registered **before** `/payments/export` and `/payments` in `reports.routes.js`.
- **Expense-list filter bug fixed** (`expense.repository.js`) — the `category` filter used `where: { '$category.name$': … }` and search used `'$company.name$'`; under Sequelize's subquery pagination (auto-enabled by `limit`/`offset`/`distinct`) these generate `Unknown column '…' in 'where clause'` — the JOIN lives on the outer query while the `where` runs inside the LIMIT subquery, and the `category` include carries nested models that force the split. Two-part fix: (1) `findAll` now **resolves the category name → `id`** (`ExpenseCategory.findOne`) and filters `category_id` directly (`-1` when no such category → empty list); (2) added **`subQuery: false`** to `findAndCountAll` so joined-column filters (`$company.name$` search) work at all — `listInclude` is single-row only (belongsTo/hasOne), so plain LIMIT/OFFSET pagination stays correct. Verified live against all expense list filters (status / search title / search company / date range / category / combined).
- **List defaults sort by `updated_at` DESC** — expense (`/expenses`, `/expenses/my`, `/expenses/assigned`, `/expenses/my-payments`) and procurement (`/procurement` incl. `scope=mine`, `/procurement/assigned`) lists now default to **most recently updated first**: sort fallback is `params.sortBy || 'updatedAt'` and `DEFAULT_SORT = [['updatedAt','DESC']]` in both `expense.repository.js` and `procurement.repository.js`. Procurement's JS re-sort was also fixed to sort the rows actually returned (`listRows`) — it previously sorted `visibleRows`, a separate filtered copy in the all-types path, so the projected list was never re-ordered by the sort key.
- **Uploads organized per module in nested folders** (`upload.routes.js`) — `POST /uploads` now accepts a **nested** `folder` (regex `^[a-z0-9_/-]+$`, backslashes normalized; dots rejected so `..` traversal is impossible) and writes files into `uploads/<folder>/…` under `backend/uploads`. Canonical layout: `users/profile`, `companies/logo`, `vendors/logo`, `vendors/documents`, `expenses/attachments` (travel/reimbursement line items), `expenses/documents` (PO_PDF/INVOICE), `expenses/proofs` (payment proofs), `procurement/quotations`. **Existing DB-referenced files were physically moved to their canonical folder and every `file_path`/`logo_img`/`profile_image` row URL rewritten to match** (one-off script, since deleted); unreferenced/legacy files were consolidated into `uploads/_orphaned/`. Old URLs keep working only for rows that still point at them — the canonical folders are the source of truth going forward.

### Today's Updates (2026-09-12) — Payment history shows who processed it
- **`getPayments` returns `processed_by`** (`expense.service.js`) — the `ExpensePayment.findAll` include chain now adds `{ model: UserEmployment, as: 'processedByEmployment', include: [{ model: User, as: 'user' }] }`, and each returned payment carries `processed_by` = `[first_name, last_name].filter(Boolean).join(' ') || email` from that user (null when the employment/user is missing). The frontend renders it as `… · Processed by <name>` on the payment-history line (no new endpoint — same `GET /expenses/:uuid/payments`).

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
