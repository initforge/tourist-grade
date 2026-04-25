# SETUP CHẠY LOCAL CHO KHÁCH

Làm đúng 3 bước này là chạy được giống máy dev.

## Bước 1: Clone repo GitHub

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

## Bước 2: Bỏ file `.env` vào đúng thư mục

Copy file `.env` được gửi riêng vào thư mục:

```text
tourist-grade/backend/.env
```

Đúng cấu trúc phải là:

```text
tourist-grade/
  backend/
    .env          <-- file nằm ở đây
  frontend/
  docker-compose.yml
```

Không đặt `.env` ở ngoài root nếu làm theo hướng dẫn này.

## Bước 3: Build và chạy Docker

```powershell
docker compose up -d --build
```

Mở web:

```text
http://localhost:8080
```

Kiểm tra backend:

```text
http://localhost:4000/health
```

## Tài khoản đăng nhập

Mật khẩu tất cả tài khoản:

```text
123456aA@
```

- Admin: `admin@travela.vn`
- Manager: `manager@travela.vn`
- Coordinator: `coordinator@travela.vn`
- Sales: `sales@travela.vn`
- Customer: `customer@travela.vn`

## Nếu muốn test PayOS webhook thật

Chạy tunnel:

```powershell
cloudflared tunnel --url http://localhost:4000
```

Copy URL tunnel mới, sửa dòng này trong `backend/.env`:

```env
PAYOS_WEBHOOK_URL=https://<url-tunnel-moi>/api/v1/payments/payos/webhook
```

Restart backend:

```powershell
docker compose up -d --build backend
```

## Khi cần reset dữ liệu test

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

## Khi lỗi thì xem logs

```powershell
docker compose logs -f backend
```
