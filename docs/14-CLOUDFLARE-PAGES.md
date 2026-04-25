# 14. Cloudflare Pages and Tunnel

## Frontend deploy

Cloudflare Pages should only be used once the frontend points at a reachable API.

Manual deploy:

```bash
cd frontend
npm ci
npm run build
npx wrangler pages deploy dist --project-name tourist-grade
```

Or:

```bash
cd frontend
npm run deploy:pages
```

Recommended Pages env:

- `VITE_API_BASE_URL=https://<public-backend-domain>/api/v1`

## Local PayOS webhook with Cloudflare Tunnel

PayOS webhook cannot target raw localhost. Use a tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
```

Then update:

- `backend/.env`
- `PAYOS_WEBHOOK_URL=https://<generated-host>/api/v1/payments/payos/webhook`

Optional API call to confirm webhook registration:

```bash
POST /api/v1/payments/payos/confirm-webhook
```

## Important note

If the frontend is deployed to Pages before the backend is public, login, booking, and payment flows will fail because auth and PayOS are no longer mock-only.
