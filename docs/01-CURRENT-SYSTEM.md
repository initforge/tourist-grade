# 01. System Overview

## Mục tiêu sản phẩm

Travela là hệ thống OTA/tour operation phục vụ hai nhóm người dùng:

- Khách hàng: xem tour, đặt tour, thanh toán, tra cứu booking, quản lý lịch sử đặt tour, yêu thích tour, cập nhật hồ sơ.
- Nhân sự nội bộ: quản trị người dùng, bán hàng, duyệt chương trình/voucher/dự toán, điều phối tour, quản lý nhà cung cấp và dịch vụ.

Mục tiêu local demo là chạy được full stack bằng Docker để người mới clone repo có thể xem và test toàn bộ luồng nghiệp vụ chính.

## Phân hệ chính

### Public site

- Landing page giới thiệu thương hiệu.
- Danh sách tour và chi tiết tour.
- Checkout đặt tour theo lịch khởi hành.
- Tra cứu booking bằng mã booking + số điện thoại/email.
- Blog và trang giới thiệu.

### Customer area

- Lịch sử booking.
- Chi tiết booking.
- Yêu cầu hủy tour.
- Wishlist.
- Profile.

### Admin

- Quản lý nhân sự nội bộ.
- Xem danh sách khách hàng.
- Khóa/mở khóa tài khoản.
- Xem lịch sử giao dịch/booking của khách.

### Sales

- Dashboard kinh doanh.
- Quản lý booking theo trạng thái.
- Kiểm tra thông tin hành khách.
- Xác nhận booking.
- Xử lý yêu cầu hủy và hoàn tiền.
- Tạo voucher và gửi duyệt.

### Manager

- Duyệt/từ chối voucher.
- Duyệt/từ chối chương trình tour.
- Duyệt/từ chối/yêu cầu chỉnh sửa dự toán.
- Theo dõi tour đang hoạt động.
- Quản lý ngày đặc biệt và chính sách hủy.

### Coordinator

- Quản lý chương trình tour.
- Nhận điều hành tour.
- Lập dự toán.
- Phân công hướng dẫn viên.
- Theo dõi tour đang vận hành và quyết toán.
- Quản lý dịch vụ và nhà cung cấp.

## Route map chính

### Public

- `/`
- `/tours`
- `/tours/:slug`
- `/tours/:slug/book`
- `/booking/success`
- `/booking/lookup`
- `/blog`
- `/blog/:slug`
- `/about`

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

### Internal roles

- Admin: `/admin/users`
- Sales: `/sales/dashboard`, `/sales/bookings`, `/sales/bookings/:id`, `/sales/vouchers`
- Manager: `/manager/dashboard`, `/manager/tour-programs`, `/manager/tours`, `/manager/voucher-approval`, `/manager/special-days`
- Coordinator: `/coordinator/dashboard`, `/coordinator/tour-programs`, `/coordinator/tours`, `/coordinator/services`, `/coordinator/suppliers`

## Trạng thái hiện tại

- Frontend chạy bằng React + Vite, dùng API backend qua app data store.
- Backend chạy Express + Prisma + PostgreSQL.
- Docker Compose chạy đủ `frontend + backend + db`.
- Seed tạo dữ liệu demo đủ cho các role và luồng QA.
- Test E2E bao phủ public/customer/admin/sales/manager/coordinator.

## Tài khoản seed

Tất cả dùng mật khẩu `123456aA@`:

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`
