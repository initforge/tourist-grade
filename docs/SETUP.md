# Setup Local

Mục tiêu: clone repo, đặt đúng file `.env`, chạy một script là toàn bộ hệ thống tự build và tự chạy.

## 1. Cần có sẵn

- Docker Desktop đã cài và đang mở.
- File `.env` được gửi riêng.

Không cần tự cài Node, PostgreSQL, frontend, backend hay cloudflared. Script sẽ xử lý phần cần thiết.

## 2. Clone repo

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

## 3. Đặt file `.env`

Copy file `.env` vào đúng đường dẫn này:

```text
tourist-grade/backend/.env
```

Cấu trúc đúng:

```text
tourist-grade/
  backend/
    .env
  docker-compose.yml
  scripts/
    setup-local.ps1
```

## 4. Chạy một lệnh

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script sẽ tự làm hết:

- Kiểm tra `backend/.env`.
- Kiểm tra Docker.
- Cài/kiểm tra `cloudflared` nếu máy chưa có.
- Build và chạy database, backend, frontend bằng Docker.
- Tạo Cloudflare tunnel cho backend local.
- Ghi tunnel URL mới vào `PAYOS_WEBHOOK_URL` trong `backend/.env`.
- Restart backend.
- Confirm webhook PayOS.

## 5. Mở web

```text
http://localhost:8080
```

Backend health:

```text
http://localhost:4000/health
```

## 6. Tài khoản đăng nhập

Mật khẩu tất cả tài khoản:

```text
123456
```

- Admin: `admin@travela.vn`
- Manager: `manager@travela.vn`
- Coordinator: `coordinator@travela.vn`
- Sales: `sales@travela.vn`
- Customer: `customer@travela.vn`

## 7. Lần sau mở lại

Chạy lại đúng một lệnh:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Quick tunnel của Cloudflare có thể đổi URL mỗi lần chạy, nhưng script tự cập nhật lại webhook PayOS. Không cần sửa tay.

## 8. Muốn tunnel URL không đổi

Quick tunnel không giữ URL cố định. Muốn URL cố định thì cần Cloudflare named tunnel + domain thật đang nằm trong Cloudflare DNS.

Khi có domain cố định, đặt webhook PayOS về:

```text
https://ten-mien-co-dinh/api/v1/payments/payos/webhook
```

Nếu chưa có domain thì dùng script ở trên là đủ cho local.

## 9. Xem log khi lỗi

```powershell
docker compose logs -f backend
```

## 10. Reset dữ liệu test

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```
