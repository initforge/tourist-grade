# 07. Infra, Docker, Env

Tài liệu này mô tả môi trường chuẩn để chạy repo trên `localhost`.

## 7.1 Services local

`docker-compose.yml` hiện định nghĩa:

- `db`: PostgreSQL 16
- `api`: Express API scaffold
- `frontend`: build Vite app và serve bằng Nginx

## 7.2 Port mapping

- Frontend: `http://localhost:8080`
- API: `http://localhost:4000`
- Postgres: `localhost:5432`

## 7.3 Env backend

File mẫu:

- `backend/.env.example`

Biến chính:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## 7.4 Env frontend

File mẫu:

- `frontend/.env.example`

Biến chính:

- `VITE_API_BASE_URL`
- `VITE_AUTH_TOKEN_KEY`
- feature flags

## 7.5 Docker files

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.dockerignore`

## 7.6 Cách chạy chuẩn

### Chạy full local stack

```bash
docker compose up --build
```

### Chạy nền

```bash
docker compose up -d --build
```

### Dừng stack

```bash
docker compose down
```

### Xem logs

```bash
docker compose logs -f
```

## 7.7 Chạy tách service khi cần

### Frontend riêng

```bash
cd frontend
npm install
npm run dev
```

### Backend riêng

```bash
cd backend
npm install
npm run dev
```

### Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## 7.8 Checklist local sau khi boot stack

Tối thiểu cần verify:

1. `docker compose up --build` chạy được full stack local.
2. Frontend mở được ở `http://localhost:8080`.
3. API trả được `http://localhost:4000/health` nếu route đã có.
4. Frontend đọc đúng `VITE_API_BASE_URL=http://localhost:4000/api/v1`.
5. Postgres lên được và container `db` ở trạng thái healthy.

## 7.9 Reset dữ liệu local

Khi cần reset sạch toàn bộ local stack:

```bash
docker compose down -v
docker compose up --build
```

Chỉ dùng lệnh này khi chấp nhận xóa volume Postgres local.

## 7.10 Quy ước hạ tầng hiện tại

- Local Docker là môi trường vận hành mặc định của repo.
- Nếu có staging/production về sau thì phải tách docs riêng hoặc ghi rõ là tham chiếu tương lai.
- Seed không được trộn vào startup mặc định nếu sau này cần state local ổn định hơn.
