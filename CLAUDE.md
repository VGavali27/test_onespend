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
│   │   └── Navbar.jsx             # Top bar — search, theme toggle, notifications, profile
│   ├── ui/                        # (future) reusable UI components
│   └── ProtectedRoute.jsx         # Auth guard — redirects to /login if unauthenticated
├── context/
│   ├── AuthContext.jsx            # Auth state, login/logout, JWT management
│   └── ThemeContext.jsx           # Dark/light theme + font family/size preferences
├── data/
│   └── menuConfig.js              # Role-based menu/submenu configuration
├── pages/
│   ├── auth/                      # Login, ForgotPassword, Register...
│   │   └── Login.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx          # Stats cards, charts, activity feed
│   ├── expenses/                  # (future) MyExpenses, CreateExpense...
│   ├── travel/                    # (future) TravelRequests...
│   ├── master/                    # (future) Companies, Users, Departments...
│   ├── finance/                   # (future) Categories, Payments, Reports...
│   └── settings/
│       └── Settings.jsx           # Appearance, font family, font size
└── services/
    └── api.js                     # Axios instance (currently mock login)
```

## Key Conventions
- **Path alias:** Always use `@/` for imports (maps to `src/`), never relative `../../`
- **Functional components only** — no classes
- **Feature-based pages** — add new pages inside the relevant folder (`pages/{feature}/`)
- **Role-based menu:** sidebar renders from `data/menuConfig.js`, filtered by `user.role`
- **All buttons/links** show pointer cursor (global CSS rule)

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
VITE_API_URL=http://localhost:3000/api   # Backend base URL
VITE_APP_NAME=FinTrack
VITE_APP_ENV=development
```

## What's Built / What's Pending
- [x] Enterprise design system (Indigo/Slate theme, dark/light mode)
- [x] Login page (split-panel design, currently mock auth)
- [x] Dashboard (stats cards, spending charts, activity feed)
- [x] Collapsible role-based sidebar with submenus
- [x] Navbar with search, notifications, profile dropdown
- [x] Settings page (font family, font size, theme)
- [x] Protected routes + auth guard
- [x] Feature-based page structure + `@/` alias
- [ ] Connect real login API (replace mock)
- [ ] Expenses pages (list, create, detail)
- [ ] Travel pages
- [ ] Master pages (Companies, Users, Departments)
- [ ] Finance pages (Categories, Payments, Reports)
- [ ] Company switcher (fetch employments on demand)
