# 07. Infra, Docker, Env

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

## 7.6 Lệnh dự kiến

### Chạy full local stack

```bash
docker compose up --build
```

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

### Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## 7.7 Điều cần làm ngay khi bắt đầu implement backend

1. Cài dependency backend.
2. Generate Prisma client.
3. Tạo migration đầu tiên.
4. Implement `/health` + `/auth/login`.
5. Nối frontend auth.

## 7.8 Mục tiêu Docker sau khi chuyển khỏi mock

Stack mục tiêu:

- `frontend`: build static từ cùng codebase hiện tại
- `api`: serve REST API + healthcheck
- `db`: PostgreSQL
- tùy chọn thêm `seed` job riêng cho local/staging

Điều cần có thêm:

- `api` healthcheck rõ ràng
- command migrate riêng trước khi boot app
- command seed riêng, không trộn vào startup production
- biến env staging/production tách khỏi local

## 7.9 Kế hoạch test hạ tầng sau migration

Tối thiểu cần verify:

1. `docker compose up --build` chạy được full stack local.
2. `api` kết nối DB và trả `/health`.
3. frontend đọc được `VITE_API_BASE_URL`.
4. migrate chạy được trên DB trống.
5. seed QA chạy được trên DB staging giả lập.
6. teardown/rebuild không làm hỏng state volume khi dev.
