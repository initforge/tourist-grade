# 14. Cloudflare Pages (Frontend Only)

Repo ưu tiên chạy local bằng `docker compose`. Tuy nhiên có thể deploy **frontend-only** lên Cloudflare Pages để demo UI.

Lưu ý:

- Hiện frontend vẫn còn mock/seed (localStorage) cho nhiều màn hình, nên deploy frontend-only vẫn chạy được.
- Nếu cần gọi API thật, phải có backend public và set `VITE_API_BASE_URL` tương ứng trong Cloudflare Pages.

## 14.1 Deploy thủ công bằng Wrangler

```bash
cd frontend
npm ci
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name tourist-grade
```

Hoặc dùng script:

```bash
cd frontend
npm run deploy:pages
```

## 14.2 Deploy qua Cloudflare Pages (kết nối GitHub)

Trong Cloudflare Pages:

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Build output directory: `dist`

Env variables (tuỳ chọn):

- `VITE_API_BASE_URL`: URL API thật (ví dụ: `https://api.example.com/api/v1`)

