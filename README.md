# Travela

Travela là hệ thống đặt tour và vận hành tour gồm public booking, customer portal và dashboard nội bộ cho admin/manager/coordinator/sales.

## Chạy cho khách

Đọc đúng file này:

```text
docs/SETUP.md
```

Tóm tắt:

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

Bỏ file `.env` được gửi riêng vào:

```text
tourist-grade/backend/.env
```

Chạy:

```powershell
docker compose up -d --build
```

Mở:

```text
http://localhost:8080
```

## Tài khoản demo

Mật khẩu tất cả tài khoản:

```text
123456aA@
```

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`

## Cấu trúc repo

- `frontend/`: React 19 + Vite.
- `backend/`: Express + Prisma + PostgreSQL + PayOS.
- `docs/SETUP.md`: hướng dẫn chạy ngắn gọn cho khách.
- `docker-compose.yml`: local stack.
