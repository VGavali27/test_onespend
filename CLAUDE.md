# test_onespend — Enterprise Expense Management API

## Overview
Multi-role expense tracking & approval platform. Users submit expenses (Travel, and future Reimbursement/Procurement/General) that flow through role-based approval chains.

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
│   │   └── ...                   # 19 models total
│   ├── migrations/               # 19 migrations in FK-safe order
│   ├── migrate.js                # Run: node src/database/migrate.js
│   ├── seed.js                   # Run: node src/database/seed.js
│   └── rollback.js               # Run: node src/database/rollback.js
├── modules/
│   └── user/                     # Only active API module (CRUD complete)
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

## Database — 19 Tables

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

### Expense Module (11)
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

### Future models planned
- Reimbursement
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
- [x] All 19 models + migrations
- [x] User API module (CRUD)
- [x] Reusable ApiError + ApiResponse + errorHandler
- [x] Validation middleware (Joi)
- [ ] API modules for Group, Company, Department, Role, Permission, UserEmployment
- [ ] API modules for Expense, ExpenseCategory, TravelExpense, etc.
- [ ] Authentication / Authorization
- [ ] Seeders for all tables
