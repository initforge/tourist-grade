# 10. Local Docker Runbook

Tên file được giữ lại để tránh gãy link cũ, nhưng nội dung hiện đã chuẩn hóa theo hướng `localhost + docker compose`.

## 10.1 Mục tiêu

Chốt một cách chạy repo thống nhất để:

- người mới clone repo có thể boot stack local nhanh
- mọi verify mặc định bám `localhost`
- frontend, API và Postgres cùng chạy trong một stack Docker
- các task tiếp theo có chung giả định môi trường

## 10.2 Môi trường chuẩn

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:4000/api/v1`
- Postgres: `localhost:5432`

Stack chuẩn:

- `frontend`
- `backend`
- `db`

## 10.3 Điều kiện máy dev

- Node.js `20.x`
- npm `10.x`
- Docker Desktop
- Git

## 10.4 Cách chạy chuẩn

Từ root repo:

```bash
docker compose up --build
```

Nếu muốn chạy nền:

```bash
docker compose up -d --build
```

## 10.5 Trình tự boot local đề xuất

1. Clone repo.
2. Kiểm tra Docker Desktop đã chạy.
3. Từ root repo chạy `docker compose up --build`.
4. Mở `http://localhost:8080`.
5. Nếu cần debug backend riêng, kiểm tra container `backend` và logs.

## 10.6 Env mặc định

Frontend mặc định dùng:

- `VITE_API_BASE_URL=http://localhost:4000/api/v1`

Backend trong Docker mặc định dùng:

- `PORT=4000`
- `DATABASE_URL=postgresql://travela:travela@db:5432/travela?schema=public`
- `CORS_ORIGIN=http://localhost:8080`

## 10.7 Lệnh thường dùng

### Xem container đang chạy

```bash
docker compose ps
```

### Xem logs

```bash
docker compose logs -f
```

### Restart một service

```bash
docker compose restart backend
docker compose restart frontend
```

### Dừng stack

```bash
docker compose down
```

### Reset sạch dữ liệu local

```bash
docker compose down -v
docker compose up --build
```

Lệnh reset chỉ dùng khi chấp nhận xóa toàn bộ volume Postgres local.

## 10.8 Chạy split mode khi cần debug

Nếu không muốn chạy full Docker stack cho tất cả service:

### Chạy frontend riêng

```bash
cd frontend
npm install
npm run dev
```

### Chạy backend riêng

```bash
cd backend
npm install
npm run dev
```

Khi chạy split mode, vẫn giữ giả định backend local là `http://localhost:4000/api/v1`.

## 10.9 Smoke test local tối thiểu

Sau khi boot stack, tối thiểu cần pass:

1. Trang `http://localhost:8080` mở được.
2. Không có container nào crash loop.
3. Frontend gọi đúng API local.
4. Login mock/local flow vẫn vào được các màn role chính.
5. Các route chính như booking, customer, sales, manager mở được.

## 10.10 Playwright local

Khi cần chạy e2e trên local Docker:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:8080'
cd frontend
npm run test:e2e -- sales-booking-detail.spec.ts
```

Nếu cần dùng local Vite dev server thay vì Docker frontend:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4174'
cd frontend
npm run test:e2e -- sales-booking-detail.spec.ts
```

## 10.11 Quy ước cho task tiếp theo

- Mặc định mọi task mới đều hiểu là chạy local.
- Nếu docs nào còn nhắc `production/pages.dev`, coi đó là tham chiếu lịch sử trừ khi có ghi chú khác.
- Nếu sau này phát sinh nhu cầu staging/production thật, phải tách thành runbook riêng thay vì trộn vào local runbook này.
