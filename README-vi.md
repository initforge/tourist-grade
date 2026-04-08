# Travela — Nền Tảng Đặt Tour Du Lịch Cao Cấp

> Đồ án tốt nghiệp — OTA (Đại lý Du lịch Trực tuyến) với dashboard đa vai trò cho nhân viên và khách hàng.

[![Build](https://img.shields.io/badge/Build-PASSING-green?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#)

### Công nghệ sử dụng

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19 + Vite 8 + TypeScript |
| **State** | Zustand 5 |
| **Styling** | Tailwind CSS v4 + Ant Design 6.3 |
| **Animations** | Framer Motion 12 |
| **Charts** | Recharts 3 |
| **Backend** | Sắp có — giai đoạn mock data |

### Tại sao có hệ thống này?

Travela giải quyết bài toán quản lý tour du lịch cao cấp với nhiều vai trò người dùng: Admin, Manager, Coordinator, Sales và Customer — mỗi vai trò có dashboard và workflow riêng biệt, thiết kế theo nghiệp vụ OTA thực tế tại Việt Nam.

### Điểm nổi bật

- **Dashboard đa vai trò** — 5 layout riêng biệt cho Admin, Manager, Coordinator, Sales, Customer
- **Thiết kế Indochine Heritage Luxe** — lấy cảm hứng văn hóa Việt Nam, bảng màu Sơn Mài, font Noto Serif
- **RBAC Authentication** — mock auth với Zustand, role-based routing, navigation guards
- **Luồng đặt tour** — trang chủ → danh sách tour → chi tiết → thanh toán → xác nhận
- **Vận hành Admin** — quản lý booking, chương trình tour, nhà cung cấp, voucher, dịch vụ, đối soát

### Bắt đầu nhanh

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173 — dùng menu trên trang chủ để chuyển vai trò (Admin / Manager / Coordinator / Sales / Customer).

### Tài liệu

| Tài liệu | Mô tả |
|-----------|--------|
| [Technical Spec](docs/technical-spec.md) | Kiến trúc, thiết kế API, quyết định công nghệ |
| [User Guide](docs/user-guide.md) | Hướng dẫn sử dụng (Tiếng Anh) |
| [Tài liệu Kỹ thuật](docs/vi-technical-spec.md) | Kiến trúc, thiết kế API (Tiếng Việt) |
| [Hướng dẫn Sử dụng](docs/vi-user-guide.md) | Hướng dẫn sử dụng (Tiếng Việt) |
