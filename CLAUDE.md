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
│   │   └── ...                   # 21 models total
│   ├── migrations/               # 20 migrations in FK-safe order
│   ├── migrate.js                # Run: node src/database/migrate.js
│   ├── seed.js                   # Run: node src/database/seed.js
│   └── rollback.js               # Run: node src/database/rollback.js
├── modules/
│   ├── auth/                     # Login (JWT), authMiddleware, requireRole, optionalAuth
│   ├── upload/                   # Image upload (multer) → serves /uploads
│   ├── group/                    # Read-only groups (GET /groups, /groups/options) — for company group dropdown
│   ├── user/                     # CRUD + paginated list + GET /users/me
│   └── company, department, role, permission, user_employment,
│       role_permission, role_handover_rule, expense_category, expense, reimbursement, travel_*  # CRUD modules
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

## Database — 21 Tables

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

### Future models planned
- Procurement
- GeneralExpense

## Common Patterns
- **Soft deletes:** `paranoid: true` on every table + `deleted_at` column
- **Audit trail:** `created_by_employment_id`, `updated_by_employment_id`, `deleted_by_employment_id` on all tables
- **UUID:** Every table has a `uuid` field
- **Money:** `DECIMAL(15,2)` for amounts, `DECIMAL(15,6)` for exchange rates
- **Employment-based tracking:** Audit fields use employment ID, not user ID

## Scripts
```bash
npm run dev               # nodemon
npm start                 # production
npm run migrate           # run migrations
npm run migrate:rollback  # rollback last batch
npm run seed              # run seeders
```

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
- [ ] ExpenseHandover API

### Seeders (10 files)
- [x] Groups — Kings Group Ventures (KGV)
- [x] Roles — 13 roles (SUPER_ADMIN → EMPLOYEE)
- [x] Departments — 10 departments
- [x] Companies — 28 companies under KGV
- [x] Permissions — 35 permissions across 9 modules
- [x] RolePermissions — role-permission assignments
- [x] ExpenseCategories — Travel category
- [x] Users — one user per role (12 users + SUPER_ADMIN)
- [x] RoleHandoverRules — travel module approval chain
- [ ] RoleHandoverRules for other modules

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
