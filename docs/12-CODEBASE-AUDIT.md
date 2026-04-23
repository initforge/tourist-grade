# 12. Codebase Audit

Mục tiêu của tài liệu này là khóa lại bức tranh hiện tại của repo trước khi chuyển từ frontend demo + mock data sang full stack có API, database, Docker, và test nhiều lớp.

## 12.1 Scope đã quét

Phạm vi audit:

- `frontend/src`
- `frontend/tests`
- `backend/src`
- `backend/prisma/schema.prisma`
- `docker-compose.yml`

Quy ước phân loại:

- `Mock-owned`: đang đọc dữ liệu trực tiếp từ `entities/*/data/*`, local state, hoặc `localStorage`.
- `UI-only`: chủ yếu là layout/presentational, ít phụ thuộc data source.
- `Migration-ready`: đã có shape tương đối rõ để thay bằng API adapter mà không phải đập UI.
- `Refactor hotspot`: file lớn, đang giữ nhiều business rule hoặc state chuyển đổi tại page.

## 12.2 Bootstrap và route map

| File | Vai trò hiện tại | Trạng thái | Ghi chú migration |
| --- | --- | --- | --- |
| `frontend/src/main.tsx` | bootstrap React | UI-only | Giữ nguyên, chỉ thay env/API bootstrap sau này |
| `frontend/src/App.tsx` | shell app | UI-only | Không nên chứa business logic |
| `frontend/src/app/AppRouter.tsx` | source of truth cho route map | Migration-ready | Cần gắn loader/guard/query prefetch khi chuyển API |
| `frontend/src/README.md` | quy ước frontend | Migration-ready | Cần đồng bộ với docs repo khi bỏ mock |
| `frontend/src/docs/business-rules.md` | rule UI cần chuyển thành contract backend | Migration-ready | Tiếp tục dùng như backlog contract hóa |

## 12.3 Shared layer

### Shared store, hooks, libs

| File | Vai trò hiện tại | Trạng thái | Hành động sau này |
| --- | --- | --- | --- |
| `frontend/src/shared/store/useAuthStore.ts` | session giả theo role, gắn `__authLogin` | Mock-owned | Ưu tiên cao để chuyển sang token/API auth |
| `frontend/src/shared/hooks/useAuthGuard.ts` | route guard phía client | Migration-ready | Giữ, nhưng đổi nguồn auth state |
| `frontend/src/shared/lib/api/client.ts` | API client nền | Migration-ready | Cần thành entrypoint duy nhất cho request production |
| `frontend/src/shared/lib/utils.ts` | helper format/status | Migration-ready | Tách helper domain nếu logic tăng |
| `frontend/src/shared/lib/bookingReports.ts` | helper tổng hợp booking | Migration-ready | Có thể chuyển một phần sang backend aggregate |
| `frontend/src/shared/lib/nationalities.ts` | danh mục quốc tịch | Migration-ready | Có thể giữ FE hoặc seed DB |

### Layouts

Các file sau chủ yếu là `UI-only`, cần giữ mỏng:

- `frontend/src/shared/layouts/AdminLayout.tsx`
- `frontend/src/shared/layouts/AuthLayout.tsx`
- `frontend/src/shared/layouts/CoordinatorLayout.tsx`
- `frontend/src/shared/layouts/ManagerLayout.tsx`
- `frontend/src/shared/layouts/PublicLayout.tsx`
- `frontend/src/shared/layouts/SalesLayout.tsx`
- `frontend/src/shared/layouts/index.ts`

### Shared UI

| File | Vai trò hiện tại | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| `frontend/src/shared/ui/CancelBookingModal.tsx` | popup hủy booking | Migration-ready | Bind theo API cancel request/confirm |
| `frontend/src/shared/ui/DispatchHDVModal.tsx` | popup phân công HDV | Mock-owned | Đổi sang đọc guide pool từ API receive/dispatch |
| `frontend/src/shared/ui/NationalitySelect.tsx` | input quốc tịch | UI-only | Reuse tốt cho booking thật |
| `frontend/src/shared/ui/PageSearchInput.tsx` | input search dùng chung | UI-only | Reuse được cho list page |

## 12.4 Entity data và mock source

Đây là lớp đang giữ mock business data mạnh nhất.

| File | Data domain | Trạng thái | Ưu tiên thay thế |
| --- | --- | --- | --- |
| `frontend/src/entities/user/data/users.ts` | user seed + role session | Mock-owned | Phase Auth/User |
| `frontend/src/entities/tour/data/tours.ts` | public catalog tour | Mock-owned | Phase Public Tour |
| `frontend/src/entities/booking/data/bookings.ts` | booking seed + `localStorage` persistence | Mock-owned | Phase Booking |
| `frontend/src/entities/tour-program/data/tourProgram.ts` | tour program, holiday, supplier, guide, tour instance | Mock-owned | Phase Internal Ops |
| `frontend/src/entities/voucher/data/vouchers.ts` | voucher seed | Mock-owned | Phase Voucher |
| `frontend/src/entities/voucher/lib/voucherRules.ts` | business rules normalize voucher lifecycle | Migration-ready | Chuyển dần thành backend validation/domain service |
| `frontend/src/entities/blog/data/blogs.ts` | blog seed | Mock-owned | Phase Blog/CMS |

Kết luận:

- `tourProgram.ts` và `bookings.ts` là 2 file mock quan trọng nhất của toàn repo.
- Không nên tiếp tục nhét thêm rule nghiệp vụ vào các file data này.
- Khi có API thật, các file data nên chuyển thành `fixtures` hoặc chỉ phục vụ test/storybook nội bộ.

## 12.5 Feature audit theo miền

### Auth

- `frontend/src/features/auth/pages/Login.tsx`
- `frontend/src/features/auth/pages/Register.tsx`
- `frontend/src/features/auth/pages/ForgotPassword.tsx`
- `frontend/src/features/auth/pages/ResetPassword.tsx`
- `frontend/src/features/auth/pages/index.ts`

Trạng thái:

- `Login/Register` đang phụ thuộc `useAuthStore` giả.
- `ForgotPassword/ResetPassword` là UI placeholder.

Kết luận:

- Cần backend auth trước khi làm tiếp các luồng khác.

### Public / Customer-facing

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/public/pages/Landing.tsx` | UI-only | Dùng aggregate data thật khi có API landing |
| `frontend/src/features/public/pages/TourList.tsx` | Mock-owned | Chuyển sang `GET /tours` |
| `frontend/src/features/public/pages/TourDetail.tsx` | Mock-owned | Chuyển sang `GET /tours/:slug` |
| `frontend/src/features/public/pages/BookingCheckout.tsx` | Refactor hotspot | Đang tính giá và tạo booking phía client |
| `frontend/src/features/public/pages/BookingSuccess.tsx` | Migration-ready | Chỉ cần nhận payload thật |
| `frontend/src/features/public/pages/OrderLookup.tsx` | Mock-owned | Chuyển sang `GET /bookings/lookup/:code` |
| `frontend/src/features/public/pages/BlogList.tsx` | Mock-owned | Chuyển sang `GET /blogs` |
| `frontend/src/features/public/pages/BlogDetail.tsx` | Mock-owned | Chuyển sang `GET /blogs/:slug` |
| `frontend/src/features/public/pages/AboutUs.tsx` | UI-only | Có thể giữ static |

### Customer

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/customer/pages/BookingHistory.tsx` | Mock-owned | Chuyển sang query theo user session |
| `frontend/src/features/customer/pages/BookingDetail.tsx` | Mock-owned | Chuyển sang `GET /bookings/:id` |
| `frontend/src/features/customer/pages/CancelBooking.tsx` | Mock-owned | Chuyển sang cancel request API |
| `frontend/src/features/customer/pages/Profile.tsx` | Migration-ready | Cần `GET/PATCH /me` |
| `frontend/src/features/customer/pages/Wishlist.tsx` | Mock-owned | Chưa có backend shape, cần quyết định có giữ hay bỏ |

### Sales

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/sales/pages/SalesDashboard.tsx` | Mock-owned | Aggregate nên chuyển backend |
| `frontend/src/features/sales/pages/SalesBookings.tsx` | Mock-owned | Query booking queue thật |
| `frontend/src/features/sales/pages/SalesBookingDetail.tsx` | Refactor hotspot | Đang chứa nhiều state thao tác passenger/room/payment |
| `frontend/src/features/sales/pages/Vouchers.tsx` | Refactor hotspot | Đang lưu local voucher state + rule gửi duyệt |

### Coordinator

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/coordinator/pages/CoordinatorDashboard.tsx` | Mock-owned | Aggregate báo cáo nên đi backend |
| `frontend/src/features/coordinator/pages/TourGenerationRules.tsx` | Mock-owned | Rule sinh tour cần backend ownership |
| `frontend/src/features/coordinator/pages/TourPrograms.tsx` | Mock-owned | CRUD/query program |
| `frontend/src/features/coordinator/pages/TourProgramDetail.tsx` | Wrapper / shared-screen consumer | Dùng chung `TourProgramDetailScreen` cho coordinator detail |
| `frontend/src/features/coordinator/pages/TourProgramWizard.tsx` | Refactor hotspot | Wizard lớn, nhiều state business |
| `frontend/src/features/coordinator/pages/TourInstances.tsx` | Mock-owned | Queue điều hành, cần API/filter thật |
| `frontend/src/features/coordinator/pages/TourReceiveDispatch.tsx` | Mock-owned | Read-only receive screen, cần API receive ownership |
| `frontend/src/features/coordinator/pages/TourEstimate.tsx` | Refactor hotspot | Dự toán đang dựng từ mock row model |
| `frontend/src/features/coordinator/pages/TourSettlement.tsx` | Refactor hotspot | Quyết toán edit actual cost tại page |
| `frontend/src/features/coordinator/pages/ServiceList.tsx` | Refactor hotspot | Đang là catalog frontend-only, cần tách service catalog API |
| `frontend/src/features/coordinator/pages/Suppliers.tsx` | Refactor hotspot | Supplier + guide + quote + edit cùng một page |
| `frontend/src/features/coordinator/pages/Vouchers.tsx` | Legacy / route kept only for redirect compatibility | Sidebar đã bỏ voucher; route cũ redirect về dashboard |

### Manager

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/manager/pages/ManagerDashboard.tsx` | Mock-owned | Aggregate backend |
| `frontend/src/features/manager/pages/TourPrograms.tsx` | Mock-owned | Approval list |
| `frontend/src/features/manager/pages/TourProgramDetail.tsx` | Wrapper / shared-screen consumer | Dùng cùng `TourProgramDetailScreen` với coordinator detail |
| `frontend/src/features/coordinator/components/TourProgramDetailScreen.tsx` | Refactor hotspot | Shared detail screen cho coordinator/manager, cần tách tiếp khi backend hóa |
| `frontend/src/features/manager/pages/AdminTourProgramApproval.tsx` | Mock-owned | Quy trình duyệt bán |
| `frontend/src/features/manager/pages/TourEstimate.tsx` | Mock-owned | Read-only estimate |
| `frontend/src/features/manager/pages/ManagerTourEstimateApproval.tsx` | Mock-owned | Duyệt dự toán |
| `frontend/src/features/manager/pages/ActiveTours.tsx` | Refactor hotspot | Nhiều tab, popup, transition status |
| `frontend/src/features/manager/pages/ManagerVoucherApproval.tsx` | Mock-owned | Duyệt voucher |
| `frontend/src/features/manager/pages/Vouchers.tsx` | Mock-owned | Cần hợp nhất contract với sales/coordinator |
| `frontend/src/features/manager/pages/ManagerCancelPolicy.tsx` | UI-only / config draft | Cần quyết định lưu DB hay static config |
| `frontend/src/features/manager/pages/SpecialDays.tsx` | Mock-owned | Nên thành config master data backend |

### Admin

| File | Trạng thái | Ghi chú migration |
| --- | --- | --- |
| `frontend/src/features/admin/pages/AdminUsers.tsx` | Mock-owned | Chuyển sang `GET/POST/PATCH /users` |

## 12.6 Backend scaffold audit

| File | Vai trò hiện tại | Trạng thái | Thiếu gì |
| --- | --- | --- | --- |
| `backend/src/index.ts` | entrypoint | Migration-ready | health/logging/shutdown |
| `backend/src/app.ts` | express app | Migration-ready | error middleware chuẩn |
| `backend/src/routes/v1.ts` | version router | Skeleton-only | chưa có module router thật |
| `backend/src/config/env.ts` | env parse | Migration-ready | cần validation chặt hơn |
| `backend/prisma/schema.prisma` | draft schema | Migration-ready | thiếu catalog service, guide language, price history |

Kết luận:

- Backend đang ở mức scaffold tốt, nhưng chưa có service/repository/controller/use-case layer.
- Prisma schema chưa đủ cho `service catalog`, `supplier quote history`, `guide profile`.

## 12.7 Test suite audit

### Hiện trạng

- E2E đang tập trung ở `frontend/tests`.
- Test helper ở `frontend/tests/support/app.ts` đang login bằng hook frontend `__authLogin`.
- Test hiện hợp với giai đoạn mock UI, nhưng sẽ phải tách dần sang seed/API login thật.

### File test hiện có

- `frontend/tests/admin-users.spec.ts`
- `frontend/tests/coordinator.spec.ts`
- `frontend/tests/coordinator-remaining.spec.ts`
- `frontend/tests/customer-flow.spec.ts`
- `frontend/tests/dashboard-feedback.spec.ts`
- `frontend/tests/feedback-hardening.spec.ts`
- `frontend/tests/manager-remaining.spec.ts`
- `frontend/tests/role-strict-hardening.spec.ts`
- `frontend/tests/sales-booking-detail.spec.ts`
- `frontend/tests/sales-bookings-tools.spec.ts`
- `frontend/tests/sales-dashboard.spec.ts`
- `frontend/tests/sales-manager.spec.ts`
- `frontend/tests/sales-vouchers.spec.ts`
- `frontend/tests/support/app.ts`

### Kết luận test

- Bộ E2E hiện hữu có giá trị lớn để chống regressions UI.
- Nhưng sau migration cần thêm:
  - backend unit test
  - backend integration test với DB test
  - API contract test
  - frontend component test cho form logic khó
  - E2E tách rõ `mock-mode` và `api-mode`

## 12.8 Hotspots cần refactor trước khi nối API

Ưu tiên rất cao:

1. `frontend/src/shared/store/useAuthStore.ts`
2. `frontend/src/entities/booking/data/bookings.ts`
3. `frontend/src/entities/tour-program/data/tourProgram.ts`
4. `frontend/src/features/public/pages/BookingCheckout.tsx`
5. `frontend/src/features/coordinator/pages/TourProgramWizard.tsx`
6. `frontend/src/features/coordinator/pages/TourEstimate.tsx`
7. `frontend/src/features/coordinator/pages/TourSettlement.tsx`
8. `frontend/src/features/coordinator/pages/Suppliers.tsx`
9. `frontend/src/features/sales/pages/Vouchers.tsx`
10. `frontend/src/features/manager/pages/ActiveTours.tsx`

## 12.9 Chuẩn refactor đề xuất

Khi refactor một module, áp dụng cùng một form:

1. Tách `page shell` khỏi `data mapping`.
2. Tạo `shared/lib/api/<domain>.ts` hoặc `features/<domain>/api/*`.
3. Tạo `mapper` từ response API sang UI model.
4. Chuyển mock data thành `fixtures` hoặc seed backend.
5. Giữ test E2E route-level; thêm unit/component test cho mapper và form calculation.

## 12.10 Quyết định chốt sau audit

- Không mở thêm mock data mới ở page/component.
- Với supplier/service/guide, cần tách 3 resource riêng thay vì dồn vào một blob JSON.
- Với booking/estimate/settlement, backend phải sở hữu state transition và tính toán cuối cùng.
- Với dashboard, frontend chỉ render aggregate response thay vì tự tổng hợp từ danh sách lớn.

## 12.11 Audit tương tác ngày 2026-04-20

Phạm vi quét bổ sung:

- `frontend/src/features/coordinator/**/*.tsx`
- `frontend/src/features/manager/**/*.tsx`
- `frontend/tests/coordinator-remaining.spec.ts`
- `frontend/tests/manager-remaining.spec.ts`

Kết quả:

- AST scan các thẻ `<button>` trong hai role chính hiện trả `TOTAL 0` cho nhóm thiếu `onClick`, `type`, `disabled` hoặc `aria-disabled`.
- Các nút mock vẫn phải có side effect nhìn thấy được: cập nhật local state, mở modal, điều hướng, hoặc hiển thị `antd message`.
- `TourProgramWizard` tách bảng giá dự kiến sang `TourProgramPricingTables.tsx`; nút thêm NCC/DV, chọn mặc định, xóa dòng và input giá/ghi chú đều chạy trên mock state.
- `TourGenerationRules` tab `Chờ duyệt bán` có state riêng cho sửa/xóa dòng chờ duyệt, không còn chỉ render nút tĩnh.
- `TourPrograms` của coordinator/manager có thao tác ngừng kinh doanh/tạm ngừng cập nhật local state và lý do ngừng.
- Các nút lưu/gửi ở dự toán, quyết toán và detail legacy đã được nối vào message/navigate để tránh UI chết trong giai đoạn mock.

Ghi chú môi trường:

- Vite 8 trên Windows cần chạy với `--configLoader native`; bundle config loader có thể fail khi bundle native dependency của Tailwind.
- `frontend/package.json` và `frontend/scripts/playwright-dev-server.mjs` đã chuẩn hóa theo native config loader.
- Trong shell sandbox hiện tại, Playwright CLI bị chặn launch worker/browser với `spawn EPERM`; vì vậy kết quả audit này dựa trên `tsc`, production build, AST scan và test spec đã cập nhật. Khi chạy ngoài sandbox cần chạy lại full Playwright.
