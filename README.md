# Travela

Travela là hệ thống đặt tour và vận hành tour gồm public booking, customer portal và dashboard nội bộ cho admin/manager/coordinator/sales.

## Chạy nhanh trên máy mới

Yêu cầu duy nhất: đã cài Git và Docker.

```bash
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
docker compose up -d --build
```

Mở app:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:4000/health`
- Backend API: `http://localhost:4000/api/v1`

Không cần cài Node.js, PostgreSQL, Prisma CLI, hoặc tự copy `.env` để chạy demo local.

## Tài khoản demo

Tất cả dùng mật khẩu `123456aA@`:

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`

## Cấu trúc repo

- `frontend/`: React 19 + Vite + Zustand + Ant Design/Tailwind.
- `backend/`: Express + Prisma + PostgreSQL + JWT + PayOS integration.
- `docs/`: tài liệu business, technical, setup, deploy.
- `docker-compose.yml`: local stack `frontend + backend + postgres`.

## PayOS local

Local demo chạy được không cần PayOS keys. Nếu muốn test PayOS thật, tạo file `.env` ở root repo hoặc set shell env:

```bash
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_WEBHOOK_URL=https://<public-backend>/api/v1/payments/payos/webhook
```

Sau đó restart backend:

```bash
docker compose up -d --build backend
```

Không commit secret thật vào repo.

## Test nhanh

Backend:

```bash
cd backend
npm test
npm run build
```

Frontend build:

```bash
cd frontend
npm run build
```

E2E local khi Docker stack đang chạy:

```bash
cd frontend
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_API_BASE_URL=http://localhost:4000/api/v1 npx playwright test --workers=1
```

## Docs nên đọc

Bắt đầu từ [docs/00-INDEX.md](docs/00-INDEX.md). Thứ tự chính:

1. [System Overview](docs/01-CURRENT-SYSTEM.md)
2. [Domain Model](docs/03-DOMAIN-MODEL.md)
3. [Frontend Modules](docs/02-FRONTEND-MODULES.md)
4. [Backend Architecture](docs/04-BACKEND-ARCHITECTURE.md)
5. [API Contract](docs/05-API-CONTRACT.md)
6. [Database Design](docs/06-DATABASE-DESIGN.md)
7. [Docker and Environment](docs/07-INFRA-DOCKER-ENV.md)
8. [Setup To Production](docs/10-SETUP-TO-PRODUCTION.md)
9. [Cloudflare Pages and PayOS Webhook](docs/14-CLOUDFLARE-PAGES.md)
