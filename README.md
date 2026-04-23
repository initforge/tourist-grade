# Travela

Travela hiện được chuẩn hóa theo hướng `localhost-first`.
Môi trường chuẩn để chạy và verify repo là `docker compose` trên máy local, không phải deploy public URL.

Điểm bắt đầu nên đọc:

1. [docs/00-INDEX.md](docs/00-INDEX.md)
2. [docs/07-INFRA-DOCKER-ENV.md](docs/07-INFRA-DOCKER-ENV.md)
3. [docs/10-SETUP-TO-PRODUCTION.md](docs/10-SETUP-TO-PRODUCTION.md)
4. [docs/04-BACKEND-ARCHITECTURE.md](docs/04-BACKEND-ARCHITECTURE.md)
5. [docs/05-API-CONTRACT.md](docs/05-API-CONTRACT.md)
6. [docs/06-DATABASE-DESIGN.md](docs/06-DATABASE-DESIGN.md)

## Repo Layout

- `frontend/`: React 19 + Vite UI.
- `backend/`: Express + Prisma scaffold cho API.
- `docs/`: bộ tài liệu nguồn đọc chính.
- `docker-compose.yml`: stack local chuẩn cho `frontend + api + postgres`.

## Cách chạy chuẩn

```bash
docker compose up --build
```

Sau khi lên stack:

- Frontend: `http://localhost:8080`
- API: `http://localhost:4000/api/v1`
- Postgres: `localhost:5432`

## Chạy tách service khi cần

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend mặc định đọc `VITE_API_BASE_URL=http://localhost:4000/api/v1`.
