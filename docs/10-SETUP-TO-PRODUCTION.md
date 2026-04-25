# 10. Setup To Production

## 1. Local demo

Mục tiêu: người mới clone repo chạy được app ngay.

```bash
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
docker compose up -d --build
```

Kiểm tra:

- `http://localhost:8080`
- `http://localhost:4000/health`

Login bằng seed account trong `01-CURRENT-SYSTEM.md`.

## 2. Local QA

Trước khi test destructive:

```bash
curl -X POST http://localhost:4000/api/v1/dev/reset-booking-fixtures
```

Chạy E2E:

```bash
cd frontend
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_API_BASE_URL=http://localhost:4000/api/v1 npx playwright test --workers=1
```

Trên PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:8080'
$env:PLAYWRIGHT_API_BASE_URL='http://localhost:4000/api/v1'
npx playwright test --workers=1
```

## 3. Staging

Staging cần tách rõ:

- PostgreSQL managed hoặc container volume riêng.
- Backend public HTTPS URL.
- Frontend trỏ `VITE_API_BASE_URL` tới backend staging.
- JWT secrets staging riêng.
- PayOS sandbox/staging credentials nếu có.

Checklist staging:

1. Build backend image.
2. Apply Prisma migration/schema.
3. Seed dữ liệu QA nếu cần.
4. Deploy backend với HTTPS.
5. Deploy frontend với API base URL staging.
6. Confirm PayOS webhook nếu test payment thật.
7. Chạy smoke test auth, booking, payment link, lookup, dashboard role.

## 4. Production

Production không dùng default dev secrets.

Bắt buộc cấu hình:

- `DATABASE_URL` production.
- `JWT_ACCESS_SECRET` mạnh.
- `JWT_REFRESH_SECRET` mạnh.
- `CORS_ORIGIN` domain frontend production.
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` nếu bật payment thật.
- `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`, `PAYOS_WEBHOOK_URL` production.

Không bật route dev/reset ở production. Backend hiện có guard `NODE_ENV=production` để không expose reset route.

## 5. Release checklist

Trước khi release:

- `backend npm test`
- `backend npm run build`
- `frontend npm run build`
- Playwright E2E nhóm liên quan.
- Kiểm tra không commit `.env` thật.
- Kiểm tra PayOS không còn payment request cũ gây nhầm lẫn trong dashboard.
- Kiểm tra docs nếu có đổi business/API/DB/deploy.

## 6. Rollback

Nếu release lỗi:

1. Rollback image/container về tag trước.
2. Không tự rollback DB nếu đã có migration destructive; cần migration reverse có kiểm soát.
3. Tạm disable PayOS/payment nếu lỗi payment consistency.
4. Reset fixtures chỉ dùng local/staging, không dùng production.
