# Travela — Bảng Phân Quyền (RBAC)

> Tài liệu tham chiếu cố định. Mọi thay đổi quyền hạn cần cập nhật tại đây.

| Role | Prefix | Chức năng | Chi tiết quyền |
|------|--------|-----------|----------------|
| **Admin** | `/admin` | Quản lý người dùng | Thêm (phân quyền), sửa, vô hiệu hóa |
| **Quản lý** | `/manager` | CT Tour | Phê duyệt, ngừng kinh doanh |
| | | Tour | Phê duyệt dự toán, hủy, delay |
| | | Dashboard | Xem |
| **NV Điều phối** | `/coordinator` | CT Tour | Tạo, sửa, xóa (của mình), ngừng KD |
| | | Tour | Duyệt tour sinh ra, dự toán, phân công HDV, quyết toán |
| | | Dịch vụ | CRUD nhà cung cấp + dịch vụ |
| | | Dashboard | Xem |
| | | Voucher | Quản lý |
| **NV Kinh doanh** | `/sales` | Booking | Hoàn thiện info khách, thanh toán, hoàn tiền |
| | | Dashboard | Xem |
| **KH đăng nhập** | `/customer/*` | Public | Xem/đặt tour, thanh toán, sửa DSHK, lịch sử, hủy, đánh giá, wishlist |
| **KH vãng lai** | `/` | Public | Xem/đặt tour, thanh toán, sửa info, hủy |
