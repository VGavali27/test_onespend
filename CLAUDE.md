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
│   │   ├── StatusBadge.jsx        # ACTIVE/INACTIVE/BLOCKED status pill
│   │   ├── PageHeader.jsx         # Standard page header (title/subtitle/icon + back)
│   │   ├── ErrorState.jsx         # Full-card load-error state with retry
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
│   │   └── departments/           # Departments: list / add / edit / view
│   │       └── Departments.jsx, CreateDepartment.jsx, EditDepartment.jsx, DepartmentForm.jsx, ViewDepartment.jsx
│   ├── access/                    # Access Control
│   │   ├── roles/                 # Roles: list / add / edit / view
│   │   ├── permissions/           # Permissions: list / add / edit / view
│   │   ├── rolePermissions/       # RolePermissions: assign permissions to a role
│   │   └── roleHandoverRules/     # RoleHandoverRules: list + Role-Permissions-style editor (add/remove via sync)
│   ├── profile/
│   │   └── Profile.jsx            # My Profile page (navbar menu → GET /users/me)
│   ├── expenses/                  # (future) MyExpenses, CreateExpense...
│   ├── travel/                    # (future) TravelRequests...
│   ├── finance/
│   │   └── categories/            # Expense Categories: list / add / edit / view (routed + menu under Master Data → /master/categories)
│   └── settings/
│       └── Settings.jsx           # Appearance, font family, font size
├── services/                      # ALL API calls live here — one file per domain
│   ├── api.js                     # Shared axios client + JWT/401 interceptors + crud() helper
│   ├── authService.js             # /auth (login)
│   ├── expenseService.js          # /expenses
│   ├── travelService.js           # /travel-* (segments, forex, misc...)
│   ├── masterService.js           # /companies, /departments, /users, /user-employments, /users/me
│   ├── accessService.js           # /roles, /permissions, /role-permissions, /role-handover-rules (+sync), /roles/options
│   ├── financeService.js          # /expense-categories
│   └── uploadService.js           # POST /uploads (image upload)
├── validations/                   # Shared Zod schemas — one file per form/domain
│   ├── userFormSchema.js          # User create/edit form schema + EMPLOYMENT_TYPES
│   ├── authSchema.js              # Login form schema
│   ├── companySchema.js           # Company create/edit form schema (full detail)
│   ├── departmentSchema.js        # Department create/edit form schema
│   └── expenseCategorySchema.js   # Expense category create/edit form schema
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
/master/categories        → Expense Categories list / new / :uuid (view) / :uuid/edit
/access/roles             → Roles list / new / :uuid (view) / :uuid/edit
/access/permissions       → Permissions list / new / :uuid (view) / :uuid/edit
/access/role-permissions  → Role Permissions (assignment)
/access/role-handover-rules          → Role Handover Rules list
/access/role-handover-rules/edit     → Configure a from role's handover rules
/profile                  → My Profile
/settings                 → Settings
/expenses, /travel, ...   → Mapped to pages (to be built)
```

## Scripts
```bash
npm run dev        # Vite dev server (port from VITE_DEV_PORT, default 5173)
npm run build      # Production build
npm run preview    # Preview production build
```

## Environment (.env)
```
VITE_API_URL=http://localhost:3000/api/v1   # Backend base URL
VITE_APP_NAME=FinTrack
VITE_APP_ENV=development
```

## What's Built / What's Pending
### Built
- [x] Enterprise design system (Indigo/Slate theme, dark/light mode)
- [x] **Real login API** — `POST /auth/login` via `authService`, JWT stored, AuthContext wiring (fixed a recursion bug)
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
- [x] **Expense Categories module** (`src/pages/finance/categories/`) — list/add/edit/view; first-receiver & final-approver role dropdowns; delete confirm (routed + menu under **Master Data** → `/master/categories`)
- [x] **Access Control** (`src/pages/access/`) — Roles + Permissions list/add/edit/view, and **Role Permissions** page (role selector → grouped permission checklist → `sync` API); status field on both forms
- [x] **Role Handover Rules** (`src/pages/access/roleHandoverRules/`) — list shows all roles with rule status (or blank) + a Role-Permissions-style **editor** (module + from-role selector → To-role checklist → `sync` API that activates/deactivates rules)
- [x] **React Hook Form + Zod** — `Login`, UserForm, CompanyForm, DepartmentForm; schemas in `src/validations/`
- [x] **My Profile page** (navbar) — avatar, personal info, role/department, all employments
- [x] Reusable components: `DataTable`, `DataTablePage`, `Modal`, `ImageUpload` (circle/square), `StatusBadge`, `detail.jsx`, `form.jsx`, `PageHeader`, `ErrorState`
- [x] Sidebar submenus — single-open accordion (active section can be collapsed), smooth CSS height collapse (no JS timers)

### Pending
- [ ] Delete User (confirm dialog) — Users table delete icon is a placeholder (Companies/Departments have working deletes)
- [ ] Employments list/create pages (`/master/employments`)
- [ ] Expenses pages (list, create, detail)
- [ ] Travel pages
- [ ] Finance pages (Categories, Payments, Reports)
- [ ] Company switcher (fetch employments on demand)
