# 01. Tổng Quan

Travela là hệ thống đặt tour và vận hành tour. Dự án có hai phần lớn:

- Trang public cho khách xem tour, đặt tour và tra cứu booking.
- Dashboard nội bộ cho công ty du lịch xử lý booking, tour, dịch vụ, nhà cung cấp và duyệt nghiệp vụ.

## Các vai trò

- `Customer`: khách hàng đặt tour, xem booking, yêu thích tour, yêu cầu hủy.
- `Sales`: nhân viên kinh doanh theo dõi booking và voucher.
- `Coordinator`: điều phối tour, dịch vụ, nhà cung cấp, dự toán, quyết toán.
- `Manager`: duyệt tour, duyệt dự toán, duyệt voucher và chính sách.
- `Admin`: quản lý tài khoản.

## Các thư mục chính

- `frontend/`: giao diện React.
- `backend/`: API Express và Prisma.
- `backend/prisma/`: database schema và seed data.
- `scripts/setup-local.ps1`: script chạy local một lệnh.
- `docker-compose.yml`: cấu hình Docker cho database, backend, frontend.

## Tư duy đơn giản

Frontend là nơi người dùng bấm và nhìn thấy dữ liệu. Backend là nơi quyết định dữ liệu thật và trạng thái nghiệp vụ. Database là nơi lưu dữ liệu. Docker giúp chạy toàn bộ hệ thống giống nhau trên nhiều máy.
