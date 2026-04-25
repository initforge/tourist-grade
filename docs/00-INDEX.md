# Travela Documentation

Travela là hệ thống đặt tour và vận hành tour nội bộ, gồm public booking, khu khách hàng, và dashboard cho các vai trò vận hành.

Bộ tài liệu này được sắp theo thứ tự đọc từ đầu đến cuối. Nếu mới clone repo hoặc mới tham gia dự án, đọc theo đúng thứ tự bên dưới.

## 1. Đọc nhanh để hiểu sản phẩm

1. [01. System Overview](01-CURRENT-SYSTEM.md) — Travela là gì, ai dùng, các phân hệ chính.
2. [03. Domain Model](03-DOMAIN-MODEL.md) — các khái niệm business: tour program, tour instance, booking, voucher, payment, cancellation.
3. [02. Frontend Modules](02-FRONTEND-MODULES.md) — map màn hình theo từng role và trách nhiệm UI.

## 2. Đọc để hiểu kỹ thuật

4. [04. Backend Architecture](04-BACKEND-ARCHITECTURE.md) — Express, route, middleware, Prisma, seed, mapper.
5. [05. API Contract](05-API-CONTRACT.md) — endpoint chính, auth, booking, payment, workflow.
6. [06. Database Design](06-DATABASE-DESIGN.md) — schema PostgreSQL/Prisma và quan hệ dữ liệu.
7. [07. Docker and Environment](07-INFRA-DOCKER-ENV.md) — chạy local bằng Docker, env, reset dữ liệu.

## 3. Đọc để vận hành / release

8. [10. Setup To Production](10-SETUP-TO-PRODUCTION.md) — local, staging, production checklist.
9. [14. Cloudflare Pages and PayOS Webhook](14-CLOUDFLARE-PAGES.md) — deploy frontend, public backend, PayOS webhook.
10. [11. Feedback Checklist](11-FEEDBACK-ROW-CHECKLIST.md) — checklist phản hồi QA/business.

## 4. Tài liệu phụ trợ / lịch sử

- [08. Cleanup Decisions](08-CLEANUP-DECISIONS.md) — quyết định cleanup và chuẩn dữ liệu.
- [09. Implementation Roadmap](09-IMPLEMENTATION-ROADMAP.md) — roadmap triển khai/hoàn thiện.
- [12. Codebase Audit](12-CODEBASE-AUDIT.md) — snapshot audit codebase.
- [13. Migration Playbook](13-MIGRATION-PLAYBOOK.md) — playbook chuyển từ mock sang API thật.
- [15. Local Real PayOS Setup](15-LOCAL-REAL-PAYOS-SETUP.md) — hướng dẫn non-tech để setup local với PayOS thật.

## Source of truth trong code

- Frontend route map: `frontend/src/app/AppRouter.tsx`
- Auth store: `frontend/src/shared/store/useAuthStore.ts`
- App data store: `frontend/src/shared/store/useAppDataStore.ts`
- Backend app: `backend/src/app.ts`
- API router: `backend/src/routes/v1.ts`
- Prisma schema: `backend/prisma/schema.prisma`
- Seed data: `backend/prisma/seed.ts`
- Docker stack: `docker-compose.yml`
- E2E tests: `frontend/tests/*.spec.ts`

## Quy ước cập nhật docs

- Thay đổi business rule thì cập nhật `03`, `05`, `06` nếu có API/DB liên quan.
- Thay đổi route hoặc flow UI thì cập nhật `01`, `02`, và test liên quan.
- Thay đổi Docker/env/deploy thì cập nhật `07`, `10`, `14`.
- Không ghi secret thật vào docs hoặc repo. PayOS thật phải đi qua env/secret manager.

