# 07. Infra, Docker, Env

## Standard local stack

`docker-compose.yml` defines:

- `db`: PostgreSQL 16
- `backend`: Express + Prisma API
- `frontend`: built Vite app served by Nginx

## Ports

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`
- Postgres: `localhost:5432`

## Backend env

Primary file:

- `backend/.env`

Template:

- `backend/.env.example`

Main variables:

- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `PAYOS_RETURN_URL`
- `PAYOS_CANCEL_URL`
- `PAYOS_WEBHOOK_URL`

## Frontend env

Primary file:

- `frontend/.env`

Main variable:

- `VITE_API_BASE_URL=http://localhost:4000/api/v1`

## Expected startup flow

Backend container startup now does:

1. `prisma db push`
2. `prisma seed`
3. `npm run dev`

This keeps local Docker bootstrap close to one-command usage.

## Commands

Full stack:

```bash
docker compose up --build
```

Background:

```bash
docker compose up -d --build
```

Logs:

```bash
docker compose logs -f
```

Reset local data:

```bash
docker compose down -v
docker compose up --build
```

## Current verification constraint

The repository is wired for Docker-first local run, but actual end-to-end verification still requires:

- Docker Desktop daemon running
- PostgreSQL container healthy
- optional Cloudflare Tunnel for PayOS webhook callbacks
