# Travela

Travela is now being moved from a frontend-only mock setup to a real local stack:

- `frontend/`: React 19 + Vite
- `backend/`: Express + Prisma + PostgreSQL
- `docker-compose.yml`: local `frontend + backend + postgres`

## Current local target

The intended fresh-machine local flow is:

```bash
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
docker compose up -d --build
```

No Node.js install or manual `.env` copy is required for the default demo stack.
Docker Compose provides safe development defaults for database, JWT, and optional
PayOS variables.

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

- The app runs without PayOS keys; payment-link creation returns a clear
  configuration error until keys are supplied.
- For real PayOS testing, pass keys through a local root `.env`, shell variables,
  or your deployment secret manager. Do not commit real PayOS credentials.
- Webhook URL must be public even when API runs on localhost
- Use a Cloudflare Tunnel and set `PAYOS_WEBHOOK_URL` to:
  `https://<your-tunnel>/api/v1/payments/payos/webhook`

Example root `.env` for real PayOS testing:

```bash
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_WEBHOOK_URL=https://<your-tunnel>/api/v1/payments/payos/webhook
```

See:

1. [docs/07-INFRA-DOCKER-ENV.md](docs/07-INFRA-DOCKER-ENV.md)
2. [docs/14-CLOUDFLARE-PAGES.md](docs/14-CLOUDFLARE-PAGES.md)
3. [docs/04-BACKEND-ARCHITECTURE.md](docs/04-BACKEND-ARCHITECTURE.md)
4. [docs/05-API-CONTRACT.md](docs/05-API-CONTRACT.md)
