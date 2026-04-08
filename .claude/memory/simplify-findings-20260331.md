# SIMPLIFY — REUSE FINDINGS

> Audited: 51 source files (tsx + ts) under `src/`
> Stack: React 19 + TypeScript + Tailwind CSS v4 + Ant Design 6 + Framer Motion
> Generated: 2026-03-31

---

## Duplicate Code Candidates (extract to shared/)

### [REUSE-1] `formatCurrency()` — duplicated in 2 files
- **Files:**
  - `src/pages/admin/BookingManagement.tsx` lines 45–47
  - `src/pages/admin/SalesBookingDetail.tsx` lines 29–31
- **Duplication:** Identical inline functions — both return `new Intl.NumberFormat('vi-VN').format(amount) + ' VND'`
- **Extract to:** `src/lib/utils.ts` as `export function formatCurrency(amount: number): string`
- **Lines saved:** ~8 (2 files × ~4 lines each)

---

### [REUSE-2] `formatDate()` — duplicated in 2 files (different formatting variants)
- **Files:**
  - `src/pages/admin/BookingManagement.tsx` lines 49–52 (`month: '2-digit'`)
  - `src/pages/admin/SalesBookingDetail.tsx` lines 32–35 (`month: 'long'`)
- **Duplication:** Same pattern but different locale options — genuinely two variants.
- **Extract to:** `src/lib/utils.ts`
  ```ts
  export function formatDateShort(dateStr: string): string { ... }
  export function formatDateLong(dateStr: string): string { ... }
  ```
- **Lines saved:** ~10

---

### [REUSE-3] `STATUS_STYLE` + `STATUS_LABEL` + `REFUND_LABEL` — triplicated booking constants
- **Files:**
  - `src/pages/admin/BookingManagement.tsx` lines 24–43
  - `src/pages/admin/SalesBookingDetail.tsx` lines 5–22
  - `src/pages/sales/SalesDashboard.tsx` lines 31–36 (STATUS_STYLE only)
- **Duplication:** Booking-status style + label constants defined inline in each file. `utils.ts` has `statusLabels` but with a **different key schema** (`pending`/`confirmed`/`cancelled` vs `booked`/`pending_confirm` etc.) — these sets overlap but are not identical.
- **Extract to:** `src/lib/constants/booking.ts`
  ```ts
  export const BOOKING_STATUS_STYLE: Record<string, string> = { booked: '...', pending: '...', ... }
  export const BOOKING_STATUS_LABEL: Record<string, string> = { booked: 'Đã đặt', ... }
  export const REFUND_STATUS_LABEL: Record<string, string> = { none: '—', ... }
  export const PASSENGER_TYPE_LABEL: Record<string, string> = { adult: 'Người lớn', ... }
  ```
- **Lines saved:** ~45 across 2 files

---

### [REUSE-4] `PASSENGER_TYPE` — duplicated in CSV export logic
- **Files:**
  - `src/pages/admin/SalesBookingDetail.tsx` lines 23–27 (constant) + line 92 (usage)
- **Duplication:** Only one file currently, but belongs in the same constants file as REUSE-3.
- **Extract to:** `src/lib/constants/booking.ts` (bundled with REUSE-3)

---

### [REUSE-5] Slide-over drawer pattern — duplicated in 5 files (~70 lines × 5)
- **Files:**
  - `src/pages/admin/AdminUsers.tsx` lines 173–266
  - `src/pages/admin/VoucherManagement.tsx` lines 186–270
  - `src/pages/admin/AdminSuppliers.tsx` lines 226–303
  - `src/pages/admin/ServiceList.tsx` lines 142–223
  - `src/pages/admin/AdminActiveTours.tsx` lines 177–231
- **Duplication:** Near-identical boilerplate: `fixed inset-0 z-50` overlay → backdrop blur → slide-from-right panel → sticky header with title + close → scrollable body → footer with Cancel/Confirm buttons. ~70 lines × 5 = **350 lines**.
- **Extract to:** `src/shared/components/SlideDrawer.tsx`
  ```tsx
  interface SlideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    confirmLabel?: string;
    onConfirm?: () => void;
    confirmDisabled?: boolean;
    children: React.ReactNode;
  }
  ```
- **Lines saved:** ~350

---

### [REUSE-6] Role-guard + `isActive()` boilerplate — duplicated in 4 layout files
- **Files:**
  - `src/components/layout/AdminLayout.tsx` lines 8–13
  - `src/components/layout/ManagerLayout.tsx` lines 8–13
  - `src/components/layout/CoordinatorLayout.tsx` lines 8–13
  - `src/components/layout/SalesLayout.tsx` lines 8–13
- **Duplication:** All 4 internal layout shells repeat verbatim:
  ```tsx
  const location = useLocation();
  const { user } = useAuthStore();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
  const role = user?.role || 'guest';
  if (role !== 'X') return <Navigate to="/" replace />;
  ```
- **Extract to:**
  - `src/shared/hooks/useLayoutGuard.ts` — handles redirect logic
  - `src/shared/hooks/useSidebarNav.ts` — `isActive` helper
- **Lines saved:** ~20 × 4 = 80

---

### [REUSE-7] Admin sidebar HTML — duplicated in 4 layout files
- **Files:**
  - `src/components/layout/AdminLayout.tsx` lines 17–49
  - `src/components/layout/ManagerLayout.tsx` lines 17–56
  - `src/components/layout/CoordinatorLayout.tsx` lines 17–65
  - `src/components/layout/SalesLayout.tsx` lines 17–48
- **Duplication:** Near-identical aside structure across all 4 layouts: logo block → nav sections → logout link. Only the nav links and role label differ.
- **Extract to:** `src/shared/components/AdminSidebar.tsx`
  ```tsx
  interface SidebarSection { label: string; links: { to: string; icon: string; label: string }[]; }
  interface AdminSidebarProps {
    role: string;
    roleLabel: string;
    sections: SidebarSection[];
  }
  ```
- **Lines saved:** ~160 across 4 files

---

### [REUSE-8] `roleRedirects` map — duplicated
- **Files:**
  - `src/components/layout/PublicLayout.tsx` lines 5–11
  - `src/pages/auth/Login.tsx` lines 13–28 (inline if/else logic)
- **Duplication:** `role → redirect path` mapping.
- **Extract to:** `src/lib/constants/routes.ts`
  ```ts
  export const ROLE_REDIRECTS: Record<string, string> = {
    admin: '/admin', manager: '/manager', coordinator: '/coordinator',
    sales: '/sales', customer: '/',
  };
  ```
- **Lines saved:** ~15

---

### [REUSE-9] Stats card + grid — duplicated in 3 dashboard files
- **Files:**
  - `src/pages/manager/ManagerDashboard.tsx` lines 17–22 + 36–44
  - `src/pages/coordinator/CoordinatorDashboard.tsx` lines 9–15 + 43–51
  - `src/pages/sales/SalesDashboard.tsx` lines 10–15 + 48–57
- **Duplication:** Each dashboard hardcodes its own `stats` array and renders it with identical card markup: icon wrapper (colored bg + material icon) → bold value → uppercase label.
- **Extract to:** `src/shared/components/StatsGrid.tsx`
  ```tsx
  interface Stat { label: string; value: string; icon: string; color: string; }
  export function StatsCard({ stat }: { stat: Stat }) { ... }
  export function StatsGrid({ stats }: { stats: Stat[] }) { ... }
  ```
- **Lines saved:** ~36 across 3 files

---

### [REUSE-10] `role === 'coordinator'` conditional rendering — duplicated in 5 pages
- **Files:**
  - `src/pages/admin/AdminTourPrograms.tsx` line 115
  - `src/pages/admin/AdminActiveTours.tsx` line 139
  - `src/pages/admin/ServiceList.tsx` line 78
  - `src/pages/admin/AdminSuppliers.tsx` line 120
  - `src/pages/admin/VoucherManagement.tsx` line 107
- **Duplication:** Every coordinator page calls `const role = user?.role || 'guest'` then checks `role === 'coordinator'` to show/hide action buttons.
- **Extract to:** `src/shared/hooks/useCanEdit.ts`
  ```ts
  export function useCanEdit(): boolean {
    const role = useAuthStore(s => s.user?.role);
    return role === 'coordinator' || role === 'admin';
  }
  ```
- **Lines saved:** ~10 × 5 = 50

---

## Reusable Components (not currently shared)

### [COMP-1] `SlideDrawer`
- **Used in:** `AdminUsers.tsx`, `VoucherManagement.tsx`, `AdminSuppliers.tsx`, `ServiceList.tsx`, `AdminActiveTours.tsx`
- **Extract to:** `src/shared/components/SlideDrawer.tsx`
- **Priority:** HIGH — 5 duplicate instances, ~70 lines each

### [COMP-2] `AdminSidebar`
- **Used in:** `AdminLayout.tsx`, `ManagerLayout.tsx`, `CoordinatorLayout.tsx`, `SalesLayout.tsx`
- **Extract to:** `src/shared/components/AdminSidebar.tsx`
- **Priority:** HIGH — 4 duplicate instances, ~40 lines each; also resolves REUSE-6

### [COMP-3] `StatsCard` / `StatsGrid`
- **Used in:** `ManagerDashboard.tsx`, `CoordinatorDashboard.tsx`, `SalesDashboard.tsx`
- **Extract to:** `src/shared/components/StatsGrid.tsx`
- **Priority:** MEDIUM — 3 duplicate card-render functions

### [COMP-4] `TourCard` (public-facing card)
- **Used in:** `src/pages/public/TourList.tsx` (static articles) and `src/pages/customer/Wishlist.tsx`
- **Extract to:** `src/shared/components/TourCard.tsx`
- **Priority:** LOW — requires markup normalization first; both usages differ slightly

### [COMP-5] `PassengerTable`
- **Used in:** `src/pages/admin/SalesBookingDetail.tsx` lines 189–215
- **Extract to:** `src/shared/components/PassengerTable.tsx`
- **Priority:** LOW — only one place, but clearly a reusable data-display component

---

## Other Findings

### [DATA-1] `BookingHistory.tsx` uses wrong data source — TECH DEBT P1
- **File:** `src/pages/customer/BookingHistory.tsx` line 3
- **Issue:** `import { MOCK_BOOKINGS } from '../../data/mockData'` — CLAUDE.md explicitly says `MOCK_BOOKINGS` is a legacy stub with a different schema. All booking pages must use `mockBookings` from `src/data/bookings.ts` instead.
- **Action:** Migrate to canonical `mockBookings`. Map tab values `'upcoming'/'completed'/'cancelled'` → actual status values (`booked`/`completed`/`cancelled`).

### [DATA-2] `BookingDetail.tsx` has fully local mock data, not wired to store
- **File:** `src/pages/customer/BookingDetail.tsx` lines 7–28
- **Issue:** Hardcoded local state; `useParams` for `id` exists but is ignored (`id || 'BKG-889922'`). Should look up from `mockBookings` like `SalesBookingDetail.tsx` does.
- **Action:** Wire to `mockBookings.find(b => b.id === id)`.

### [CONST-1] `statusLabels` in `utils.ts` vs local STATUS constants — schema drift risk
- **File:** `src/lib/utils.ts` lines 15–28 vs `BookingManagement.tsx` lines 24–37
- **Issue:** `utils.ts` has keys `pending, confirmed, cancelled, completed, refunded, open, full, draft, review, approved, rejected, discontinued`. `BookingManagement.tsx` local `STATUS_LABEL` has `booked, pending, confirmed, completed, cancelled`. These overlap but differ. Consolidating to `src/lib/constants/booking.ts` eliminates drift.

### [LAYOUT-1] `roleRedirects` in `PublicLayout.tsx` also used in `Login.tsx`
- **File:** `src/components/layout/PublicLayout.tsx` lines 5–11 + `src/pages/auth/Login.tsx` lines 13–28
- **Issue:** `PublicLayout` uses `roleRedirects` for "Enter Dashboard" links; `Login` uses inline if/else with the same mapping. Extract to `src/lib/constants/routes.ts` (REUSE-8).

---

## Summary

| Priority | ID | Name | Files Affected | Est. Lines Saved |
|----------|----|------|-----------------|-----------------|
| HIGH | REUSE-5 | SlideDrawer component | 5 | ~350 |
| HIGH | REUSE-7 | AdminSidebar component | 4 | ~160 |
| HIGH | REUSE-6 | useLayoutGuard / useSidebarNav | 4 | ~80 |
| MEDIUM | REUSE-3 | Booking status constants | 3 | ~45 |
| MEDIUM | REUSE-9 | StatsGrid component | 3 | ~36 |
| LOW | REUSE-10 | useCanEdit hook | 5 | ~50 |
| LOW | REUSE-1 | formatCurrency | 2 | ~8 |
| LOW | REUSE-2 | formatDate variants | 2 | ~10 |
| LOW | REUSE-8 | ROLE_REDIRECTS | 2 | ~15 |
| — | DATA-1 | Migrate BookingHistory to canonical bookings | 1 | — |
| — | DATA-2 | Wire BookingDetail to mockBookings | 1 | — |

**Total duplicate lines identified: ~750 across ~20 files**

**New shared files to create (4):**
- `src/shared/components/SlideDrawer.tsx`
- `src/shared/components/AdminSidebar.tsx`
- `src/shared/hooks/useLayoutGuard.ts`
- `src/shared/hooks/useCanEdit.ts`
- `src/lib/constants/booking.ts`
- `src/lib/constants/routes.ts`
- `src/shared/components/StatsGrid.tsx`
