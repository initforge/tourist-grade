# 01. Current System

## 1.1 Mục tiêu repo

Travela là hệ thống OTA nội bộ + public booking, gồm:

- Public site cho khách xem tour, xem blog, đặt tour, tra cứu đơn.
- Dashboard nội bộ cho `admin`, `manager`, `coordinator`, `sales`.
- Khu vực khách hàng cho lịch sử booking, chi tiết booking, wishlist, profile.

## 1.2 Trạng thái code hiện tại

- Repo hiện chỉ có frontend hoàn chỉnh về mặt màn hình và flow.
- Backend thật chưa implement nhưng đã có scaffold.
- Dữ liệu business mock trong `frontend/src/data/*` đã bị rút về rỗng để chặn lệ thuộc vào dữ liệu demo.
- Một số trang marketing/public vẫn còn text và hình tĩnh phục vụ layout, nhưng không còn business records giả cho booking/tour/user/voucher.

## 1.3 Cấu trúc repo

- `frontend/`: React 19, Vite, Zustand, Tailwind v4, Ant Design.
- `backend/`: Express scaffold, Prisma schema, env + docker.
- `docs/`: bộ docs đánh số.
- `docker-compose.yml`: local stack.

## 1.4 Route map frontend

### Public

- `/`: landing
- `/tours`: danh sách tour
- `/tours/:slug`: chi tiết tour
- `/tours/:slug/book`: checkout
- `/booking/success`: trang thành công
- `/booking/lookup`: tra cứu booking
- `/blog`: danh sách blog
- `/blog/:slug`: chi tiết blog
- `/about`: giới thiệu

### Auth

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Customer

- `/customer/bookings`
- `/customer/bookings/:id`
- `/customer/bookings/:id/cancel`
- `/customer/wishlist`
- `/customer/profile`

### Admin

- `/admin/users`

### Manager

- `/manager/dashboard`
- `/manager/tour-programs`
- `/manager/tour-programs/:id`
- `/manager/tour-programs/:id/approval`
- `/manager/tours`
- `/manager/tours/:id/estimate`
- `/manager/tours/:id/estimate-approval`
- `/manager/voucher-approval`
- `/manager/cancel-policies`
- `/manager/vouchers`
- `/manager/special-days`

### Coordinator

- `/coordinator/dashboard`
- `/coordinator/tour-programs`
- `/coordinator/tour-programs/create`
- `/coordinator/tour-programs/:id`
- `/coordinator/tour-programs/:id/receive`
- `/coordinator/tour-rules`
- `/coordinator/tours`
- `/coordinator/tours/:id/estimate`
- `/coordinator/tours/:id/settle`
- `/coordinator/services`
- `/coordinator/suppliers`
- `/coordinator/vouchers`

### Sales

- `/sales/dashboard`
- `/sales/bookings`
- `/sales/bookings/:id`
- `/sales/vouchers`

## 1.5 Auth hiện tại

- Auth frontend đang là session giả lập bằng localStorage.
- Không còn `mockUsers` records; login tạo `session user` theo role để giữ flow điều hướng.
- Khi backend auth land, `useAuthStore` là điểm thay thế đầu tiên.

## 1.6 Hành vi sau khi bỏ mock data

- Các trang list sử dụng domain data thật sẽ hiển thị rỗng nếu API chưa có dữ liệu.
- Các trang detail phụ thuộc record cụ thể sẽ hiển thị not found / chưa có dữ liệu.
- Đây là chủ đích để tránh việc UI tiếp tục phụ thuộc vào data demo.

## 1.7 Những phần hiện còn tĩnh

- Landing
- Tour list public
- Blog detail public
- Một số biểu đồ/tile dashboard mang tính trình bày

Các phần này không phải nguồn dữ liệu nghiệp vụ và có thể nối API sau khi backend xong.
