# 04. Backend Architecture

## Mục tiêu backend

Backend là source of truth cho dữ liệu, trạng thái workflow, auth, payment, cancellation/refund và seed demo. Frontend không nên tự quyết định business state cuối cùng.

## Stack

- Runtime: Node.js 22.
- Framework: Express 5.
- ORM: Prisma.
- Database: PostgreSQL 16.
- Validation: Zod.
- Auth: JWT access token + refresh token.
- Payment integration: PayOS.
- Test: Vitest + Supertest.

## Cấu trúc thư mục

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    app.ts
    index.ts
    config/env.ts
    lib/
    middleware/
    routes/
```

## App lifecycle

1. `src/index.ts` khởi động server.
2. `src/app.ts` tạo Express app, middleware, health route và `/api/v1` router.
3. `src/routes/v1.ts` mount các domain route.
4. Route gọi Prisma qua `src/lib/prisma.ts`.
5. Mapper trong `src/lib/mappers.ts` convert Prisma model sang UI/API model.

## Middleware

- `authenticate`: bắt buộc JWT hợp lệ và user active.
- `authenticateOptional`: đọc JWT nếu có, không fail nếu guest.
- `requireRoles`: kiểm tra role nội bộ.

## Domain routes

- `auth.ts`: login, refresh, logout, me, register.
- `bootstrap.ts`: payload tổng hợp cho frontend sau login/khởi động.
- `public.ts`: public catalog/blog/tour data.
- `bookings.ts`: create booking, lookup, update, cancel request.
- `payments.ts`: PayOS link, webhook, confirm webhook.
- `users.ts`: admin user/customer operations.
- `vouchers.ts`: sales/manager voucher flow.
- `tour-programs.ts`: chương trình tour và approval.
- `tour-instances.ts`: instance workflow, dispatch, estimate, settlement.
- `services.ts`: service catalog.
- `suppliers.ts`: supplier catalog.
- `dev.ts`: reset fixtures cho local/test, không dùng production.

## Payment architecture

PayOS flow:

1. Frontend gọi `POST /api/v1/payments/bookings/:id/payos-link`.
2. Backend tính số tiền còn phải trả.
3. Backend hủy các PayOS transaction cũ của cùng booking còn `UNPAID`.
4. Backend tạo payment link mới.
5. Backend lưu `PaymentTransaction` với status `UNPAID`.
6. PayOS gọi webhook.
7. Backend verify signature bằng PayOS SDK.
8. Nếu paid hợp lệ thì update transaction + booking balance.
9. Nếu webhook thuộc transaction đã `CANCELLED`, backend ignore để tránh trạng thái cũ làm loạn booking.

## Seed và reset

- `prisma/seed.ts` tạo user, tour, booking, voucher, service, supplier và workflow demo.
- `POST /api/v1/dev/reset-booking-fixtures` reset booking/voucher/tour workflow về trạng thái QA.
- Route dev chỉ phục vụ local/test.

## Error contract

API trả JSON theo tinh thần:

```json
{ "success": false, "message": "Human-readable error" }
```

Các helper lỗi nằm trong `src/lib/http.ts`.

## Test backend

- Unit/integration route test nằm cạnh route hoặc lib.
- Chạy:

```bash
cd backend
npm test
npm run build
```

Các case quan trọng:

- Auth và protected route.
- Booking create/lookup/cancel.
- PayOS create link, cancel stale link, webhook paid, webhook cancelled, ignore stale webhook.
- Text normalization.
