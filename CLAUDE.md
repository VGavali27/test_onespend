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

## Folder Structure
```
src/
├── App.jsx                        # Root — routing + providers
├── main.jsx                       # Entry point
├── index.css                      # Design system + Tailwind theme
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx          # Layout wrapper (sidebar + navbar + outlet)
│   │   ├── Sidebar.jsx            # Collapsible role-based navigation
│   │   └── Navbar.jsx             # Top bar — search, theme, notifications, profile menu
│   ├── ui/                        # Reusable UI components
│   │   ├── DataTable.jsx          # Generic TanStack table (self-managed fetchFn mode)
│   │   ├── DataTablePage.jsx      # Listing page shell (header + search + DataTable)
│   │   ├── Modal.jsx              # Reusable modal dialog
│   │   └── ImageUpload.jsx        # Headshot uploader (drag-drop + preview)
│   └── ProtectedRoute.jsx         # Auth guard — redirects to /login if unauthenticated
├── context/
│   ├── AuthContext.jsx            # Auth state, login/logout, JWT management
│   └── ThemeContext.jsx           # Dark/light theme + font family/size preferences
├── data/
│   └── menuConfig.js              # Role-based menu/submenu configuration
├── pages/
│   ├── auth/
│   │   └── Login.jsx              # Split-panel login (real API)
│   ├── dashboard/
│   │   └── Dashboard.jsx          # Stats cards, charts, activity feed
│   ├── master/
│   │   ├── Users.jsx              # User list (server-side table + filters)
│   │   ├── CreateUser.jsx         # Add User page
│   │   ├── EditUser.jsx           # Edit User page (prefills via shared form)
│   │   └── UserForm.jsx           # Shared user form (create + edit sections)
│   ├── profile/
│   │   └── Profile.jsx            # My Profile page (navbar menu → GET /users/me)
│   ├── expenses/                  # (future) MyExpenses, CreateExpense...
│   ├── travel/                    # (future) TravelRequests...
│   ├── finance/                   # (future) Categories, Payments, Reports...
│   └── settings/
│       └── Settings.jsx           # Appearance, font family, font size
├── services/                      # ALL API calls live here — one file per domain
│   ├── api.js                     # Shared axios client + JWT/401 interceptors + crud() helper
│   ├── authService.js             # /auth (login)
│   ├── expenseService.js          # /expenses
│   ├── travelService.js           # /travel-* (segments, forex, misc...)
│   ├── masterService.js           # /companies, /departments, /users, /user-employments, /users/me
│   ├── accessService.js           # /roles, /permissions, /role-permissions, /roles/options
│   ├── financeService.js          # /expense-categories
│   └── uploadService.js           # POST /uploads (image upload)
└── utils/
    └── assets.js                  # resolveAssetUrl(path) — backend asset path → absolute URL
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
```
/login                    → Public
/                         → Protected (redirects to /login if unauthenticated)
/dashboard                → Dashboard
/master/users             → Users list (server-side table)
/master/users/new         → Create User
/master/users/:uuid/edit  → Edit User
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
- [x] Collapsible role-based sidebar with submenus
- [x] Navbar with search, notifications, profile dropdown
- [x] Settings page (font family, font size, theme)
- [x] Protected routes + auth guard
- [x] Feature-based page structure + `@/` alias
- [x] **Services layer** — shared axios client (JWT + 401 redirect) + per-module service files + `crud()` helper
- [x] **Users module**
  - [x] List page — TanStack `DataTable`, server-side pagination / search / status filter / sorting
  - [x] Add User page — full-width form, headshot image upload, optional employments (per-company email)
  - [x] Edit User page — pre-filled shared `UserForm`, optional password change, editable employments
- [x] **My Profile page** (navbar menu) — avatar, personal info, role/department, all employments
- [x] Reusable components: `DataTable`, `DataTablePage`, `Modal`, `ImageUpload`

### Pending
- [ ] Delete User (confirm dialog) — table delete icon is a placeholder
- [ ] View User detail (table eye icon is a placeholder)
- [ ] Master pages for Companies, Departments, Employments
- [ ] Access Control pages (Roles, Permissions, Role Permissions)
- [ ] Expenses pages (list, create, detail)
- [ ] Travel pages
- [ ] Finance pages (Categories, Payments, Reports)
- [ ] Company switcher (fetch employments on demand)
