# 02. Kiến Trúc

Hệ thống chạy theo mô hình quen thuộc: frontend gọi backend, backend đọc ghi database.

```text
Người dùng
  ↓
Frontend React - http://localhost:8080
  ↓
Backend Express - http://localhost:4000/api/v1
  ↓
PostgreSQL
```

## Frontend

Frontend nằm trong `frontend/`.

Nhiệm vụ:

- hiển thị giao diện;
- điều hướng theo route và role;
- gọi API backend;
- giữ state đăng nhập và dữ liệu đang hiển thị.

Các màn hình chính nằm trong `frontend/src/features`.

## Backend

Backend nằm trong `backend/`.

Nhiệm vụ:

- xác thực đăng nhập;
- kiểm tra quyền theo role;
- xử lý booking, tour, voucher, payment;
- đọc ghi PostgreSQL bằng Prisma;
- nhận webhook PayOS.

Các API chính nằm trong `backend/src/routes`.

## Database

Database là PostgreSQL. Cấu trúc bảng nằm trong:

```text
backend/prisma/schema.prisma
```

Dữ liệu mẫu nằm trong:

```text
backend/prisma/seed.ts
```

Khi chạy Docker local, backend tự push schema và seed dữ liệu để app có thể dùng ngay.

## Docker

`docker-compose.yml` chạy:

- database;
- backend;
- frontend.

Vì vậy máy khách chỉ cần Docker và file `backend/.env`, không cần tự cài từng phần.

## Cloudflare tunnel

PayOS cần gọi webhook về backend. Vì backend local không có domain public, script dùng Cloudflare tunnel để tạo link public tạm thời trỏ về `http://localhost:4000`.
