# 07. Docker and Environment

## Mục tiêu

Local demo phải chạy được trên máy mới chỉ với Git và Docker.

Không bắt buộc cài Node.js, PostgreSQL, Prisma CLI, hoặc tự copy env để xem hệ thống.

## Lệnh chạy local

```bash
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
docker compose up -d --build
```

Sau khi chạy:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:4000/health`
- Backend API: `http://localhost:4000/api/v1`
- PostgreSQL: `localhost:5432`

## Docker services

### `db`

- Image: `postgres:16-alpine`
- Database: `travela`
- User/password local: `travela/travela`
- Volume: `travela-postgres`

### `backend`

- Build từ `backend/Dockerfile`.
- Chạy Express + Prisma.
- Khi container start, backend đảm bảo schema/seed local theo script hiện tại.
- Port: `4000`.

### `frontend`

- Build từ `frontend/Dockerfile`.
- Build Vite static app.
- Serve bằng nginx.
- Port: `8080`.

## Env mặc định

`docker-compose.yml` đã cung cấp default development env cho local:

- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- token expiry
- PayOS variables optional

Vì vậy máy mới không cần `backend/.env` để chạy demo.

## Khi nào cần env thật?

Chỉ cần env thật nếu muốn:

- Test PayOS thật với payment link thật.
- Deploy staging/production.
- Đổi domain frontend/backend.
- Đổi JWT secret production.

Tạo file `.env` ở root repo nếu cần override Compose variables:

```bash
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_WEBHOOK_URL=https://<public-backend>/api/v1/payments/payos/webhook
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

Không commit `.env` thật.

## Lệnh vận hành thường dùng

```bash
# build và chạy
docker compose up -d --build

# xem logs
docker compose logs -f backend

# dừng stack
docker compose down

# xóa cả database volume để seed lại từ đầu
docker compose down -v

# reset fixtures qua API
curl -X POST http://localhost:4000/api/v1/dev/reset-booking-fixtures
```

## Test local ngoài Docker

Nếu muốn chạy test bằng Node local:

```bash
cd backend
npm ci
npm test
npm run build
```

```bash
cd frontend
npm ci
npm run build
npx playwright test --workers=1
```

## Lưu ý PayOS local

- Không có PayOS keys thì app vẫn chạy local, nhưng payment-link thật sẽ không gọi được PayOS.
- Có keys thật thì backend tạo link PayOS thật.
- PayOS webhook cần public HTTPS URL; localhost không nhận webhook trực tiếp.
