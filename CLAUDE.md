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
│   ├── auth/                     # Login (JWT), authMiddleware, requireRole, optionalAuth
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
npm run seed              # run seeders
```

> **Dev port:** backend runs on **3015** (`PORT=3015` in `.env`). The frontend's `VITE_API_URL` and hardcoded fallbacks (`src/services/api.js`, `src/utils/assets.js`, `.env.example`) all point at `http://localhost:3015/api/v1`. Keep these in sync if the port ever changes.

## What's Built / What's Pending

### API Modules
- [x] Authentication / Authorization — JWT login, authMiddleware, requireRole, **requirePermission** (async: checks the user's role has a given `permission_key` from `role_permissions`; used to gate `POST /procurement` and `POST /procurement/:uuid/submit` on `procurement:create`)
- [x] User API — CRUD by UUID, **paginated list** (page/limit/search/status/sort), create/update with employments, **GET /users/me** (full profile), GET /users/:uuid returns profile
- [x] Company API — CRUD by UUID + **GET /companies/options**
- [x] Department API — CRUD by UUID + **GET /departments/options**
- [x] Role API — CRUD by UUID + **GET /roles/options**
- [x] Permission API — CRUD by UUID
- [x] UserEmployment API — CRUD by UUID
- [x] Expense API — CRUD by UUID. **Combined create supports Travel AND Reimbursement** in one transaction; `estimated_amount` is computed server-side from the line items (not trusted from the client). **Scoped lists** — `GET /expenses/my` (own expenses), `GET /expenses` (role+company scoped: SUPER_ADMIN/CFO/**ADMIN_MGR** see all — ADMIN_MGR is global so it can see the procurement-converted expenses it creates — other expense-manager roles see only companies they're employed in), both server-side paginated (`page/limit/search/status/category/sort`); DRAFT expenses are editable by the creator only
- [x] **Expense approval flow** — `POST /expenses/:uuid/{submit,approve,reject}` (`actionSchema` = optional remarks). Handover hops validated against `role_handover_rules` with `module='expense'` (seeded: ADMIN_MGR→CFO, SUPER_ADMIN→CFO). `submit` moves a DRAFT to SUBMITTED with the category's first receiver as handler; `approve` forwards the current handler to the category's final approver (rule-checked) and closes the expense as **APPROVED** when the **final approver** approves; `reject` closes it as REJECTED. Each action logs an `expense_handovers` row (SUBMIT/APPROVE/REJECT) and returns the post-update state read inside the same transaction
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
- [x] **PR → expense conversion** — `POST /procurement/:uuid/convert-to-expense` (`SUPER_ADMIN`/`ADMIN_MGR`) turns a **quotation-approved PR** (`QUOTATION_APPROVED`/`APPROVED`, i.e. it has a `SELECTED` quotation) into an expense (category `PROCUREMENT`, SUBMITTED, handler ADMIN_MGR, amount = the selected quotation's grand total). **Duplicate guards**: rejected if the PR already has a PO (the PO's auto-created expense is the source of truth) or if an expense already exists for the PR (`expenses.procurement_pr_id`). **`create-po` reuses an existing PR-linked expense** instead of creating a second — the PO is attached to the same expense (`procurement_po_id`) so there is exactly **one expense per chain** regardless of which path runs first. PR detail includes its `expenses`.
- [x] **Procurement quotations (blind vendor)** — PI creation takes **no vendor** (requester must not know who might supply). The vendor enters only via **quotations**: admin fills one or more quotations on a PR (`POST/PUT/DELETE /procurement/:uuid/quotations`). **Each quotation carries its own line items** (polymorphic `procurement_items` rows with `quotation_id`) — item name, qty, unit price, and a per-item `tax_rate` (stored plain, not encrypted). Totals are computed **server-side** from the items (qty × price × tax), never trusted from the client. Quotation API accepts `{ vendor_uuid, valid_until, notes, items[] }` (comments → `notes`; `title`/`total_amount`/`tax_amount`/`terms` were dropped from the contract). Quotations are **editable until the requester selects** (statuses SUBMITTED/HOD_APPROVED/QUOTATION_SELECTION). **PR line items lock earlier** — `updateItems` is allowed only while SUBMITTED/HOD_APPROVED (`PR_ITEM_EDITABLE_STATUSES`); once `submit-quotations` moves the PR to `QUOTATION_SELECTION` the admin can no longer change the qty/prices the requester is comparing (quotations themselves stay editable through selection). Then `submit-quotations` moves the PR to `QUOTATION_SELECTION` with the requester as handler. The requester then **selects one quotation blind** (`select-quotation`) — the vendor stays masked but the requester **sees the line items + prices** to compare; the chosen quotation sets the PR's `vendor_id` and moves the PR to `QUOTATION_APPROVED` for CFO. The vendor stays hidden from the requester even on the final PO. Quotation files are `procurement_documents` rows linked via `procurement_quotation_id`. PI line items carry only **quantity + unit price** — no `unit`, no `tax_rate` (tax is applied at the quotation stage, not the intent); PI/PR item endpoints reject `tax_rate` (only quotations accept it, via a dedicated `quotationItemSchema`).
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
- [x] Umzug v3 migration/seed scripts (migrate, rollback, seed)

### Key Implementation Details
- **UUID-based lookups** — all APIs use UUID, not auto-increment ID
- **UUID resolution** — API accepts `*_uuid` in body, service resolves to internal ID
- **Encrypted amounts** — all `*_amount` and `exchange_rate` fields auto-encrypted via Sequelize hooks
- **Combined endpoints** — `POST /api/expenses` creates expense + travel + child items in one transaction
- **Per-item attachments** — `expense_documents` link each uploaded file to its own sub-part record (`module_name` = travel_segment / travel_accommodation / travel_forex / travel_local_transport / travel_misc_expense / reimbursement_item)
- **Approval chain** — `expense_categories` define first/final approver roles, `role_handover_rules` define handover paths
- **Password hashing** — passwords bcrypt-hashed on create and update (fixed plaintext bug)
- **UUID auto-generation** — every model's `uuid` has `defaultValue: UUIDV4` (fixed "uuid cannot be null" on create)
- **Per-employment email** — `user_employments.email` column (a user can have a different email per company)
- **Lightweight options** — `/roles|companies|departments/options` return only `[{ uuid, name }]` for dropdowns
- **Shared data-access lives in owning modules** — employment helpers (`getEmploymentIdsByUser`, `getActiveCompanyIdsByUser`, `getActiveEmploymentByUser`, `getActiveEmploymentByUserAndCompany`) live in the **`user_employment`** module; company/role uuid resolution goes through the **`company`**/**`role`** repositories; `decryptResults` lives in **`encryption.js`**. Other modules import these instead of re-querying models inline (see `user_employment.service.js`, `company.repository.js`, `role.repository.js`, `utils/encryption.js`).

## Procurement Module — BUILT

Full chain implemented: `PI (Purchase Intention) → PR (Purchase Request) → Quotation → PO (Purchase Order) → Received → Finance → CFO (re-approval) → Payment`.

- **Schema** (`20260806000003-create-procurement-tables.js`): **three header tables** — `procurement_intentions`, `procurement_requests`, `procurement_orders` — chained via explicit FKs (`prs.pi_id`, `pos.pr_id`). Child tables (`procurement_items`, `procurement_handovers`, `procurement_documents`) are **polymorphic**: nullable `pi_id`/`pr_id`/`po_id`/`quotation_id`, exactly one set per row. `procurement_items` also carries a **plain `tax_rate`** column (a percentage, not encrypted — only amounts are). Encrypted amounts (`total_amount`/`tax_amount`/`grand_total`, item `unit_price`/`total_with_tax`, handover `amount_at_step`) stored as TEXT.
- **Quotations**: `procurement_quotations` — one row per vendor quote on a PR (`pr_id`, `vendor_id`, encrypted `total_amount`/`tax_amount`/`grand_total`, `valid_until`, `notes`, status `ACTIVE/SELECTED/REJECTED`). **Each quotation has its own line items** (`procurement_items.quotation_id`) carrying that vendor's prices/tax. `procurement_documents.procurement_quotation_id` lets each quotation carry its own files — a quotation-linked document is stored **only** under the quotation (no header owner column), so it doesn't duplicate into the PR's Documents section. Quotations are **editable until the requester selects one** (statuses SUBMITTED/HOD_APPROVED/QUOTATION_SELECTION), then they lock; deleting a quotation force-deletes its items.
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
