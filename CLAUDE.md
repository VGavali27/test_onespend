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
│   │   ├── Sidebar.jsx            # Collapsible role-based nav (accordion + preview-open, submenu icons, guide line)
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
│   │   └── form.jsx               # Form primitives: inputClass/For, FormSection, FormField
│   └── ProtectedRoute.jsx         # Auth guard — redirects to /login if unauthenticated
├── context/
│   ├── AuthContext.jsx            # Auth state, login/logout, JWT management
│   └── ThemeContext.jsx           # Dark/light theme + font family/size preferences
├── data/
│   └── menuConfig.js              # Role-based menu config; submenu items carry their own icon
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
│   │   ├── rolePermissions/       # RolePermissions: assign permissions to a role
│   │   └── roleHandoverRules/     # RoleHandoverRules: list + Role-Permissions-style editor (add/remove via sync)
│   ├── profile/
│   │   └── Profile.jsx            # My Profile page (navbar menu → GET /users/me)
│   ├── expenses/                  # MyExpenses (own), AllExpenses (scoped list), CreateExpense (real API create), ExpenseDetail (real API view)
│   ├── travel/                    # (future) TravelRequests...
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
└── utils/
    ├── assets.js                  # resolveAssetUrl(path) — backend asset path → absolute URL
    ├── format.js                  # formatDate, nullIfEmpty, formatType
    ├── user.js                    # getFullName, getInitials
    ├── table.js                   # sortRows (client-side sort for DataTable)
    └── formErrors.js              # applyServerErrors — map 422 errors onto RHF fields
```

## Key Conventions
- **Path alias:** Always use `@/` for imports (maps to `src/`), never relative `../../`
- **Functional components only** — no classes
- **Feature-based pages** — add new pages inside the relevant folder (`pages/{feature}/`)
- **Role-based menu:** sidebar renders from `data/menuConfig.js`, filtered by `user.role`
- **All buttons/links** show pointer cursor (global CSS rule)
- **All API calls go through `src/services/`** — one file per domain; components never call axios directly
- **Reusable listings:** use `DataTable` (self-managed `fetchFn` mode) or `DataTablePage` for any listing page
- **Dropdown option fetches** use the lightweight `/options` endpoints (`getRoleOptions`, `getCompanyOptions`, `getDepartmentOptions`), not the full list APIs
- **Forms:** all forms use React Hook Form + Zod — schemas live in `src/validations/`, components use `useForm` + `zodResolver`, dynamic rows use `useFieldArray`, and server-side 422 errors are mapped back onto fields via `setError`. Don't hand-roll form state or validation.

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
All routes are defined in `src/routes/index.jsx` (not App.jsx). Pages are **lazily code-split** via `React.lazy`; the route tree is wrapped in one `Suspense` with a spinner fallback.
```
/login                    → Public
/                         → Protected (redirects to /login if unauthenticated)
/dashboard                → Dashboard
/master/companies         → Companies list / new / :uuid (view) / :uuid/edit
/master/departments       → Departments list / new / :uuid (view) / :uuid/edit
/master/users             → Users list / new / :uuid (view) / :uuid/edit
/master/vendors           → Vendors list / new / :uuid (view) / :uuid/edit
/master/vendor-categories → Vendor Categories list / new / :uuid (view) / :uuid/edit
/master/categories        → Expense Categories list / new / :uuid (view) / :uuid/edit
/access/roles             → Roles list / new / :uuid (view) / :uuid/edit
/access/permissions       → Permissions list / new / :uuid (view) / :uuid/edit
/access/role-permissions  → Role Permissions (assignment)
/access/role-handover-rules          → Role Handover Rules list
/access/role-handover-rules/edit     → Configure a from role's handover rules
/expenses/my              → My Expenses (own — GET /expenses/my)
/expenses/all             → All Expenses (scoped — GET /expenses; SUPER_ADMIN/CFO see all, other manager roles only their employed companies)
/expenses/new             → Create Expense (real API)
/expenses/:uuid/edit      → Edit a DRAFT expense (creator only; PUT replaces line items)
/expenses/:id             → Expense Detail (real API view)
/procurement              → All Procurement Requests (PI/PR/PO, type+status filters)
/procurement/new          → Create PI (only roles with procurement:create)
/procurement/:uuid        → Procurement Detail (actions, quotations, timeline, docs)
/procurement/:uuid/edit   → Edit a draft PI (admin "Edit Line Items" for a PR in quote-gathering is a modal on the detail page, not this route)
/profile                  → My Profile
/settings                 → Settings
/travel, /finance, ...    → Mapped to pages (to be built)
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
- [x] **Demo credentials on login** — the login page shows all 13 seeded demo users (Super Admin, CFO, Payment/Finance/Admin/Travel managers + juniors, HOD, Employee Mgr, Employee) in a **3-column grid spanning the full right partition**, each button auto-fills the email + password (`Admin@123`)
- [x] Dashboard (stats cards, spending charts, activity feed)
- [x] Collapsible role-based sidebar with submenus — active section stays open, other sections collapse once you navigate to a page; submenu items have their own icons + a guide line
- [x] Navbar with search, notifications, profile dropdown
- [x] Settings page (font family, font size, theme)
- [x] Protected routes + auth guard
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
- [x] **Expenses UI** (`src/pages/expenses/`) — **Create Expense** wired to the real API (`POST /expenses`; category + company dropdowns — company scoped to the logged-in user's employments via `GET /users/me`); per-item **attachments** (files uploaded via `POST /uploads` on submit, kept per sub-part on edit, shown in the detail view); amounts not sent (backend computes); **validation is module-aware** (Travel XOR Reimbursement required fields, dates required, end ≥ start) and submit shows a **success/error toast** via `useToast()`. **My Expenses** (`GET /expenses/my` — only expenses the user created) and **All Expenses** (`GET /expenses` — role+company scoped: SUPER_ADMIN/CFO see everything, other expense-manager roles see only companies they're actively employed in) are **server-side paginated** via the shared `DataTablePage` (`page/limit/search/status/category/sort` on the backend, `ApiResponse.paginated`); All Expenses shows a clickable **Submitted by** (→ user-details modal) and approver-style actions. **Detail** (`GET /expenses/:uuid`, visibility-checked, payload normalized via `normalizeExpense`) renders all travel sections **tables on desktop / cards on mobile**, each showing its own **attachments**. **DRAFT expenses can be edited** (`/expenses/:uuid/edit` → `EditExpense` reuses `ExpenseForm`; creator-only, `PUT /expenses/:uuid` replaces line items + attachments and recomputes the amount; Edit shown only for the owner's DRAFT). `MyExpenses` is a parameterized list component reused by `AllExpenses`. Themed `DatePicker` (react-datepicker) used for date/datetime fields. **Expense approval actions** — the **Expense Detail** page shows **Approve / Reject** buttons (with a confirm modal + optional remark) for a `SUBMITTED` expense **when the logged-in role is the current handler (or SUPER_ADMIN)**; they call `expenseService.submit/approve/rejectExpense`, then reload. The current handler role is surfaced from `currentRole` (normalized in `normalizeExpense`). **PO-created expenses** (auto-created when a procurement PO is created) appear in the expenses list as SUBMITTED and flow through the expense approval chain — the expense detail's handover trail shows the SUBMIT → APPROVE(→CFO) → APPROVE(→APPROVED) journey. For **procurement-linked expenses** (PO-created or converted) the Expense Detail shows a **collapsed "Procurement history"** toggle (`ProcurementHistorySection`, gated by `normalizeExpense.isProcurement`). On first expand it **lazy-loads** the chain via `getExpenseProcurementChain` (`GET /expenses/:uuid/procurement-chain`) and renders `ProcurementHistory` — a **responsive stage table** (desktop table / mobile cards, like the PR price-history card) with columns **Stage | Document | Grand total | View** for PI → PR → each quotation → PO, plus the **chain's approval logs** below it (e.g. SUBMIT → APPROVE → CREATE_PR → ADD_QUOTATION → SUBMIT_QUOTATIONS → SELECT_QUOTATION → CONVERT_TO_EXPENSE). Each row's **View** links to that document's procurement detail page (`/procurement/:uuid`; quotations have no standalone route).
- [x] **Procurement module** (`src/pages/procurement/`) — full PI → PR → PO flow wired to the real API (`/procurement*`). **Procurements list** — server-side `DataTablePage` (`page/limit/search/type/status/sort`), type/status filter dropdowns, draft-PI edit/delete, per-status color pills (the backend now projects the all-types view to the **latest document per chain**). **Create/Edit PI** — `ProcurementForm` (RHF+Zod, `procurementSchema`), company dropdown scoped to the user's employments (`GET /users/me`), dynamic line items (qty + unit price only — no vendor at PI stage). **ProcurementDetail** — status pill + **workflow action bar** (submit / approve / reject / create-PR / create-PO / **convert-to-expense** / mark-received / process-payment, shown by role+status; **creating a PR redirects to the all-requests list** `/procurement`; **"Convert to Expense"** appears for SUPER_ADMIN/ADMIN_MGR on a PR once its quotation is approved — `QUOTATION_APPROVED`/`APPROVED` — and hides once a PO exists or an expense is already linked; on success it **redirects to the new expense's detail** page), **Edit Line Items** (admin modal to adjust PI/PR qty & unit price → `PUT /:uuid/items`; hidden once quotations are **submitted to the requester** — status `QUOTATION_SELECTION`), **quotation builder** (hidden behind an **"Add quotation"** button — admin fills vendor, **valid-until via the themed `DatePicker`** (same picker as the other forms), **comments**, and an editable **line-items table** pre-filled from the PR's items with per-item name/qty/unit price/`tax_rate` and a live grand total; totals are server-computed on save), **blind selection** for the requester (vendor masked but **line items + prices visible**; `submit-quotations` opens selection, `select-quotation` picks one), **selected-quotation highlight** (emerald card + ✓ badge, with the other quotations collapsed behind a **"Show N other quotations"** toggle), **price-history card** (PI → PR → quotations → PO totals with a **View link** per stage), line-items table, handover **timeline**, and **quotation documents** (per-quotation upload/delete, shown only in **edit mode** — the existing "QUOTATION" type label was removed). The whole detail page is **responsive: tables on desktop / stacked cards on mobile** (`hidden md:block` + `md:hidden`), with `table-fixed` percentage columns and `break-words` so no horizontal scrollbars. Follows the intended flow: anyone who can **create a PI can submit it** (permission-based, not handover-gated); the PR goes straight to quotation-gathering with **no separate PR approval**; admin edits PR items before sending to the requester to choose a quotation blindly. On a **PO** (or a PR that was **converted to an expense**) the detail page shows a **"Linked Expense" link** (Wallet icon, from `doc.expenses[0]`) → `/expenses/:uuid`, so the expense that the PO auto-created or the admin converted is reachable directly from the procurement record.
- [x] **My Profile page** (navbar) — avatar, personal info, role/department, all employments
- [x] Reusable components: `DataTable`, `DataTablePage`, `Modal`, `ImageUpload` (circle/square), `DatePicker`, `StatusBadge`, `Toast` (`useToast().success/error`), `detail.jsx`, `form.jsx`, `PageHeader`, `ErrorState`
- [x] Sidebar submenus — single-open accordion (active section can be collapsed), smooth CSS height collapse (no JS timers)

### Pending
- [ ] Delete User (confirm dialog) — Users table delete icon is a placeholder (Companies/Departments have working deletes)
- [ ] Employments list/create pages (`/master/employments`)
- [ ] Expense attachments → real upload (`POST /uploads`) + `expense_documents` per line item
- [ ] Travel pages
- [ ] Finance pages (Categories, Payments, Reports)
- [ ] Company switcher (fetch employments on demand)
