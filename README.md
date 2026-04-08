# Travela — Premium Tour Booking Platform

> Đồ án tốt nghiệp — Premium OTA (Online Travel Agency) với multi-role dashboard cho nhân viên và khách hàng.

[![Build](https://img.shields.io/badge/Build-PASSING-green?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#)

### Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) |
| **State** | ![Zustand](https://img.shields.io/badge/Zustand-443F38?style=flat-square) |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white) ![Ant Design](https://img.shields.io/badge/Ant_Design-6.x-0170FE?style=flat-square&logo=antdesign&logoColor=white) |
| **Animations** | ![Framer Motion](https://img.shields.io/badge/Framer_Motion-v12-FF0054?style=flat-square&logo=framer&logoColor=white) |
| **Backend** | Coming soon — mock data phase |

### Tại sao có hệ thống này?

Travela giải quyết bài toán quản lý tour du lịch cao cấp với nhiều vai trò người dùng: Admin, Manager, Coordinator, Sales và Customer — mỗi vai trò có dashboard riêng biệt với workflow được thiết kế cho nghiệp vụ OTA thực tế.

### Highlights

- **Multi-Role Dashboard** — 5 role-based layouts, mỗi role có dashboard và workflow riêng
- **Ind ochine Heritage Luxe Design** — thiết kế lấy cảm hứng từ văn hóa Việt Nam, màu sắc Sơn Mài, typography Noto Serif
- **RBAC Authentication** — mock auth với Zustand, role-based routing và navigation guards
- **Public Booking Flow** — trang chủ → danh sách tour → chi tiết → checkout → xác nhận
- **Admin Operations** — quản lý booking, chương trình tour, nhà cung cấp, voucher, dịch vụ, đối soát

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173 — dùng menu trên trang chủ để chuyển role (Admin / Manager / Coordinator / Sales / Customer).

### Documentation

| Tài liệu | Mô tả |
|-----------|--------|
| [Technical Spec](docs/technical-spec.md) | Kiến trúc, API design, tech decisions |
| [User Guide](docs/user-guide.md) | Hướng dẫn sử dụng |
| [Vietnamese Docs](docs/vi-technical-spec.md) | Tài liệu kỹ thuật tiếng Việt |
| [Hướng dẫn Tiếng Việt](docs/vi-user-guide.md) | Hướng dẫn sử dụng tiếng Việt |
