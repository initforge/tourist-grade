# 00. Docs Index

Đây là bộ tài liệu nguồn đọc chính của repo trong giai đoạn chuyển tiếp từ frontend demo sang full stack chạy local bằng Docker.

## Trạng thái hiện tại

- Môi trường chuẩn để chạy repo là `localhost` qua `docker compose`.
- Frontend vẫn còn một phần mock/seed để phục vụ demo và kiểm thử UI.
- Backend đã có scaffold `Express + Prisma + PostgreSQL`, chưa implement đủ business logic.
- Docker đã có local stack cho `frontend + api + postgres`.

## Thứ tự nên đọc

1. [01-CURRENT-SYSTEM.md](01-CURRENT-SYSTEM.md)
2. [02-FRONTEND-MODULES.md](02-FRONTEND-MODULES.md)
3. [03-DOMAIN-MODEL.md](03-DOMAIN-MODEL.md)
4. [04-BACKEND-ARCHITECTURE.md](04-BACKEND-ARCHITECTURE.md)
5. [05-API-CONTRACT.md](05-API-CONTRACT.md)
6. [06-DATABASE-DESIGN.md](06-DATABASE-DESIGN.md)
7. [07-INFRA-DOCKER-ENV.md](07-INFRA-DOCKER-ENV.md)
8. [08-CLEANUP-DECISIONS.md](08-CLEANUP-DECISIONS.md)
9. [09-IMPLEMENTATION-ROADMAP.md](09-IMPLEMENTATION-ROADMAP.md)
10. [10-SETUP-TO-PRODUCTION.md](10-SETUP-TO-PRODUCTION.md)
11. [12-CODEBASE-AUDIT.md](12-CODEBASE-AUDIT.md)
12. [13-MIGRATION-PLAYBOOK.md](13-MIGRATION-PLAYBOOK.md)
13. [14-CLOUDFLARE-PAGES.md](14-CLOUDFLARE-PAGES.md)

## Source Of Truth

- Route map frontend: `frontend/src/app/AppRouter.tsx`
- Auth/session frontend: `frontend/src/shared/store/useAuthStore.ts`
- API client frontend: `frontend/src/shared/lib/api/client.ts`
- Backend entrypoint: `backend/src/index.ts`
- Backend app/router: `backend/src/app.ts`, `backend/src/routes/v1.ts`
- Database schema draft: `backend/prisma/schema.prisma`
- Docker local stack: `docker-compose.yml`
- Local runbook: `docs/07-INFRA-DOCKER-ENV.md`, `docs/10-SETUP-TO-PRODUCTION.md`
- Codebase audit snapshot: `docs/12-CODEBASE-AUDIT.md`
- Migration playbook: `docs/13-MIGRATION-PLAYBOOK.md`

## Quy ước làm tiếp

- Tất cả hướng dẫn vận hành mặc định bám `localhost`.
- Không mở rộng thêm mock frontend cho các module mới nếu có thể seed từ backend.
- Dữ liệu thật phải đi qua API; mock frontend chỉ là lớp chuyển tiếp cho local demo.
- Nếu cần dữ liệu demo cho QA, ưu tiên seed DB riêng ở backend thay vì hard-code vào page/component.
- Mọi thay đổi domain/API phải cập nhật docs `03`, `05`, `06`, `09`.
- Trước khi cắt mock của một module, phải cập nhật thêm `12` và `13`.
