# FinTrack — Enterprise Expense Management Frontend

## Overview
React frontend for the enterprise expense management platform. Provides role-based dashboards, expense tracking, approval workflows, and admin management UI. Connects to the backend API (`dev_backend`).

## Tech Stack
- **Framework:** React 19 (functional components only)
- **Build tool:** Vite 8
- **Styling:** Tailwind CSS v4 + custom design system
- **Icons:** Lucide React
- **Routing:** React Router v7
- **HTTP:** Axios (for API calls)
- **Tables:** TanStack Table v8 (wrapped in reusable `DataTable`)
- **State:** React Context (Auth, Theme)
- **Forms/Validation:** React Hook Form + Zod (via `zodResolver`)
- **Dates:** react-datepicker (wrapped in themed `DatePicker` + `DateField` RHF helper)

## Folder Structure
```
src/
├── App.jsx                        # Root — providers + <AppRoutes/>
├── main.jsx                       # Entry point
├── index.css                      # Design system + Tailwind theme
├── routes/
│   └── index.jsx                  # Route tree (pages lazily code-split via React.lazy)
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx          # Layout wrapper (sidebar + navbar + outlet)
│   │   ├── Sidebar.jsx            # Collapsible permission-based nav (accordion, submenu icons, guide line, query-aware active leaf)
│   │   └── Navbar.jsx             # Top bar — search, theme, notifications, profile menu
│   ├── ui/                        # Reusable UI components
│   │   ├── DataTable.jsx          # Generic TanStack table (self-managed fetchFn mode)
│   │   ├── DataTablePage.jsx      # Listing page shell (header + search + DataTable)
│   │   ├── Modal.jsx              # Reusable modal dialog
│   │   ├── ImageUpload.jsx        # Drag-&-drop image picker (shape="circle"|"square", icon override) → POST /uploads
│   │   ├── DatePicker.jsx         # Themed date/date-time picker (react-datepicker) + DateField RHF helper
│   │   ├── StatusBadge.jsx        # ACTIVE/INACTIVE/BLOCKED status pill
│   │   ├── PageHeader.jsx         # Standard page header (title/subtitle/icon + back)
│   │   ├── ErrorState.jsx         # Full-card load-error state with retry
│   │   ├── Toast.jsx              # ToastProvider + useToast — success/error toasts (mounted in App.jsx)
│   │   ├── detail.jsx             # Read-only view primitives: InfoCard, InfoRow, Detail, DetailHeader (back + edit)
│   │   ├── form.jsx               # Form primitives: inputClass/For, FormSection, FormField
│   │   ├── SearchableSelect.jsx   # Searchable combobox (Select2-style) for picking from lists
│   │   └── PermissionGuard.jsx    # Route-level permission guard (checks user.permissions array)
│   └── ProtectedRoute.jsx         # Auth guard — redirects to /login if unauthenticated; optional permission check
├── context/
│   ├── AuthContext.jsx            # Auth state, login/logout, JWT management, hasPermission(perm) helper
│   └── ThemeContext.jsx           # Dark/light theme + font family/size preferences
├── data/
│   └── menuConfig.js              # Permission-based menu config; items have `permission` key; '*' = all authenticated
├── pages/
│   ├── auth/
│   │   └── Login.jsx              # Split-panel login (real API)
│   ├── dashboard/
│   │   └── Dashboard.jsx          # Stats cards, charts, activity feed
│   ├── master/
│   │   ├── users/                 # Users: list / add / edit / view
│   │   │   └── Users.jsx, CreateUser.jsx, EditUser.jsx, UserForm.jsx, ViewUser.jsx
│   │   ├── companies/             # Companies: list / add / edit / view
│   │   │   └── Companies.jsx, CreateCompany.jsx, EditCompany.jsx, CompanyForm.jsx, ViewCompany.jsx
│   │   ├── departments/           # Departments: list / add / edit / view
│   │   │   └── Departments.jsx, CreateDepartment.jsx, EditDepartment.jsx, DepartmentForm.jsx, ViewDepartment.jsx
│   │   ├── vendors/               # Vendors: list / add / edit / view (contacts, addresses, bank accounts, documents, categories)
│   │   │   └── Vendors.jsx, CreateVendor.jsx, EditVendor.jsx, VendorForm.jsx, ViewVendor.jsx
│   │   └── vendorCategories/      # Vendor Categories: list / add / edit / view
│   │       └── VendorCategories.jsx, CreateVendorCategory.jsx, EditVendorCategory.jsx, VendorCategoryForm.jsx, ViewVendorCategory.jsx
│   ├── access/                    # Access Control
│   │   ├── roles/                 # Roles: list / add / edit / view
│   │   ├── permissions/           # Permissions: list / add / edit / view
│   │   ├── rolePermissions/       # RolePermissions: assign permissions to a role (sync)
│   │   └── roleHandoverRules/     # RoleHandoverRules: list + Role-Permissions-style editor (sync)
│   ├── profile/
│   │   └── Profile.jsx            # My Profile page (navbar menu → GET /users/me)
│   ├── expenses/                  # MyExpenses (own), AllExpenses (scoped list), CreateExpense (real API create), ExpenseDetail (real API view)
│   ├── procurement/               # Procurement: list (tabs: All/My), Create PI, Edit PI, Detail (actions, quotations, timeline, docs)
│   ├── finance/
│   │   └── categories/            # Expense Categories: list / add / edit / view (routed + menu under Master Data → /master/categories)
│   └── settings/
│       └── Settings.jsx           # Appearance, font family, font size
├── services/                      # ALL API calls live here — one file per domain
│   ├── api.js                     # Shared axios client + JWT/401 interceptors + crud() helper
│   ├── authService.js             # /auth (login)
│   ├── expenseService.js          # /expenses (scoped list), /expenses/my (own)
│   ├── travelService.js           # /travel-* (segments, forex, misc...)
│   ├── masterService.js           # /companies, /departments, /users, /user-employments, /users/me
│   ├── accessService.js           # /roles, /permissions, /role-permissions, /role-handover-rules (+sync), /roles/options
│   ├── financeService.js          # /expense-categories
│   ├── vendorService.js           # /vendors, /vendors/options, /vendor-documents, /vendor-categories (+/options)
│   ├── procurementService.js      # /procurement (CRUD + workflow actions + quotations + documents)
│   ├── dashboardService.js        # /dashboard
│   └── uploadService.js           # POST /uploads (image upload)
├── validations/                   # Shared Zod schemas — one file per form/domain
│   ├── userFormSchema.js          # User create/edit form schema + EMPLOYMENT_TYPES
│   ├── authSchema.js              # Login form schema
│   ├── companySchema.js           # Company create/edit form schema (full detail)
│   ├── departmentSchema.js        # Department create/edit form schema
│   ├── expenseCategorySchema.js   # Expense category create/edit form schema
│   ├── vendorCategorySchema.js    # Vendor category create/edit form schema
│   ├── roleSchema.js              # Role create/edit form schema
│   ├── permissionSchema.js        # Permission create/edit form schema
│   └── expenseSchema.js           # Expense create form — category/company + Travel (segments, accommodations, forex, transports, misc) + Reimbursement line items; amounts as strings (backend encrypts)
│   └── procurementSchema.js       # Procurement create/edit form schema (qty + unit price only)
└── utils/
    ├── assets.js                  # resolveAssetUrl(path) — backend asset path → absolute URL
    ├── format.js                  # formatDate, nullIfEmpty, formatType, formatCurrency
    ├── user.js                    # getFullName, getInitials
    ├── table.js                   # sortRows (client-side sort for DataTable)
    └── formErrors.js              # applyServerErrors — map 422 errors onto RHF fields
```

## Key Conventions
- **Path alias:** Always use `@/` for imports (maps to `src/`), never relative `../../`
- **Functional components only** — no classes
- **Feature-based pages** — add new pages inside the relevant folder (`pages/{feature}/`)
- **Permission-based menu & routes:** sidebar renders from `data/menuConfig.js`, filtered by `user.permissions`; routes wrapped in `<PermissionGuard permission="...">` (keys match backend `permission_key` like `companies:read_all`, `expenses:approvals`, `procurement:po`)
- **All buttons/links** show pointer cursor (global CSS rule)
- **All API calls go through `src/services/`** — one file per domain; components never call axios directly
- **Reusable listings:** use `DataTable` (self-managed `fetchFn` mode) or `DataTablePage` for any listing page
- **Dropdown option fetches** use the lightweight `/options` endpoints (`getRoleOptions`, `getCompanyOptions`, `getDepartmentOptions`, `getVendorOptions`, `getVendorCategoryOptions`), not the full list APIs
- **Forms:** all forms use React Hook Form + Zod — schemas live in `src/validations/`, components use `useForm` + `zodResolver`, dynamic rows use `useFieldArray`, and server-side 422 errors are mapped back onto fields via `setError`. Don't hand-roll form state or validation.
- **Permission checks:** `AuthContext` provides `hasPermission(perm)` checking `user.permissions` array (populated from backend `/auth/login` response). `PermissionGuard` and `ProtectedRoute` both support permission prop.

## Design System (Indigo/Slate)
- **Primary:** `#6366f1` (indigo-500)
- **Background:** `#f8fafc` (slate-50)
- **Cards:** white / dark `#0f172a`
- **Text:** `#0f172a` (slate-900), secondary `#475569`
- **Semantic:** emerald (success), amber (warning), red (danger)
- **Sidebar:** white in light mode, dark gray in dark mode (theme-aware)
- **Font:** Inter (changeable via Settings page — Roboto, Poppins, System)
- **Dark mode:** toggle via Navbar or Settings, persists in localStorage

## Routing
All routes are defined in `src/routes/index.jsx` (not App.jsx). Pages are **lazily code-split** via `React.lazy`; the route tree is wrapped in one `Suspense` with a spinner fallback. Routes are protected by `PermissionGuard` (checks `user.permissions`) and `ProtectedRoute` (auth + optional permission).
```
/login                    → Public
/                         → Protected (redirects to /login if unauthenticated)
/dashboard                → Dashboard (permission: '*')
/expenses/my              → My Expenses (own — GET /expenses/my) — permission: expenses:read
/expenses/all             → All Expenses (scoped — GET /expenses; SUPER_ADMIN/CFO see all, other manager roles only their employed companies) — permission: expenses:read_all
/expenses/assigned        → Approvals (pending user's role approval — GET /expenses/assigned; company-scoped) — permission: expenses:approvals
/expenses/payments        → Payment Requests (pending payment at the user's role — GET /expenses/my-payments) — permission: expenses:read
/expenses/new             → Create Expense (real API) — permission: expenses:create
/expenses/:uuid/edit      → Edit a DRAFT expense (creator only; PUT replaces line items) — permission: expenses:update
/expenses/:id             → Expense Detail (real API view) — permission: expenses:read
/master/companies         → Companies list / new / :uuid (view) / :uuid/edit — permissions: companies:read_all / companies:create / companies:read / companies:update
/master/vendors           → Vendors list / new / :uuid (view) / :uuid/edit — permissions: vendors:read_all / vendors:create / vendors:read / vendors:update
/master/vendor-categories → Vendor Categories list / new / :uuid (view) / :uuid/edit — permissions: vendor_categories:read_all / vendor_categories:create / vendor_categories:read / vendor_categories:update
/master/departments       → Departments list / new / :uuid (view) / :uuid/edit — permissions: departments:read_all / departments:create / departments:read / departments:update
/master/users             → Users list / new / :uuid (view) / :uuid/edit — permissions: users:read_all / users:create / users:read / users:update
/master/categories        → Expense Categories list / new / :uuid (view) / :uuid/edit — permissions: expense_categories:read_all / expense_categories:create / expense_categories:read / expense_categories:update
/access/roles             → Roles list / new / :uuid (view) / :uuid/edit — permissions: roles:read_all / roles:create / roles:read / roles:update
/access/permissions       → Permissions list / new / :uuid (view) / :uuid/edit — permissions: permissions:read_all / permissions:create / permissions:read / permissions:update
/access/role-permissions  → Role Permissions (assignment) — permission: role_permissions:read_all
/access/role-handover-rules          → Role Handover Rules list — permission: role_handover_rules:read_all
/access/role-handover-rules/edit     → Configure a from-role's handover rules — permission: role_handover_rules:update
/procurement              → All Procurement Requests (PI/PR/PO, type+status filters) — permission: procurement:read_all
/procurement/new          → Create PI (only roles with procurement:create) — permission: procurement:create
/procurement/:uuid        → Procurement Detail (actions, quotations, timeline, docs) — permission: procurement:read
/procurement/:uuid/edit   → Edit a draft PI (admin "Edit Line Items" for a PR in quote-gathering is a modal on the detail page, not this route) — permission: procurement:update
/profile                  → My Profile
/settings                 → Settings
```

## Scripts
```bash
npm run dev        # Vite dev server (port from VITE_DEV_PORT, default 5173)
npm run build      # Production build
npm run preview    # Preview production build
```

## Environment (.env)
```
VITE_API_URL=http://localhost:3015/api/v1   # Backend base URL
VITE_APP_NAME=FinTrack
VITE_APP_ENV=development
```

## What's Built / What's Pending
### Built
- [x] Enterprise design system (Indigo/Slate theme, dark/light mode)
- [x] **Real login API** — `POST /auth/login` via `authService`, JWT stored, AuthContext wiring (fixed a recursion bug)
- [x] **Demo credentials on login** — the login page shows all 13 seeded demo users (Super Admin, CFO, Payment/Finance/Admin/Travel managers + juniors, HOD, Employee Mgr, Employee) in a **3-column grid spanning the full right partition**, each button auto-fills the email + password (`Admin@123`). **All users use password "Admin@123"** (seeded via bcrypt hash).
- [x] Dashboard (stats cards, spending charts, activity feed)
- [x] Collapsible **permission-based** sidebar with submenus — active section stays open, other sections collapse once you navigate to a page; submenu items have their own icons + a guide line; active leaf matches query params (e.g., `/procurement?scope=mine` highlights "My Requests" tab)
- [x] Navbar with search, notifications, profile dropdown
- [x] Settings page (font family, font size, theme)
- [x] Protected routes + auth guard (`ProtectedRoute` + `PermissionGuard` with permission keys matching backend `permission_key`)
- [x] Feature-based page structure + `@/` alias
- [x] **Services layer** — shared axios client (JWT + 401 redirect) + per-module service files + `crud()` helper
- [x] **Users module** (`src/pages/master/users/`)
  - [x] List page — TanStack `DataTable`, server-side pagination / search / status filter / sorting
  - [x] Add/Edit User — shared `UserForm` (RHF+Zod), headshot upload, **status field**, optional employments
  - [x] View User — read-only detail (personal / role-dept / employments) with Edit button
- [x] **Companies module** (`src/pages/master/companies/`) — list (client-side paginated `DataTable`, logo thumbnail), full-detail add/edit form (identity/contact/address/tax + status + **logo upload**), group dropdown via `/groups/options`, delete confirm, **View Company** with Edit button
- [x] **Departments module** (`src/pages/master/departments/`) — list, add/edit form (name/code/status/description), delete confirm, **View Department** with Edit button
- [x] **Vendors module** (`src/pages/master/vendors/`) — list (logo thumbnail, **category chips column**), add/edit form with **nested contacts / addresses / bank accounts** (`useFieldArray`) + **vendor category checkbox grid** (sends `vendor_category_uuids`; edit maps existing `categories` back), logo upload, **View Vendor** with a **documents** section (upload via `/uploads` + `vendorDocumentApi`, list + delete) and a **Categories** card
- [x] **Vendor Categories module** (`src/pages/master/vendorCategories/`) — list/add/edit/view, delete confirm (routed + menu under **Master Data** → `/master/vendor-categories`); category options feed the vendor form's assignment grid
- [x] **Expense Categories module** (`src/pages/finance/categories/`) — list/add/edit/view; first-receiver & final-approver role dropdowns; delete confirm (routed + menu under **Master Data** → `/master/categories`)
- [x] **Access Control** (`src/pages/access/`) — Roles + Permissions list/add/edit/view, and **Role Permissions** page (role selector → grouped permission checklist → `sync` API); status field on both forms
- [x] **Role Handover Rules** (`src/pages/access/roleHandoverRules/`) — list shows all roles with rule status (or blank) + a Role-Permissions-style **editor** (module + from-role selector → To-role checklist → `sync` API that activates/deactivates rules)
- [x] **React Hook Form + Zod** — `Login`, UserForm, CompanyForm, DepartmentForm, RoleForm, PermissionForm, ExpenseForm (Travel + Reimbursement dynamic rows via `useFieldArray`); schemas in `src/validations/`
- [x] **Expenses UI** (`src/pages/expenses/`) — **Create Expense** wired to the real API (`POST /expenses`; category + company dropdowns — company scoped to the logged-in user's employments via `GET /users/me`); per-item **attachments** (files uploaded via `POST /uploads` on submit, kept per sub-part on edit, shown in the detail view); amounts not sent (backend computes); **validation is module-aware** (Travel XOR Reimbursement required fields, dates required, end ≥ start) and submit shows a **success/error toast** via `useToast()`. **My Expenses** (`GET /expenses/my` — only expenses the user created), **All Expenses** (`GET /expenses` — role+company scoped: SUPER_ADMIN/CFO see everything, other expense-manager roles see only companies they're actively employed in), and **Approvals** (`GET /expenses/assigned` — expenses pending the logged-in user's role approval, company-scoped) are **server-side paginated** via the shared `DataTablePage` (`page/limit/search/status/category/sort` on the backend, `ApiResponse.paginated`); All Expenses shows a clickable **Submitted by** (→ user-details modal) and approver-style actions. **Detail** (`GET /expenses/:uuid`, visibility-checked, payload normalized via `normalizeExpense`) renders all travel sections **tables on desktop / cards on mobile**, each showing its own **attachments**. **DRAFT expenses can be edited** (`/expenses/:uuid/edit` → `EditExpense` reuses `ExpenseForm`; creator-only, `PUT /expenses/:uuid` replaces line items + attachments and recomputes the amount; Edit shown only for the owner's DRAFT). `MyExpenses` is a parameterized list component reused by `AllExpenses` and `Approvals`. Themed `DatePicker` (react-datepicker) used for date/datetime fields. **Expense approval actions** — the **Expense Detail** page shows **Approve / Reject** buttons (with a confirm modal + optional remark) for a `SUBMITTED` expense **when the logged-in role is the current handler (or SUPER_ADMIN)**; **Approve opens a handover role dropdown** (fetched from `GET /expenses/:uuid/handover-roles` — valid targets from `role_handover_rules` for the category's module) to select who to forward to; defaults to final approver if no selection. They call `expenseService.submit/approve/rejectExpense`, then reload. The current handler role is surfaced from `currentRole` (normalized in `normalizeExpense`). **PO-created expenses** (auto-created when a procurement PO is created) appear in the expenses list as SUBMITTED and flow through the expense approval chain — the expense detail's handover trail shows the SUBMIT → APPROVE(→CFO) → APPROVE(→APPROVED) journey. For **procurement-linked expenses** (PO-created or converted) the Expense Detail shows a **collapsed "Procurement history"** card (`ProcurementHistorySection`, gated by `normalizeExpense.isProcurement`) with a **Show/Hide** button and a **smooth height animation** (`grid-template-rows` transition — the payload can be large, so it opens gently). On first expand it **lazy-loads** the chain via `getExpenseProcurementChain` (`GET /expenses/:uuid/procurement-chain`) and renders `ProcurementHistory` — a **responsive stage table** (desktop table / mobile cards, like the PR price-history card) with columns **Stage | Document | Grand total | View** for PI → PR → each quotation → PO, plus the **chain's approval logs** below it (e.g. SUBMIT → APPROVE → CREATE_PR → ADD_QUOTATION → SUBMIT_QUOTATIONS → SELECT_QUOTATION → CONVERT_TO_EXPENSE). Each row's **View** links to that document's procurement detail page (`/procurement/:uuid`; quotations have no standalone route).
- [x] **Procurement module** (`src/pages/procurement/`) — full PI → PR → PO flow wired to the real API (`/procurement*`). **Procurements list** — server-side `DataTablePage` (`page/limit/search/type/status/sort`), type/status filter dropdowns, draft-PI edit/delete, per-status color pills (the backend now projects the all-types view to the **latest document per chain**). **DRAFT PI visibility fixed** — DRAFT PIs are visible **only to their creator** in "All Requests" list (backend `procurement.repository.js:buildWhere()` combines draft exclusion filter with status filters using `Op.and`). **Create/Edit PI** — `ProcurementForm` (RHF+Zod, `procurementSchema`), company dropdown scoped to the user's employments (`GET /users/me`), dynamic line items (qty + unit price only — no vendor at PI stage). **ProcurementDetail** — status pill + **workflow action bar** (submit / approve / reject / create-PR / create-PO / mark-received / process-payment, shown by role+status; **creating a PR redirects to the all-requests list** `/procurement`; **no convert-to-expense action** — expense is now created only when PO is created), **Edit Line Items** (admin modal to adjust PI/PR qty & unit price → `PUT /:uuid/items`; hidden once quotations are **submitted to the requester** — status `QUOTATION_SELECTION`), **quotation builder** (hidden behind an **"Add quotation"** button — admin fills vendor, **valid-until via the themed `DatePicker`** (same picker as the other forms), **comments**, and an editable **line-items table** pre-filled from the PR's items with per-item name/qty/unit price/`tax_rate` and a live grand total; totals are server-computed on save), **blind selection** for the requester (vendor masked but **line items + prices visible**; `submit-quotations` opens selection, `select-quotation` picks one), **selected-quotation highlight** (emerald card + ✓ badge, with the other quotations collapsed behind a **"Show N other quotations"** toggle), **price-history card** (PI → PR → quotations → PO totals with a **View link** per stage), line-items table, handover **timeline**, and **quotation documents** (per-quotation upload/delete, shown only in **edit mode** — the existing "QUOTATION" type label was removed). The whole detail page is **responsive: tables on desktop / stacked cards on mobile** (`hidden md:block` + `md:hidden`), with `table-fixed` percentage columns and `break-words` so no horizontal scrollbars. Follows the intended flow: anyone who can **create a PI can submit it** (permission-based, not handover-gated); the PR goes straight to quotation-gathering with **no separate PR approval**; admin edits PR items before sending to the requester to choose a quotation blindly. On a **PO** (or a PR that was **converted to an expense**) the detail page shows a **"Linked Expense" link** (Wallet icon, from `doc.expenses[0]`) → `/expenses/:uuid`, so the expense that the PO auto-created or the admin converted is reachable directly from the procurement record.
- [x] **My Profile page** (navbar) — avatar, personal info, role/department, all employments
- [x] Reusable components: `DataTable`, `DataTablePage`, `Modal`, `ImageUpload` (circle/square), `DatePicker`, `StatusBadge`, `Toast` (`useToast().success/error`), `detail.jsx`, `form.jsx`, `PageHeader`, `ErrorState`, `SearchableSelect`, `PermissionGuard`
- [x] Sidebar submenus — single-open accordion (active section can be collapsed), smooth CSS height collapse (no JS timers)
- [x] **Permission-based routing** — all routes wrapped in `<PermissionGuard permission="...">` using backend permission keys (e.g., `expenses:read_all`, `companies:create`, `procurement:po`); sidebar menu items filtered by same permissions from `menuConfig.js`

### Today's Updates (2026-08-21) — Final Approver Closes Expense as APPROVED
- **ExpenseDetail.jsx**: Added detection of whether the current user is the category's final approver (`expense.category.finalApproverRole.code === expense.currentRole.code`). If so, the approve modal shows an info banner ("You are the final approver — this expense will be closed as APPROVED") instead of the handover role dropdown. The expense is always closed as APPROVED regardless of any handover selection (backend enforces this).
- **expenseService.js**: Updated `normalizeExpense` to include `category.finalApproverRole` (id, name, code) in the normalized payload so the frontend can determine if the current handler is the final approver.

### Today's Updates (2026-08-20) — Selected Quotation Display & Procurement Chain
- **ExpenseDetail.jsx**: Updated `normalizeExpense` usage and procurement history rendering. The expense detail now receives the selected quotation (with line items) from the backend's procurement chain response and displays it in the procurement history section.
- **ProcurementDetail.jsx**: Major refactor of quotation display:
  - **Selected quotation now prominently displayed above procurement history** — always visible in an emerald-bordered card with vendor, validity, totals, line items (table on desktop, cards on mobile), and attached documents.
  - **Quotations section now shows only OTHER quotations** — the selected quotation is removed from the list here (was previously highlighted first then others collapsed).
  - **Price history card** now filters out the selected quotation from the comparison table (since it's displayed separately above).
  - **Submit quotations button** now only enables when there are OTHER quotations (non-selected) to submit for requester selection.
- **expenseService.js**: Updated `normalizeExpense` to check for `procurementOrder` (the new include from backend) instead of the old `procurement_pr_id`/`procurement_po_id` fields to determine if an expense is procurement-linked.

### Today's Updates (2026-08-18)
- **Expense approval handover flow**: New **Approvals** page (`/expenses/assigned`) listing expenses pending the logged-in user's role approval (company-scoped; reuses `MyExpenses` component with `actionMode='assigned'`). Added to sidebar menu under **Expenses**.
- **Expense Detail approval actions**: On SUBMITTED expenses, current handler (or SUPER_ADMIN) sees **Approve / Reject** buttons. **Approve opens a handover role dropdown** (fetches valid targets from `GET /expenses/:uuid/handover-roles` — based on `role_handover_rules` for the expense's category module: travel/reimbursement/procurement). Selected role is sent as `to_role_id` on approve.
- **Assigned Expenses list inline actions**: Approve/Reject buttons directly in the list with same handover role dropdown.
- **Expense category filter**: In `ExpenseForm.jsx`, procurement module categories are now filtered out of the category dropdown (`c.module !== 'procurement'`). Procurement expenses are created automatically from PO/PR, not manually.
- **QUOTATION_APPROVED no longer approvable**: In `ProcurementDetail.jsx`, removed `QUOTATION_APPROVED` from `APPROVABLE_STATUSES`. At this stage the PR has a selected quotation and the next action is "Create PO" (not approve). Only `SUBMITTED`, `RECEIVED`, and `FINANCE_APPROVED` remain approvable.

### Today's Updates (2026-09-02) — Payment Handover Feature
- **Payment is now a role-handover workflow**: When the final approver closes a `SUBMITTED` expense as `APPROVED` (backend), it routes to the **original requester** (`current_role_id = requester's role`). The requester sees the APPROVED expense in "My Expenses" (view only) and can **Record Payment** (if they have `expenses:pay`) and/or **Handover for Payment** — both buttons show together when the requester has `expenses:pay`, otherwise only the handover button.
- **`PaymentSection` (ExpenseDetail)**: "Record Payment" is now shown only when the logged-in user is the **current handler** of the APPROVED/PAID expense (`user.role === expense.currentRole.code`) AND has `expenses:pay` AND the expense is not yet `SETTLED`/`PAID`. Previously the button appeared for any `expenses:pay` holder regardless of who was the handler.
- **PaymentHandoverModal** (ExpenseDetail): a modal with a role dropdown (fetched from `GET /expenses/:uuid/payment-handover-roles` — valid `module='payment'` handover targets for the current handler) + optional remarks. Submits via `POST /expenses/:uuid/handover-payment` (`{ to_role_id, remarks }`), then reloads the expense. Only reachable while the user is the current handler of a non-settled APPROVED/PAID expense.
- **New `PaymentRequests` page** (`/expenses/payments`, `PaymentRequests.jsx`): reuses the `MyExpenses` component with `fetchList={getMyPaymentRequests}` and `actionMode='payments'` (new subtitle "Expenses awaiting payment processing" + empty state "No payment requests pending"). Shows the expenses handed over to the logged-in role — `GET /expenses/my-payments` returns rows where `current_role_id = user's role`, `status IN ('APPROVED','PAID')`, `payment_status NOT IN ('SETTLED','PAID')`. Reserved only for payment/finance roles (the requester who holds the expense sees it via My Expenses, not here).
- **Sidebar**: added **"Payment Requests"** under Expenses → `/expenses/payments` (icon `Banknote`, permission `expenses:read`).
- **`expenseService.js`**: added `handoverForPayment(uuid, payload)`, `getPaymentHandoverRoles(uuid)`, and `getMyPaymentRequests(params, config)`.
- **Pending amount fix (backend-driven, no frontend change)**: The "Pending payment" figure in **both** the detail `PaymentSection` card and the **RecordPaymentModal** comes from `getPaymentSummary.amount_due`. The modal **defaults its amount input to `amount_due`** and **clamps any entry to it** (`Amount cannot exceed the due balance`). Because the backend previously returned `amount_due` without subtracting recorded payments (partial payment on a 5000 travel expense still showed 5000 pending), this readout was stale even though the `paid_amount` card was correct. The fix landed in the backend `getPaymentSummary`; the frontend already refreshes via `refreshPayments()` (re-fetches `getPayments` + `getPaymentSummary`) in the modal's `onSaved`. After the backend fix, the due/pending figure and the modal's max default down to the true remaining balance.

### Today's Updates (2026-09-03) — Role-based Dashboard
- **`Dashboard.jsx`**: The dashboard is now **persona-driven** by the logged-in role (frontend-only, `PERSONA` map; the backend already returns `metrics.isGlobal/isManager`). New personas: **employee** (`EMPLOYEE`), **approver** (`HOD`/`EMP_MGR`/`TRAVEL_MGR`/`FINANCE_MGR`/`FINANCE_JR`), **payment** (`PAYMENT_MGR`/`PAYMENT_JR`), **procurement** (`ADMIN_MGR`/`ADMIN_JR`), and **global** (`SUPER_ADMIN`/`CFO`). Each persona drives a **role-aware welcome subtitle** and a **persona-specific primary quick-action**:
  - employee → "Submit Expense" (`/expenses/new`)
  - approver/global → "My Approvals" (`/expenses/assigned`)
  - payment → "Payment Requests" (`/expenses/payments`)
  - procurement → "Procurement" (`/procurement`)
  Secondary actions (All Expenses, Procurement, Payment Requests, New Expense for employees) appear per the existing `APPROVER_ROLES`/`PROCUREMENT_ROLES`/`PAYMENT_ROLES`/`GLOBAL_ROLES` gates. This surfaces the new **Payment Requests** page for payment/finance roles.
- **Bug fixed: quick-action role gates used `user?.roleCode`**, which the login payload never provides (the API returns `user.role`). This made `isManager`/`isGlobal`/`isProcurement` always `false`, so secondary actions never rendered for anyone. Changed all three to `user?.role` (consistent with the rest of the app). Also removed a leftover `console.log('Dashboard API response:', res)` debug line.
- **Quick actions layout**: the quick-action buttons now render in a **responsive 4-per-row grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — 1 col mobile, 2 on tablet, 4 on desktop), matching the stat-card row layout, so "New Expense / My Approvals / All Expenses / Procurement / Payment Requests" line up like a menu.
- **Backend is UI-free**: confirmed the API returns only data — `GET /dashboard` returns `{ charts, recentActivity, metrics, roleContext }` and no frontend presentation (labels, icons, `className`, HTML) is emitted. All presentation stays in `Dashboard.jsx`.

### Today's Updates (2026-08-17)
- **Procurement tabs**: Added three tabs to Procurement list — "All Requests", "My Requests", and reserved "Role-based" (commented out for future).
- **Sidebar highlighting fixed**: "My Requests" tab now properly highlights when URL contains `?scope=mine`.
- **Quotation builder uses latest PR items**: When admin clicks "Add quotation", form resets and pre-fills from current `doc.items` (PR line items). Edits to PR line items reflect immediately in new quotations.
- **Quantity as integer (DB + UI)**: `procurement_items.quantity` changed from `DECIMAL(18,2)` to `INTEGER` in migration `20260806000003`. Added `.int()` validation in schema. Form inputs use `step="1"` for quantity, `step="0.01"` for unit price.
- **Currency always shows .00**: Updated `formatCurrency()` in `format.js` to use `minimumFractionDigits: 2, maximumFractionDigits: 2`.
- **Create PO from QUOTATION_APPROVED**: "Create PO" button now appears when PR status = `QUOTATION_APPROVED` (was checking for `APPROVED`).
- **Quotation selection → ADMIN_MGR**: After requester selects quotation, PR handler is now ADMIN_MGR (not CFO) so admin can create PO.

### Pending
- [ ] Delete User (confirm dialog) — Users table delete icon is a placeholder (Companies/Departments have working deletes)
- [ ] Employments list/create pages (`/master/employments`)
- [ ] Expense attachments → real upload (`POST /uploads`) + `expense_documents` per line item
- [ ] Travel pages (folder exists but no implementation)
- [ ] Finance pages (Reports — only Categories + expense Payment UI built; a standalone Finance/Payments module list for all payments across expenses is not yet built)
- [ ] Company switcher (fetch employments on demand)
- [ ] **Resubmit rejected expenses** — frontend resubmit flow for REJECTED expenses (allows creator to edit and resubmit through approval flow)
