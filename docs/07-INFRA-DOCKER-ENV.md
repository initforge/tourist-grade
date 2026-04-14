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
