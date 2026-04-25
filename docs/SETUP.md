# SETUP CHẠY LOCAL CHO KHÁCH

Làm đúng các bước này. Không tự đoán thêm.

## Bước 1: Clone repo

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

## Bước 2: Bỏ file `.env` vào đúng chỗ

Copy file `.env` được gửi riêng vào:

```text
tourist-grade/backend/.env
```

Đúng cấu trúc:

```text
tourist-grade/
  backend/
    .env          <-- file phải nằm ở đây
  frontend/
  docker-compose.yml
  scripts/
    setup-local.ps1
```

## Bước 3: Chạy setup một lệnh

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script này tự làm các việc sau:

1. Kiểm tra `backend/.env` có PayOS keys chưa.
2. Kiểm tra Docker.
3. Kiểm tra/cài `cloudflared` nếu máy chưa có.
4. Build và chạy `frontend + backend + database` bằng Docker.
5. Bật Cloudflare tunnel cho backend local.
6. Tự lấy URL tunnel mới.
7. Tự ghi `PAYOS_WEBHOOK_URL` vào `backend/.env`.
8. Tự restart backend.
9. Tự gọi PayOS confirm webhook.

## Bước 4: Mở web

```text
http://localhost:8080
```

Backend health:

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

## Nếu tắt máy hoặc tắt terminal

Chạy lại đúng lệnh này để mở lại Docker + Cloudflare tunnel + cập nhật webhook URL mới:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Cloudflare quick tunnel thường đổi URL mỗi lần chạy, nên không sửa tay nếu không cần. Script sẽ tự sửa `PAYOS_WEBHOOK_URL`.

## Reset dữ liệu test

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

## Xem logs khi lỗi

```powershell
docker compose logs -f backend
```

## Lưu ý

- Không đặt `.env` ở root project.
- Không đặt `.env` trong `frontend`.
- File đúng là `tourist-grade/backend/.env`.
- Muốn PayOS báo thành công thật thì phải thanh toán QR/link thật hoặc sandbox chính thức của PayOS. Tạo link không đồng nghĩa đã thanh toán.
