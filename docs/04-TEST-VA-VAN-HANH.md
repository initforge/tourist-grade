# 04. Test Và Vận Hành

File này ghi các lệnh cần dùng khi muốn kiểm tra nhanh hoặc debug local.

## Build backend

```powershell
cd backend
npm run build
```

## Test backend

```powershell
cd backend
npm test
```

## Build frontend

```powershell
cd frontend
npm run build
```

## Test E2E chính

Cần Docker stack đang chạy trước.

```powershell
cd frontend
$env:PLAYWRIGHT_BASE_URL='http://localhost:8080'
$env:PLAYWRIGHT_API_BASE_URL='http://localhost:4000/api/v1'
npx playwright test tests/customer-flow.spec.ts tests/ui-surface-audit.spec.ts --workers=1
```

## Xem log backend

```powershell
docker compose logs -f backend
```

## Xem trạng thái container

```powershell
docker compose ps
```

## Reset dữ liệu booking test

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

## Khi PayOS webhook lỗi

Chạy lại script setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script sẽ tạo lại tunnel, ghi lại `PAYOS_WEBHOOK_URL` và confirm lại webhook PayOS.

## Khi đưa sang máy mới

Chỉ cần:

1. Cài và mở Docker Desktop.
2. Clone repo.
3. Copy file `backend/.env`.
4. Chạy `scripts/setup-local.ps1`.

Không cần tự setup database, Node server hay frontend server nếu chỉ chạy bằng Docker.
