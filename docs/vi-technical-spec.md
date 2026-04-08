# Travela — Tài Liệu Kỹ Thuật

> Các quyết định kiến trúc, trade-offs, bài toán khó, tối ưu

---

## 1. Bài Toán & Giải Pháp

### 1.1 Bài Toán

Các OTA (Đại lý Du lịch Trực tuyến) truyền thống thường dùng hệ thống monolithic, khó mở rộng và bảo trì. Travela thể hiện cách tiếp cận hiện đại với phân đoạn theo vai trò — mỗi loại người dùng (Admin, Manager, Coordinator, Sales, Customer) có dashboard riêng biệt, giảm cognitive load và cải thiện hiệu quả vận hành.

### 1.2 Tổng Quan Giải Pháp

Frontend React 19 với mock data, Zustand state management, và backend Express/Node sắp tới. Frontend implement full RBAC qua hệ thống layout layers: mỗi role có layout component riêng xử lý navigation guards, sidebar và routing — tạo workspace riêng biệt cho từng vai trò.

### 1.3 Điểm Khác Biệt

| Khía cạnh | OTA Truyền thống | Travela |
|-----------|-------------------|---------|
| Kiến trúc | Monolithic | Layout phân đoạn theo role |
| Auth | Session-based | Mock RBAC với Zustand |
| Design | Generic | Indochine Heritage Luxe |
| State | Context/Redux | Zustand (minimal, nhanh) |
| Styling | Bootstrap/Ant | Tailwind v4 + Ant Design |

---

## 2. Kiến Trúc Hệ Thống

### 2.1 Sơ Đồ Kiến Trúc

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                                │
│  React 19 SPA + Zustand (client-side state)                │
│  React Router v7 (client-side routing + guards)              │
└────────────────────────────┬───────────────────────────────┘
                               │ API (sắp tới)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Backend (Sắp tới)                        │
│  Express / Node.js + PostgreSQL + Prisma                     │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Phân Rã Module

| Module | Trách nhiệm | Công nghệ |
|--------|-------------|-----------|
| `frontend/src/pages/` | Page components | React 19 |
| `frontend/src/components/layout/` | 6 layout shells cho mỗi role | React 19 |
| `frontend/src/store/` | Auth state, mock login | Zustand 5 |
| `frontend/src/data/` | Mock data (canonical source) | TypeScript |
| `frontend/src/lib/` | Utilities, design tokens | TypeScript |
| `database/` | DB schema + seeds (kế hoạch) | SQL / Prisma |

### 2.3 Luồng Dữ Liệu

```
User chọn role (Login page)
    │
    ▼
PublicLayout mount → gọi useAuthStore.login(role)
    │
    ▼
Zustand auth state updated → isAuthenticated: true, user: User
    │
    ▼
React Router v7 check layout guard
    │
    ▼
Role-specific layout mount (AdminLayout / ManagerLayout / etc.)
    │
    ▼
Page component render, đọc data từ Zustand
```

### 2.4 Hệ Thống Layout Theo Role

```
PublicLayout      → Landing, TourList, TourDetail, Checkout, Blog
AuthLayout        → Login, Register, ForgotPassword, ResetPassword
AdminLayout       → AdminUsers, BookingManagement, VoucherManagement, etc.
ManagerLayout     → ManagerDashboard, AdminTourPrograms, AdminActiveTours, TourEstimate
CoordinatorLayout → CoordinatorDashboard, ServiceList, AdminSuppliers, TourSettlement
SalesLayout       → SalesDashboard, SalesBookingDetail
```

---

## 3. Quyết Định Công Nghệ

### 3.1 Tại Sao Chọn Stack Này?

| Quyết định | Lựa chọn | Trade-off |
|------------|----------|-----------|
| Frontend | React 19 + Vite 8 | ✅ HMR nhanh, DX hiện đại / ❌ React 19 có thể có compat nhỏ |
| State | Zustand 5 | ✅ Boilerplate tối thiểu, selector-based / ❌ Không có devtools built-in |
| Styling | Tailwind v4 + Ant Design 6.3 | ✅ Utility-first + design system / ❌ Hai hệ thống styling |
| Routing | React Router v7 | ✅ Nested routes, data routers / ❌ API mới |
| Animations | Framer Motion 12 | ✅ Declarative, mạnh mẽ / ❌ Bundle lớn (924 KB, đang cleanup) |

### 3.2 Design System

**Thẩm mỹ:** Indochine Heritage Luxe — bảng màu Sơn Mài Việt Nam, khoảng trắng Đông Á (Ma), typography serif tương phản cao.

| Token | Giá trị | Sử dụng |
|-------|---------|---------|
| `--color-primary` | `#2A2421` | Espresso nâu — headings, buttons |
| `--color-secondary` | `#D4AF37` | Vàng — accents, CTAs |
| `--color-tertiary` | `#2C5545` | Xanh đậm — trust, success |
| `--color-background` | `#FBFBFB` | Trắng ngọc trai — base |
| `--color-surface` | `#F3F3F3` | Off-white — cards |
| `--color-error` | `#ba1a1a` | Error states |

---

## 4. Bài Toán Khó Giải Quyết

### 4.1 RBAC Không Có Backend

**Vấn đề:** Implement RBAC routing guards mà không có backend auth thật.

**Cách tiếp cận:** Zustand auth store với mock login. Mỗi layout component export named function (không phải default) và chứa role guard ở đầu component. `App.tsx` map routes tới layouts qua `<element>` prop của React Router v7.

**Triển khai:**
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

**Vấn đề:** Hai hệ thống styling cùng tồn tại mà không conflict.

**Cách tiếp cận:** Tailwind CSS v4 cho layout, typography và custom utility classes qua CSS `@theme` directive. Ant Design components dùng nguyên với `ConfigProvider` để customize theme. Không dùng `@apply` để tránh conflict.

---

## 5. Tối Ưu

### 5.1 Hiệu Năng

| Tối ưu | Trạng thái |
|---------|-----------|
| Zustand selector optimization | ✅ 6 components chọn đúng slice |
| Unused dependency removal | ✅ framer-motion, lucide-react, @ant-design/icons đã gỡ |
| TypeScript strict mode | ✅ Enabled via tsconfig.app.json |
| Bundle size (924 KB) | ⚠️ Code-split theo route khi backend land |

### 5.2 Bundle Size

Bundle ban đầu: **924 KB** (minified + gzipped: 237 KB).
Sau khi gỡ framer-motion + lucide-react + @ant-design/icons: tiết kiệm ~4 KB. Full code-split kế hoạch khi backend API land.

---

## 6. Điểm Cạnh Tranh

- **Thiết kế Indochine Heritage Luxe** — thẩm mỹ độc đáo, khác biệt với OTA templates
- **Workspace phân đoạn theo vai trò** — mỗi role có dashboard riêng, không phải shared admin panel
- **Zustand thay vì Redux** — boilerplate tối thiểu, selector-based reactivity, iteration nhanh hơn
- **Tailwind v4** — CSS-first configuration, không cần tailwind.config.js, native `@theme` directive

---

## 7. Bảo Mật

- **Chỉ Mock Auth** — không có real authentication. Zustand store giữ role trong memory.
- **Role guards** — mỗi layout enforce role tại thời điểm render (không phải route-level)
- **Không có dữ liệu nhạy cảm** — tất cả là mock/seed, không có PII thật
- **RBAC kế hoạch** — JWT + role middleware khi backend land

---

## 8. Hạn Chế Đã Biết

| Hạn chế | Tác động | Xử lý |
|---------|----------|--------|
| Chỉ mock data | Không có persistence thật | Backend integration kế hoạch |
| Không có real auth | Security chỉ frontend | JWT kế hoạch cho backend |
| Bundle lớn (924 KB) | Initial load chậm | Route code-splitting kế hoạch |
| Dual styling system | Learning curve | Tailwind v4 convention được enforce |

---

## 9. Lộ Trình Phát Triển

- [ ] Backend: Express.js + Prisma + PostgreSQL
- [ ] Real authentication với JWT
- [ ] Route-level code splitting (giảm bundle từ 924 KB)
- [ ] Thay mock data bằng API calls
- [ ] Thêm unit tests (Vitest)
- [ ] Thêm E2E tests (Playwright)
- [ ] Docker + docker-compose cho local dev
- [ ] CI/CD pipeline với GitHub Actions
