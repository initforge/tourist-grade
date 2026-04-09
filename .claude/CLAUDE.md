# CLAUDE.md — Travela

> AI context for Claude Code. Read this before every task.

## Project Overview
- **Name:** Travela — Premium Tour Booking Platform (Đồ án tốt nghiệp)
- **Type:** Full-stack OTA (Online Travel Agency) with multi-role dashboard
- **Current Stage:** Mock data + Frontend (React 19 + Vite + TypeScript)
- **Backend:** Not implemented yet — all data is mock via `src/data/`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend Framework | React 19.2 + TypeScript ~5.9 |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 (CSS `@theme`) + Ant Design 6.3 |
| Routing | React Router v7 |
| State Management | Zustand 5 |
| Animations | Framer Motion 12 (installed but NOT used in code — do not add usage) |
| Charts | Recharts 3 |
| Backend | Not yet implemented |

### Fonts
- **Noto Serif** — headings (Google Fonts)
- **Inter** — body (Google Fonts)
- **Material Symbols Outlined** — icons (Google Fonts)

### Color Theme (CSS Variables)
```
--color-primary:    #2A2421  (dark warm brown)
--color-secondary:  #D4AF37  (gold)
--color-tertiary:   #2C5545  (deep green)
--color-background: #FBFBFB  (off-white)
--color-surface:    #F3F3F3
--color-error:      #ba1a1a
```

---

## Project Structure

```
tourist-grade/
├── frontend/                          ← Frontend source
│   ├── src/
│   │   ├── App.tsx                   ← Router + route definitions
│   │   ├── main.tsx
│   │   ├── index.css                 ← Tailwind v4 theme (@theme)
│   │   ├── components/
│   │   │   ├── layout/              ← 6 layout shells (Public, Auth, Admin, Manager, Coordinator, Sales)
│   │   │   ├── CancelBookingModal.tsx
│   │   │   └── DispatchHDVModal.tsx
│   │   ├── pages/
│   │   │   ├── auth/                 ← Login, Register, ForgotPassword, ResetPassword
│   │   │   ├── public/             ← Landing, TourList, TourDetail, BookingCheckout, Blog, AboutUs, OrderLookup
│   │   │   ├── customer/           ← BookingHistory, BookingDetail, CancelBooking, Wishlist, Profile
│   │   │   ├── admin/              ← AdminUsers.tsx  (1 file — Admin only manages users)
│   │   │   ├── manager/            ← Dashboard, TourPrograms, ActiveTours, TourEstimate, TourProgramDetail, Vouchers, approvals, CancelPolicy
│   │   │   ├── coordinator/        ← Dashboard, TourInstances (8-status tabs), TourProgramWizard, TourReceiveDispatch, TourSettlement, ServiceList, Suppliers, Vouchers, TourGenerationRules
│   │   │   └── sales/              ← Dashboard, SalesBookings (9-col table), SalesBookingDetail, Vouchers
│   │   ├── data/                   ← Mock data
│   │   │   ├── users.ts            ← 5 mock users
│   │   │   ├── tours.ts            ← 3 mock tours
│   │   │   ├── bookings.ts         ← 10 mock bookings
│   │   │   ├── vouchers.ts         ← Mock vouchers
│   │   │   ├── tourProgram.ts       ← Tour programs + instances
│   │   │   └── mockData.ts        ← Legacy stub: MOCK_BLOGS only
│   │   ├── store/
│   │   │   └── useAuthStore.ts
│   │   ├── hooks/
│   │   │   └── useAuthGuard.ts
│   │   └── lib/
│   │       └── utils.ts
│   ├── dist/                       ← Production build output
│   ├── eslint.config.js
│   ├── vite.config.ts
│   ├── .gitignore
│   └── .env.example
├── database/                        ← TODO: backend not started
├── docs/
│   ├── technical-spec.md
│   ├── vi-technical-spec.md
│   ├── user-guide.md
│   └── vi-user-guide.md
└── skills/
```

---

## Data Conventions

### Mock Data Canonical Source
- **Canonical bookings:** `src/data/bookings.ts` → `mockBookings` (10 rich records)
- **Canonical tours:** `src/data/tours.ts` → `mockTours` (3 tours)
- **Canonical users:** `src/data/users.ts` → `mockUsers` (5 users by role)
- **`mockData.ts`** is a legacy stub — only use `MOCK_BLOGS` for blog UI rendering. Do NOT use `MOCK_BOOKINGS` — use `mockBookings` from `bookings.ts` instead.
- **BookingHistory.tsx** and **BookingDetail.tsx** are wired to `mockBookings` canonical source.

### Role System (RBAC)
```
admin       → /admin/*     (AdminLayout)    — user management only
manager     → /manager/*  (ManagerLayout) — dashboards + tour programs
coordinator → /coordinator/* (CoordinatorLayout) — full ops: services, suppliers, settlements
sales       → /sales/*    (SalesLayout)  — bookings + customer handling
customer    → /customer/* (PublicLayout) — booking history, profile
```

### Auth Store
```ts
// Zustand selector pattern — ALWAYS use selector to avoid re-renders
const user = useAuthStore(s => s.user);         // ✅ Good
const { user } = useAuthStore();                // ❌ Bad — subscribes to entire store
const role = useAuthStore(s => s.user?.role) ?? 'guest';  // ✅ For role checks

// Mock login — picks user by role from mockUsers
login(role: Role) → sets user + isAuthenticated
logout() → clears state
```
No JWT, no real auth. Role is the only gatekeeper.

---

## Scripts

```bash
cd frontend
npm run dev      # start dev server
npm run build    # typecheck + production build
npm run lint     # eslint check
npm run preview  # preview production build
```

---

## Conventions

### TypeScript
- Use `import type` for type-only imports (verbatimModuleSyntax enforced)
- No `import React from 'react'` — React 19 JSX transform auto-imports
- Avoid `any` — use explicit interfaces

### File Naming
- Page components: `PascalCase.tsx` (e.g., `TourDetail.tsx`, `BookingHistory.tsx`)
- Layout components: `PascalCase.tsx` (e.g., `AdminLayout.tsx`)
- Data files: `camelCase.ts` (e.g., `mockData.ts`)
- Utils: `camelCase.ts` (e.g., `utils.ts`)

### Component Patterns
- Default exports for page components
- Named exports for layout components
- Use `useAuthStore(s => s.user)` — selector pattern to prevent unnecessary re-renders
- Use `statusLabels` from `utils.ts` for badge styling

### Tailwind CSS v4
- Theme defined in `src/index.css` via `@theme {}` block — no separate `tailwind.config.js`
- Use CSS variables: `bg-[var(--color-secondary)]`, `text-[var(--color-primary)]`
- Use `font-serif` class for headings (mapped to Noto Serif)

### Code Rules
- No `console.log` in source
- No `alert()` / `confirm()` — use Ant Design modals instead
- Error: always have `try/catch` or `.catch()`
- Import order: external → internal → relative
- Max responsibilities per file: 1 (SRP)

### Signal-Based Refactoring
File cần tách khi có ≥ 1 signal:
- [ ] > 500 lines
- [ ] Import từ > 5 files khác
- [ ] Làm ≥ 3 việc không liên quan
- [ ] Logic thay đổi vì ≥ 2 lý do khác nhau
- [ ] Feature scatter (1 domain spread qua ≥ 3 folders)

---

## Tech Debt

| # | File | Issue | Status |
|---|------|-------|--------|
| 1 | `SalesBookingDetail.tsx` (419 lines) | module refactor candidate | P2 — defer |
| 2 | `TourProgramWizard.tsx` — coordinator/ (352 lines) | multi-step form refactor | P2 — defer |
| 3 | `Suppliers.tsx` — coordinator/ (307 lines) | module refactor candidate | P2 — defer |
| 4 | Build chunk size | 1.75 MB JS bundle — code-split by route when backend lands | P2 |
| 5 | `MOCK_BLOGS` encoding | Vietnamese text garbled (UTF-8 encoding issue) | P1 |
| 6 | Zustand selectors | Layouts subscribed to entire store | ✅ FIXED |
| 7 | URL.createObjectURL leak | Memory leak in SalesBookingDetail refund flow | ✅ FIXED |
| 8 | BookingHistory data | Used legacy MOCK_BOOKINGS instead of canonical | ✅ FIXED |
| 9 | BookingDetail data | Hardcoded local state, not wired to store | ✅ FIXED |
| 10 | Pages/admin folder | Was catch-all for 11 files — now contains only AdminUsers.tsx | ✅ FIXED |

---

## Gotchas

- **`mockData.ts`** — ONLY use `MOCK_BLOGS`. The `MOCK_BOOKINGS` export is a legacy stub with wrong schema — all booking components must use `mockBookings` from `bookings.ts`
- **`BookingHistory.tsx`** and **`BookingDetail.tsx`** — canonical data sources, wired as of 2026-03-31. Do not revert to `MOCK_BOOKINGS`
- **Role switching** — done via Zustand mock login. Each layout has a role guard that redirects unauthorized access to `/`
- **Dual styling** — Tailwind v4 for layout/typography, Ant Design for complex components. No `@apply` to avoid conflicts
- **No backend** — all data is in-memory mock. Refunds, booking changes are not persisted across page reloads
- **framer-motion** — not used in code but installed. Do not add usage — use Ant Design animations or CSS transitions instead
- **Zustand store** — `useAuthStore()` always uses selector `s => s.field` pattern. Never destructure `const { a, b } = useAuthStore()`

---

## Recent Changes

- 2026-04-09: Folder restructure — moved 13 files out of `pages/admin/` into correct role folders (manager/, coordinator/, sales/). `pages/admin/` now contains only `AdminUsers.tsx`. App.tsx updated with clean role-based routing. SalesBookings.tsx — full NV Kinh doanh overhaul: DatePicker+Export moved under title, "Đã cọc" label fixed, confirm/reject actions with modals, refund filter changed to dropdown.
- 2026-03-31: Full-review session — 3 unused packages removed, Zustand selectors fixed, URL.createObjectURL memory leak fixed, BookingHistory + BookingDetail wired to canonical mockBookings, .env added to .gitignore, .env.example created, 3-tier docs created
- 2026-03-30: Full-review cleanup — 10 lint errors fixed, 9 temp files removed

---

## Task Workflow

Mỗi khi nhận task từ user, tuân thủ quy trình sau:

### 1. Trước khi làm — báo cáo bảng trạng thái

Trả lời bằng bảng Markdown:

```
| # | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | ... | ✅ Xong / ❌ Chưa / ⚠️ Khác | |
```

Cột "Ghi chú" ghi rõ khác gì so với yêu cầu, hoặc đang conflict ở đâu.

### 2. Sau khi làm xong — báo cáo bảng đầy đủ

Mỗi yêu cầu ghi rõ:
- **Trạng thái cuối**: ✅ Xong / ❌ Chưa
- **Thay đổi cụ thể**: ghi tên file + dòng logic thay đổi
- **Deploy**: `npm run build` → pass → chạy `npm run preview`
- **Báo cáo toàn bộ task trong phiên** (kể cả task từ các phiên trước nếu có)

### 3. Deploy

Sau khi build pass: `npm run preview` để user kiểm tra giao diện. Nếu có lỗi → fix → build lại → preview lại.

### 4. Không bao giờ

- Không hứa "sẽ làm" nếu chưa đọc kỹ code
- Không xóa file gốc trước khi copy đã tồn tại ở folder mới
- Không dùng Write tool cho file > 200 lines (dùng Edit)
- Không bỏ qua bước build verify

