# Travela

Travela is now being moved from a frontend-only mock setup to a real local stack:

- `frontend/`: React 19 + Vite
- `backend/`: Express + Prisma + PostgreSQL
- `docker-compose.yml`: local `frontend + backend + postgres`

## Current local target

The intended local flow is:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:4000/api/v1`
- Health check: `http://localhost:4000/health`
- Postgres: `localhost:5432`

## Local credentials

Seed accounts created by `backend/prisma/seed.ts`:

- `admin@travela.vn / 123456aA@`
- `manager@travela.vn / 123456aA@`
- `coordinator@travela.vn / 123456aA@`
- `sales@travela.vn / 123456aA@`
- `customer@travela.vn / 123456aA@`

## PayOS local notes

- Backend reads PayOS keys from `backend/.env`
- Webhook URL must be public even when API runs on localhost
- Use a Cloudflare Tunnel and set `PAYOS_WEBHOOK_URL` to:
  `https://<your-tunnel>/api/v1/payments/payos/webhook`

See:

1. [docs/07-INFRA-DOCKER-ENV.md](docs/07-INFRA-DOCKER-ENV.md)
2. [docs/14-CLOUDFLARE-PAGES.md](docs/14-CLOUDFLARE-PAGES.md)
3. [docs/04-BACKEND-ARCHITECTURE.md](docs/04-BACKEND-ARCHITECTURE.md)
4. [docs/05-API-CONTRACT.md](docs/05-API-CONTRACT.md)
