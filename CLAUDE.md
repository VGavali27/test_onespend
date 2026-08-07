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
| expenses | → expense_categories, companies, user_employments, roles |
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

### Procurement Module (4)
| Table | Key FKs |
|---|---|
| procurement_requests | → companies, vendors, user_employments, roles (+ self-FK `parent_id` chains PI → PR → PO) |
| procurement_items | → procurement_requests |
| procurement_handovers | → procurement_requests, roles, user_employments |
| procurement_documents | → procurement_requests (quotation / invoice / delivery files) |

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
- [x] Authentication / Authorization — JWT login, authMiddleware, requireRole
- [x] User API — CRUD by UUID, **paginated list** (page/limit/search/status/sort), create/update with employments, **GET /users/me** (full profile), GET /users/:uuid returns profile
- [x] Company API — CRUD by UUID + **GET /companies/options**
- [x] Department API — CRUD by UUID + **GET /departments/options**
- [x] Role API — CRUD by UUID + **GET /roles/options**
- [x] Permission API — CRUD by UUID
- [x] UserEmployment API — CRUD by UUID
- [x] Expense API — CRUD by UUID. **Combined create supports Travel AND Reimbursement** in one transaction; `estimated_amount` is computed server-side from the line items (not trusted from the client). **Scoped lists** — `GET /expenses/my` (own expenses), `GET /expenses` (role+company scoped: SUPER_ADMIN/CFO see all, other expense-manager roles see only companies they're employed in), both server-side paginated (`page/limit/search/status/category/sort`); DRAFT expenses are editable by the creator only
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
- [x] **Procurement API** — `/procurement`. One document row per PI/PR/PO chained via `parent_id`. **Workflow actions**: `submit` / `approve` / `reject` / `create-pr` / `create-po` / `received` / `pay`. Totals computed server-side (qty × price × tax); amounts AES-encrypted. Every role→role hop is **validated against `role_handover_rules` (module='procurement')** — the chain (PI → ADMIN_MGR → PR → HOD → quotation → CFO → PO → Received → FINANCE_MGR → CFO → PAYMENT_MGR) stays configurable. Handovers logged with an encrypted `amount_at_step` snapshot. Documents attached per request (quotation/invoice/delivery). Role-scoped list (SUPER_ADMIN/CFO all, managers company-scoped, requesters own).
- [x] **Procurement quotations (blind vendor)** — PI creation takes **no vendor** (requester must not know who might supply). The vendor enters only via **quotations**: admin fills one or more quotations on a PR at `HOD_APPROVED` (`POST/PUT/DELETE /procurement/:uuid/quotations`, amount totals AES-encrypted in `procurement_quotations`), then `submit-quotations` moves the PR to `QUOTATION_SELECTION` with the requester as handler. The requester then **selects one quotation blind** (`select-quotation`) — vendor and quotation files are masked from them (they see only totals/terms); the chosen quotation sets the PR's `vendor_id` and moves the PR to `QUOTATION_APPROVED` for CFO. The vendor stays hidden from the requester even on the final PO. Quotation files are `procurement_documents` rows linked via `procurement_quotation_id`. PI line items carry only **quantity + unit price** — no `unit`, no `tax_rate` (tax is applied at the quotation stage, not the intent); the PI create/update schemas also omit `payment_terms` and `delivery_address` (unknown to the requester at intent time).
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
- [x] ProcurementPermissions — `procurement:create/read/update/approve/po/received/pay` (ids 135–141) + role grants
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

- **Schema** (`20260806000003-create-procurement-tables.js`): `procurement_requests` (one row per PI/PR/PO chained via `parent_id`), `procurement_items`, `procurement_handovers`, `procurement_documents`. Encrypted amounts (`total_amount`/`tax_amount`/`grand_total`, item `unit_price`/`total_with_tax`, handover `amount_at_step`) stored as TEXT.
- **Quotations** (`20260807000001`): `procurement_quotations` — one row per vendor quote on a PR (`vendor_id`, encrypted `total_amount`/`tax_amount`/`grand_total`, `valid_until`, `terms`, status `ACTIVE/SELECTED/REJECTED`). `20260807000002` adds nullable `procurement_documents.procurement_quotation_id` so each quotation carries its own files.
- **Workflow engine** (`src/modules/procurement/procurement.service.js`): `submit` / `approve` / `reject` / `create-pr` / `create-po` / `received` / `pay`. Each role→role hop is validated against an ACTIVE `role_handover_rules` row with `module='procurement'` (seeded in `20260806000013`). Totals computed server-side from items (qty × price × tax).
- **Vendor linkage**: `procurement_requests.vendor_id` → `vendors` (link to the Vendors master).
- **Permissions**: `procurement:*` (ids 135–141) + role grants (seeder `20260806000012`).
- **Expense category**: `PROCUREMENT` (module='procurement') seeded for future expense conversion.

### Deferred (documented follow-ups)
- **Expense conversion** — `expenses.procurement_id` + "Convert to Expense" action (category `module='procurement'`, status APPROVED).
- **Multiple PIs → one PO** — add a `procurement_links` junction (`request_id`, `linked_request_id`).
- Frontend lives in the frontend repo (Procurement section — list, create PI, detail with action bar + handover timeline + documents).
