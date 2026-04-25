# 02. Frontend Modules

## Mục tiêu frontend

Frontend là lớp trải nghiệm người dùng cho cả khách hàng và nhân sự nội bộ. UI cần chạy mượt, không lỗi font, không lỗi điều hướng, và mọi nút/filter/form quan trọng phải được kiểm thử bằng Playwright.

## Kiến trúc frontend

- `frontend/src/app`: router và app shell.
- `frontend/src/features`: page theo từng domain/role.
- `frontend/src/entities`: type và seed UI model.
- `frontend/src/shared/layouts`: layout theo role.
- `frontend/src/shared/store`: auth store và app data store.
- `frontend/src/shared/lib/api`: API client theo domain.
- `frontend/src/shared/ui`: component dùng chung.
- `frontend/tests`: Playwright E2E.

## Public/customer modules

### Tour browsing

- Tour list cho phép xem danh sách, lọc/tìm kiếm, mở chi tiết.
- Tour detail hiển thị lịch khởi hành, giá, ghi chú, chính sách, CTA đặt tour.

### Checkout

- Chọn lịch khởi hành.
- Nhập thông tin liên hệ.
- Nhập danh sách hành khách.
- Chọn phòng/giường nếu có.
- Áp dụng voucher.
- Chọn tỷ lệ thanh toán.
- Tạo booking và payment link.

### Booking lookup

- Tra cứu bằng booking code và contact.
- Hiển thị trạng thái booking, thanh toán, hành khách, hành động còn được phép.

### Customer account

- Lịch sử booking.
- Chi tiết booking.
- Wishlist.
- Profile.
- Yêu cầu hủy tour.

## Internal modules

### Admin users

- Tab nhân viên và khách hàng.
- Tạo/sửa nhân viên.
- Khóa/mở khóa tài khoản.
- Xem lịch sử khách hàng.

### Sales booking

- Danh sách booking theo tab trạng thái.
- Chi tiết booking.
- Kiểm tra hành khách.
- Lưu số phòng.
- Xác nhận booking.
- Xác nhận hủy.
- Upload/thay bill hoàn tiền.
- Xác nhận hoàn tiền.

### Sales voucher

- Tạo voucher.
- Lưu nháp.
- Gửi phê duyệt.
- Xem voucher active/pending/upcoming ở chế độ phù hợp.

### Manager approvals

- Duyệt/từ chối voucher.
- Duyệt/từ chối chương trình tour.
- Duyệt/từ chối/yêu cầu chỉnh sửa dự toán.

### Coordinator operations

- Nhận điều hành.
- Phân công HDV.
- Dự toán tour.
- Quyết toán tour.
- Quản lý dịch vụ và nhà cung cấp.

## Quy ước UX/UI

- Không dùng text demo như dữ liệu thật nếu không có ý nghĩa business.
- Không để mojibake/font lỗi trong UI visible text.
- Các hành động destructive phải có xác nhận hoặc luồng có thể reset fixtures.
- Các filter/search/tab phải test như người dùng thật, không chỉ render page.

## Test frontend

Các nhóm test chính:

- `customer-flow.spec.ts`: public/customer booking flow.
- `real-user-journeys.spec.ts`: journey liên role.
- `ui-surface-audit.spec.ts`: audit route, control, console error, mojibake.
- `admin-users.spec.ts`: admin user management.
- `sales-*.spec.ts`: booking/voucher/sales manager flow.
- `manager-remaining.spec.ts`: approval flow.
- `coordinator*.spec.ts`: điều phối và service/supplier.
