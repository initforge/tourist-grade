# 03. Luồng Nghiệp Vụ

File này giải thích các luồng chính ở mức dễ hiểu, không đi quá sâu vào code.

## Khách đặt tour

1. Khách vào trang public.
2. Khách xem danh sách tour hoặc lọc tour.
3. Khách mở chi tiết tour.
4. Khách bấm `Đặt ngay`.
5. Khách nhập thông tin liên hệ và hành khách.
6. Hệ thống tạo booking.
7. Khách chọn thanh toán.
8. Nếu thanh toán online, backend tạo link PayOS.
9. PayOS gọi webhook về backend khi có trạng thái thanh toán.

## Tra cứu booking

Khách có thể tra cứu booking bằng mã booking và số điện thoại. Backend kiểm tra dữ liệu, trả về trạng thái booking, payment và các hành động phù hợp.

## Wishlist

Khách đăng nhập có thể thêm tour vào danh sách yêu thích. Mục tiêu là giúp khách quay lại tour quan tâm nhanh hơn.

## Sales

Sales theo dõi booking, xem chi tiết đơn, hỗ trợ khách và quản lý voucher.

## Coordinator

Coordinator phụ trách phần vận hành:

- nhận điều hành tour;
- lập dự toán;
- phân công hướng dẫn viên;
- quản lý dịch vụ và nhà cung cấp;
- làm quyết toán.

## Manager

Manager phụ trách duyệt:

- chương trình tour;
- tour cần mở bán;
- dự toán;
- voucher;
- chính sách hủy.

## Admin

Admin quản lý tài khoản người dùng và trạng thái hoạt động của tài khoản.

## Nguyên tắc trạng thái

Các trạng thái quan trọng như booking, payment, tour workflow và approval phải được lưu ở backend/database. Frontend chỉ gửi hành động và hiển thị kết quả backend trả về.
