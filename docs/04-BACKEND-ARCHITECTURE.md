# 04. Backend Architecture

## 4.1 Stack chốt

- Runtime: Node.js 22
- HTTP layer: Express
- ORM: Prisma
- Database: PostgreSQL
- Validation: Zod
- Container: Docker Compose

Lý do chọn:

- Nhanh để dựng tiếp từ hiện trạng frontend.
- Prisma cho migration/schema rõ ràng.
- Express đủ nhẹ cho giai đoạn implement nhanh, không tạo thêm framework overhead.

## 4.2 Kiến trúc module đề xuất

### Core

- `src/config/*`: env, app config
- `src/middlewares/*`: auth, error, request logging
- `src/lib/*`: db, jwt, crypto, pagination, response helpers

### Modules

- `src/modules/auth/*`
- `src/modules/users/*`
- `src/modules/tour-programs/*`
- `src/modules/tour-instances/*`
- `src/modules/bookings/*`
- `src/modules/vouchers/*`
- `src/modules/suppliers/*`
- `src/modules/blogs/*`
- `src/modules/reports/*`

## 4.3 Mẫu cấu trúc một module

- `controller.ts`: nhận request/response
- `service.ts`: business rules
- `repository.ts`: Prisma queries
- `schema.ts`: Zod request validation
- `mapper.ts`: transform DB model ↔ API DTO
- `types.ts`: module-level types nếu cần

## 4.4 Response envelope

Chuẩn nên dùng:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Lỗi:

```json
{
  "success": false,
  "message": "Human readable error",
  "errors": []
}
```

## 4.5 Auth strategy

- Access token JWT ngắn hạn.
- Refresh token lưu DB.
- Role check bằng middleware.
- Không dùng auth giả lập sau khi module `auth` hoàn thành.

## 4.6 Business boundary quan trọng

- Không để frontend tự tính trạng thái nghiệp vụ quan trọng.
- Validation vòng đời tour/booking/voucher phải ở backend.
- Giá trị report/dashboard phải lấy từ aggregate query hoặc materialized logic phía server.

## 4.7 Thứ tự module backend nên làm

1. `auth`
2. `tour-programs`
3. `tour-instances`
4. `bookings`
5. `users`
6. `vouchers`
7. `suppliers`
8. `blogs`
9. `reports`
