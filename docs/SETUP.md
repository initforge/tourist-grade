# Setup Nhanh

## 1. Chạy app

Cần có:

- Docker Desktop đang mở.
- File `.env` được gửi riêng.

Clone repo:

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

Copy file `.env` vào đúng vị trí:

```text
tourist-grade/backend/.env
```

Chạy một lệnh:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script tự build Docker, chạy database/backend/frontend, mở Cloudflare tunnel, cập nhật `PAYOS_WEBHOOK_URL`, restart backend và confirm webhook PayOS.

Mở web:

```text
http://localhost:8080
```

## 2. Tài khoản

Mật khẩu tất cả tài khoản:

```text
123456
```

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`

## 3. Mở lại lần sau

Chạy lại lệnh này:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Cloudflare quick tunnel có thể đổi link mỗi lần chạy. Script tự cập nhật webhook PayOS, không cần sửa tay.

## 4. Test nhanh

Backend:

```powershell
cd backend
npm run build
npm test
```

Frontend:

```powershell
cd frontend
npm run build
```

E2E khi Docker đang chạy:

```powershell
cd frontend
$env:PLAYWRIGHT_BASE_URL='http://localhost:8080'
$env:PLAYWRIGHT_API_BASE_URL='http://localhost:4000/api/v1'
npx playwright test tests/customer-flow.spec.ts tests/ui-surface-audit.spec.ts --workers=1
```

## 5. Lệnh hữu ích

Xem backend log:

```powershell
docker compose logs -f backend
```

Reset dữ liệu booking test:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

## 6. Tunnel cố định

Quick tunnel không giữ URL cố định. Muốn link cố định thì cần Cloudflare named tunnel + domain thật.

Nếu chỉ chạy local cho khách xem/test thì dùng script là đủ.
