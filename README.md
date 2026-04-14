# Travela

Travela hiện ở trạng thái chuyển tiếp từ frontend demo dùng một phần mock sang hệ thống chuẩn bị triển khai backend thật.

Điểm bắt đầu nên đọc:

1. [docs/00-INDEX.md](docs/00-INDEX.md)
2. [docs/04-BACKEND-ARCHITECTURE.md](docs/04-BACKEND-ARCHITECTURE.md)
3. [docs/05-API-CONTRACT.md](docs/05-API-CONTRACT.md)
4. [docs/06-DATABASE-DESIGN.md](docs/06-DATABASE-DESIGN.md)
5. [docs/09-IMPLEMENTATION-ROADMAP.md](docs/09-IMPLEMENTATION-ROADMAP.md)
6. [docs/10-SETUP-TO-PRODUCTION.md](docs/10-SETUP-TO-PRODUCTION.md)

## Repo Layout

- `frontend/`: React 19 + Vite UI, hiện vẫn giữ một phần mock để demo một số flow công khai/nội bộ.
- `backend/`: Express + Prisma scaffold cho API thật.
- `docs/`: bộ tài liệu đánh số, là nguồn đọc chính để hiểu hệ thống.
- `docker-compose.yml`: local stack cho frontend + api + postgres.

## Run Frontend Only

```bash
cd frontend
npm install
npm run dev
```

## Planned Full Stack Run

```bash
docker compose up --build
```

Frontend mặc định đọc `VITE_API_BASE_URL=http://localhost:4000/api/v1`.
