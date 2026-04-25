# 02. Kiến Trúc Hệ Thống

Tài liệu này giải thích hệ thống chạy như thế nào ở mức technical vừa đủ để người mới đọc code không bị lạc.

## 1. Bức tranh tổng thể

Travela chạy theo mô hình web app 3 lớp:

```text
Người dùng
  ↓ thao tác trên trình duyệt
Frontend React - http://localhost:8080
  ↓ gọi HTTP API
Backend Express - http://localhost:4000/api/v1
  ↓ đọc/ghi qua Prisma
PostgreSQL
```

Khi có thanh toán PayOS, hệ thống có thêm một đường webhook:

```text
PayOS
  ↓ gọi webhook public
Cloudflare tunnel
  ↓ forward request
Backend local - http://localhost:4000/api/v1/payments/payos/webhook
```

## 2. Frontend

Frontend nằm trong `frontend/`, dùng React + Vite.

Frontend chịu trách nhiệm:

- dựng giao diện public và dashboard;
- điều hướng route;
- kiểm tra user đang đăng nhập ở client;
- gọi API backend;
- hiển thị dữ liệu backend trả về;
- giữ state giao diện như filter, form, tab, modal.

Các thư mục chính:

```text
frontend/src/app       cấu hình app và router
frontend/src/features  màn hình theo module nghiệp vụ
frontend/src/entities  type/entity dùng trong UI
frontend/src/shared    layout, store, API client, helper dùng chung
frontend/tests         Playwright E2E tests
```

Frontend không nên tự quyết định trạng thái nghiệp vụ cuối cùng. Ví dụ booking đã thanh toán hay chưa phải do backend/database quyết định, frontend chỉ hiển thị.

## 3. Backend

Backend nằm trong `backend/`, dùng Express + Prisma.

Backend chịu trách nhiệm:

- login, refresh token, logout;
- phân quyền theo role;
- validate dữ liệu gửi lên;
- xử lý booking, tour, voucher, payment;
- tạo link thanh toán PayOS;
- nhận webhook PayOS;
- đọc/ghi PostgreSQL;
- trả JSON cho frontend.

Các thư mục chính:

```text
backend/src/routes      API endpoints
backend/src/lib         auth, jwt, password, payos, prisma, mapper
backend/src/middleware  middleware xác thực/phân quyền
backend/prisma          schema và seed data
```

Luồng một request backend thường là:

```text
Request từ frontend
  ↓
Express route
  ↓
Middleware auth nếu cần đăng nhập
  ↓
Validate payload bằng Zod
  ↓
Business logic
  ↓
Prisma query database
  ↓
Mapper dữ liệu trả về frontend
  ↓
Response JSON
```

## 4. Database và Prisma

Database là PostgreSQL. Prisma schema nằm tại:

```text
backend/prisma/schema.prisma
```

Những model quan trọng:

- `User`: tài khoản và role.
- `TourProgram`: chương trình tour gốc.
- `TourInstance`: lịch khởi hành cụ thể của tour.
- `Booking`: đơn đặt tour.
- `BookingPassenger`: hành khách trong booking.
- `PaymentTransaction`: giao dịch thanh toán.
- `Voucher`: mã giảm giá.
- `Supplier`, `SupplierService`, `Service`: nhà cung cấp và dịch vụ vận hành.
- `BlogPost`: bài viết public.

Seed data nằm tại:

```text
backend/prisma/seed.ts
```

Seed tạo tài khoản, tour, booking, voucher, supplier, service và dữ liệu workflow để local có thể test ngay.

## 5. Docker local

`docker-compose.yml` chạy ba service chính:

- `db`: PostgreSQL.
- `backend`: Express API.
- `frontend`: Nginx serve React build.

Backend đọc biến môi trường từ:

```text
backend/.env
```

Khi backend container chạy, nó tự đảm bảo schema và dữ liệu local:

```text
npm run prisma:push
npm run prisma:seed
npm run dev
```

Vì vậy máy mới chỉ cần Docker + `.env`, không cần tự tạo database bằng tay.

## 6. Bootstrap dữ liệu dashboard

Sau khi đăng nhập, frontend cần nhiều dữ liệu dashboard. Thay vì mỗi màn hình gọi quá nhiều API nhỏ, backend có route bootstrap để trả dữ liệu nền theo quyền.

Ý tưởng:

```text
Login thành công
  ↓
Frontend lưu access token
  ↓
Frontend gọi bootstrap
  ↓
Store nhận users, bookings, tourPrograms, tourInstances, suppliers, services, vouchers
  ↓
Dashboard render theo role
```

## 7. Auth và phân quyền

Auth dùng JWT.

- Access token dùng để gọi API protected.
- Refresh token dùng để duy trì phiên đăng nhập.
- Role nằm trong user và được backend kiểm tra ở route cần quyền.

Ví dụ:

- Admin mới được quản lý user.
- Manager mới được duyệt.
- Coordinator mới được thao tác điều phối.
- Customer chỉ được xem dữ liệu của mình.

## 8. PayOS và tunnel

Tạo link thanh toán là backend gọi PayOS. Nhưng để biết khách đã thanh toán chưa, PayOS cần gọi webhook về backend.

Ở local, backend không có domain public. Vì vậy `scripts/setup-local.ps1` mở Cloudflare quick tunnel và ghi URL vào:

```text
PAYOS_WEBHOOK_URL
```

Quick tunnel có thể đổi URL mỗi lần chạy. Script tự cập nhật lại `.env`, restart backend và confirm webhook PayOS.

## 9. Nguyên tắc phát triển

- UI có thể giữ state tạm thời, nhưng trạng thái nghiệp vụ cuối cùng phải ở backend/database.
- Dữ liệu public nên lấy từ API public, không hardcode trên UI.
- Luồng liên quan payment phải xử lý nhất quán: booking, transaction, webhook và trạng thái thanh toán phải khớp nhau.
- Khi thêm route mới, nên có validate payload và kiểm tra role rõ ràng.
