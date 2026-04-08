# CONTRACT.md — Travela Frontend Collaboration

> Quy ước phân chia ownership files, shared data, và quy tắc thông báo thay đổi schema.
> Có hiệu lực từ: **2026-04-01**

---

## 1. Phân chia Ownership

### Session A (Sales + Manager scope)

| File / Folder | Sở hữu |
|---|---|
| `src/pages/sales/` | Session A |
| `src/pages/manager/` | Session A |
| `src/pages/admin/` (BookingManagement, VoucherManagement) | Session A |
| `src/data/vouchers.ts` | Session A |

### VAESA (Coordinator scope)

| File / Folder | Sở hữu |
|---|---|
| `src/pages/coordinator/` | VAESA |
| `src/components/DispatchHDVModal.tsx` | VAESA |
| `src/components/CancelBookingModal.tsx` | VAESA |
| `src/components/layout/CoordinatorLayout.tsx` | VAESA |
| `src/data/tourProgram.ts` | VAESA |

### Shared — không ai sở hữu tuyệt đối

| File | Quy tắc |
|---|---|
| `src/data/bookings.ts` | **Canonical** — ai cũng đọc. Muốn sửa schema → thông báo bên kia |
| `src/data/tourProgram.ts` | **VAESA sở hữu** — Session A chỉ đọc type + mock data |
| `src/data/tours.ts` | **Cân bằng** — mỗi bên chỉ đọc |
| `src/data/users.ts` | **Cân bằng** — mỗi bên chỉ đọc |

---

## 2. Canonical Data Sources

Mỗi domain có **đúng một file** là nguồn chuẩn. Mọi component phải import từ canonical source.

| Domain | Canonical Source |
|---|---|
| Bookings | `src/data/bookings.ts` → `mockBookings` |
| Tour Programs / Instances / Guides / Suppliers | `src/data/tourProgram.ts` → `mockTourPrograms`, `mockTourInstances`, `mockTourGuides`, `mockSuppliers` |
| Vouchers | `src/data/vouchers.ts` → `mockVouchers` |

**Sai:**
```typescript
import { mockBookings } from '../../data/tourProgram'; // ❌ tourProgram không export bookings
```

**Đúng:**
```typescript
import { mockBookings } from '../../data/bookings';    // ✅ bookings.ts
import { mockTourInstances } from '../../data/tourProgram'; // ✅
```

---

## 3. Schema Field Quy ước

### CostEstimate

```
CostEstimate.pricing        ✅ — KHÔNG dùng .pricingConfig
CostEstimate.categories[]   ✅
CostItem.unitPrice          ✅ (number)
CostItem.total               ✅ (number)
```

### Supplier

```
Supplier interface KHÔNG có field .status
→ muốn đếm supplier active → mockSuppliers.length
```

### Booking

```
Booking.passengers[].cccd          ✅ optional, chỉ adult
Booking.passengers[].type         'adult' | 'child' | 'infant'
Booking.paymentStatus              'paid' | 'partial' | 'unpaid'
Booking.refundStatus              'pending' | 'processing' | 'completed'
Booking.status                    'pending' | 'confirmed' | 'completed' | 'cancelled'
```

### Voucher

```
Voucher.status      'draft' | 'pending_approval' | 'rejected' | 'active' | 'inactive'
Voucher.applicableTours  string[] | undefined
Voucher.rejectionReason  string | undefined
```

---

## 4. Import Path Conventions

### Component files (trong `pages/*/`)
- Đến `data/bookings.ts` → `../../data/bookings`
- Đến `data/tourProgram.ts` → `../../data/tourProgram`

### Shared component files (trong `components/`)
- Đến `data/bookings.ts` → `../data/bookings`
- Đến `data/tourProgram.ts` → `../data/tourProgram`

**Sai:**
```typescript
import type { Booking } from '../../data/bookings'; // ❌ components/ dùng ../
```

---

## 5. Quy Tắc Thông Báo Khi Thay Đổi

Khi một bên thay đổi schema hoặc canonical data, **phải thông báo** bên kia qua:

1. **Git commit message** rõ ràng ghi chủ đề thay đổi
2. **Ping bên kia** (chat/message) kèm:
   - Tên file/schema field thay đổi
   - Trước → Sau (before/after)
   - Impact: có breaking change không

### Thay đổi cần thông báo ngay

- Thêm / sửa / xóa field trong type interfaces
- Đổi tên export trong canonical data files
- Đổi type của field hiện có (string → number, thêm required, etc.)
- Thêm status/flag mới vào enum

### Thay đổi KHÔNG cần thông báo

- Thêm mock data record mới (không thay schema)
- Thêm component/file mới trong scope sở hữu
- Sửa UI/layout không liên quan đến data shape

---

## 6. TypeScript Conventions

- Dùng `import type` cho type-only imports (`verbatimModuleSyntax` enforced)
- Không dùng `any` — dùng explicit interface
- Callback params trong `.map()` phải có type annotation:
  ```typescript
  mockBookings.filter((b: Booking) => ...)           // ✅
  mockBookings.filter(b => ...)                      // ❌ implicit any
  ```
- Spread `...useState<T>(...)` khi literal type không match union type:
  ```typescript
  type TabKey = 'overview' | 'guests' | 'itinerary' | 'estimate';
  const tabs: Array<{ key: TabKey; ... }>            // ✅
  const tabs = [{ key: 'overview', ... }] as const   // ❌ type too narrow
  ```

---

## 7. Pre-existing Issues (Chưa Fix)

| File | Issue | Ghi chú |
|---|---|---|
| `BookingCheckout.tsx` | Chunk size > 500KB | P2 — defer đến backend |
| `SalesBookingDetail.tsx` | 419 lines | P2 — module refactor |
| `AdminTourProgramWizard.tsx` | 352 lines | P2 — multi-step form |
| `AdminSuppliers.tsx` | 307 lines | P2 — module refactor |

---

## 8. Git Workflow

```
Session A (Sales + Manager):  branch → commit → push → PR
VAESA (Coordinator):          branch → commit → push → PR
```

- Mỗi PR gắn label: `[sales]`, `[manager]`, `[coordinator]`
- Conflict trên shared file (`data/bookings.ts`, `data/tourProgram.ts`) → 2 bên tự resolve, không auto-merge
- Build phải pass (`npm run build`) trước khi merge

---

## 9. Verification Checklist

Trước mỗi PR, đảm bảo:

- [ ] `npm run build` pass (0 TypeScript errors)
- [ ] Không dùng sai canonical source (bookings từ bookings.ts, tourProgram từ tourProgram.ts)
- [ ] Import path đúng cho vị trí file (`../../data` vs `../data`)
- [ ] Không có `any` implicit trong callbacks
- [ ] Nếu thay đổi schema — đã thông báo bên kia

---

*Bản này được viết bởi Session A. Bên VAESA review và phản hồi trước khi user duyệt.*
