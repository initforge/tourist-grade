# Travela

Travela là hệ thống đặt tour và vận hành tour cho khách hàng, sales, coordinator, manager và admin.

## Chạy nhanh

Cần Docker Desktop và file `backend/.env` được gửi riêng.

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
# copy file .env vào đúng: tourist-grade/backend/.env
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Mở web:

```text
http://localhost:8080
```

## Docs

- `docs/SETUP.md`: hướng dẫn chạy local nhanh nhất.
- `docs/00-MUC-LUC.md`: mục lục tài liệu.
- `docs/01-TONG-QUAN.md`: tổng quan dự án.
- `docs/02-KIEN-TRUC.md`: kiến trúc đơn giản.
- `docs/03-LUONG-NGHIEP-VU.md`: các luồng nghiệp vụ chính.
- `docs/04-TEST-VA-VAN-HANH.md`: test và vận hành local.
