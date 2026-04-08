# Travela — Technical Specification

> Architecture decisions, trade-offs, hard problems, optimizations

---

## 1. Problem & Solution

### 1.1 Problem Statement

Traditional OTAs (Online Travel Agencies) use monolithic systems that are difficult to scale and maintain. Travela demonstrates a modern, role-segmented approach where each user type (Admin, Manager, Coordinator, Sales, Customer) operates within a purpose-built dashboard — reducing cognitive load and improving operational efficiency.

### 1.2 Solution Overview

A React 19 frontend with mock data, Zustand state management, and a planned Express/Node backend. The frontend implements full RBAC (Role-Based Access Control) through a layered architecture system: each role has its own layout component that handles navigation guards, sidebar, and routing — creating isolated workspaces per role.

### 1.3 Key Differentiators

| Aspect | Traditional OTA | Travela |
|--------|----------------|---------|
| Architecture | Monolithic | Role-segmented layouts |
| Auth | Session-based | Mock RBAC with Zustand |
| Design | Generic | Indochine Heritage Luxe |
| State | Context/Redux | Zustand (minimal, fast) |
| Styling | Bootstrap/Ant | Tailwind v4 + Ant Design |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                                │
│  React 19 SPA + Zustand (client-side state)                │
│  React Router v7 (client-side routing + guards)             │
└────────────────────────────┬───────────────────────────────┘
                               │ API (future)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Backend (TBD)                             │
│  Express / Node.js + PostgreSQL + Prisma                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Module Breakdown

| Module | Responsibility | Tech |
|--------|---------------|------|
| `frontend/src/pages/` | Route-level page components | React 19 |
| `frontend/src/components/layout/` | 6 role-based layout shells | React 19 |
| `frontend/src/store/` | Auth state, mock login | Zustand 5 |
| `frontend/src/data/` | Mock data (canonical source) | TypeScript |
| `frontend/src/lib/` | Utilities, design tokens | TypeScript |
| `database/` | DB schema + seeds (planned) | SQL / Prisma |

### 2.3 Data Flow

```
User selects role (Login page)
    │
    ▼
PublicLayout mounts → calls useAuthStore.login(role)
    │
    ▼
Zustand auth state updated → isAuthenticated: true, user: User
    │
    ▼
React Router v7 checks layout guard
    │
    ▼
Role-specific layout mounts (AdminLayout / ManagerLayout / etc.)
    │
    ▼
Page component renders, reads data from Zustand
```

### 2.4 Role-Based Layout System

```
PublicLayout      → Landing, TourList, TourDetail, Checkout, Blog
AuthLayout        → Login, Register, ForgotPassword, ResetPassword
AdminLayout       → AdminUsers, BookingManagement, VoucherManagement, etc.
ManagerLayout     → ManagerDashboard, AdminTourPrograms, AdminActiveTours, TourEstimate
CoordinatorLayout → CoordinatorDashboard, ServiceList, AdminSuppliers, TourSettlement
SalesLayout       → SalesDashboard, SalesBookingDetail
```

---

## 3. Technology Decisions

### 3.1 Why This Stack?

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| Frontend | React 19 + Vite 8 | ✅ Fast HMR, modern DX / ❌ React 19 may have minor dep compat |
| State | Zustand 5 | ✅ Minimal boilerplate, selector-based / ❌ No built-in devtools |
| Styling | Tailwind v4 + Ant Design 6.3 | ✅ Utility-first with design system / ❌ Two styling systems |
| Routing | React Router v7 | ✅ Nested routes, data routers / ❌ New API surface |
| Animations | Framer Motion 12 | ✅ Declarative, powerful / ❌ Large bundle (924 KB, in cleanup) |

### 3.2 Design System

**Aesthetic:** Indochine Heritage Luxe — Vietnamese lacquerware palette, East Asian negative space (Ma), high-contrast serif typography.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2A2421` | Espresso brown — headings, buttons |
| `--color-secondary` | `#D4AF37` | Gold — accents, CTAs |
| `--color-tertiary` | `#2C5545` | Deep green — trust, success |
| `--color-background` | `#FBFBFB` | Pearl white — base |
| `--color-surface` | `#F3F3F3` | Off-white — cards |
| `--color-error` | `#ba1a1a` | Error states |

---

## 4. Hard Problems Solved

### 4.1 Role-Based Access Control (RBAC) Without Backend

**Problem:** Implement RBAC routing guards without a real auth backend.

**Approach:** Zustand auth store with mock login. Each layout component exports a named component (not default) and contains a role guard at the top. `App.tsx` maps routes to layouts using `<element>` prop from React Router v7.

**Implementation:**
```tsx
// src/components/layout/AdminLayout.tsx
export function AdminLayout() {
  const user = useAuthStore(s => s.user);
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <div className="flex h-screen">...</div>;
}

// src/App.tsx
<Route element={<AdminLayout />}>
  <Route path="/admin/users" element={<AdminUsers />} />
</Route>
```

### 4.2 Dual Styling System (Tailwind + Ant Design)

**Problem:** Two styling systems co-existing without conflicts.

**Approach:** Tailwind CSS v4 for layout, typography, and custom utility classes via CSS `@theme` directive. Ant Design components used as-is with `ConfigProvider` for theme customization. No `@apply` usage to avoid conflicts.

---

## 5. Optimizations

### 5.1 Performance

| Optimization | Status |
|-------------|--------|
| Zustand selector optimization | ✅ All 6 components now select specific slices |
| Unused dependency removal | ✅ framer-motion, lucide-react, @ant-design/icons uninstalled |
| TypeScript strict mode | ✅ Enabled via tsconfig.app.json |
| Bundle size (924 KB) | ⚠️ Code-split by route when backend lands |

### 5.2 Bundle Size

Initial bundle: **924 KB** (minified + gzipped: 237 KB).
After removing framer-motion + lucide-react + @ant-design/icons: ~4 KB saved. Full code-split planned when backend API lands.

---

## 6. Competitive Advantages

- **Ind ochine Heritage Luxe design** — unique aesthetic differentiating from generic OTA templates
- **Role-segmented workspaces** — each role gets a purpose-built dashboard, not a shared admin panel
- **Zustand over Redux** — minimal boilerplate, selector-based reactivity, faster dev iteration
- **Tailwind v4** — CSS-first configuration, no tailwind.config.js, native `@theme` directive

---

## 7. Security Model

- **Mock Auth only** — no real authentication. Zustand store holds role in memory.
- **Role guards** — each layout enforces role at render time (not route-level)
- **No sensitive data** — all data is mock/seed, no real PII
- **RBAC planned** — JWT + role middleware when backend lands

---

## 8. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Mock data only | No real persistence | Backend integration planned |
| No real auth | Security is frontend-only | JWT planned for backend |
| Large bundle (924 KB) | Slower initial load | Route code-splitting planned |
| Dual styling system | Learning curve | Tailwind v4 convention enforced |

---

## 9. Future Roadmap

- [ ] Backend: Express.js + Prisma + PostgreSQL
- [ ] Real authentication with JWT
- [ ] Route-level code splitting (reduce bundle from 924 KB)
- [ ] Replace mock data with API calls
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Docker + docker-compose for local development
- [ ] CI/CD pipeline with GitHub Actions
