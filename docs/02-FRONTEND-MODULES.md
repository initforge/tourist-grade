# 02. Frontend Modules

## 2.1 Kiến trúc frontend

Frontend đang theo cấu trúc:

- `src/components/layout/*`: layout theo role
- `src/pages/public/*`: public pages
- `src/pages/customer/*`: customer area
- `src/pages/admin/*`: admin pages
- `src/pages/manager/*`: manager pages
- `src/pages/coordinator/*`: coordinator pages
- `src/pages/sales/*`: sales pages
- `src/store/*`: global client state
- `src/data/*`: hiện chỉ còn type definitions + empty collections tương thích
- `src/lib/api/*`: điểm bắt đầu cho API client thật

## 2.2 Layout responsibilities

- `PublicLayout`: navbar, footer, điều hướng public/customer.
- `AuthLayout`: khung đăng nhập/đăng ký.
- `AdminLayout`: shell admin.
- `ManagerLayout`: shell manager.
- `CoordinatorLayout`: shell coordinator.
- `SalesLayout`: shell sales.

## 2.3 Shared state

- `useAuthStore`: session client-side.
- Chưa có query cache layer.
- Chưa có shared service/repository layer cho domain modules.

## 2.4 Vấn đề hiện tại của frontend

- Nhiều page đọc trực tiếp từ `src/data/*`.
- Chưa có lớp `services` hoặc `repositories`.
- Chưa có chuẩn response mapping từ API sang UI model.
- Một số màn đang tính toán trực tiếp trong component thay vì view-model/service.

## 2.5 Hướng refactor đúng

### Bước 1

- Giữ page/component như hiện tại.
- Tạo `api client` và `domain service` riêng.

### Bước 2

- Chuyển page từ `import mock*` sang `useEffect + apiRequest`.
- Tách loading / empty / error state.

### Bước 3

- Tách formatter, mapper, state machine helper ra khỏi component lớn.

## 2.6 Module nên ưu tiên chuyển API trước

1. Auth
2. Public tours + booking lookup
3. Booking checkout + booking history
4. Tour program + tour instance
5. Voucher
6. Supplier/service catalog
7. Report/dashboard aggregates

## 2.7 Những file frontend quan trọng nhất

- Router: `frontend/src/App.tsx`
- Auth store: `frontend/src/store/useAuthStore.ts`
- API client: `frontend/src/lib/api/client.ts`
- Domain types: `frontend/src/data/*.ts`

## 2.8 Nguyên tắc implement tiếp

- Không gọi `fetch` trực tiếp trong nhiều page khác nhau cho cùng một resource.
- Mỗi domain có một service file riêng.
- Mapping từ response API sang UI model phải tập trung một chỗ.
- Empty state phải được giữ lại vì repo hiện mặc định không có data seed.
