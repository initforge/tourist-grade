# 03. Domain Model

## Tổng quan domain

Travela xoay quanh chuỗi nghiệp vụ:

`Tour Program -> Tour Instance -> Booking -> Payment -> Operation -> Settlement`

Voucher, cancellation, refund, service, supplier và approval là các nhánh nghiệp vụ phụ nhưng ảnh hưởng trực tiếp đến trạng thái chính.

## Khái niệm chính

### Tour Program

Chương trình tour gốc: tên tour, loại tour, lịch trình, giá nền, chính sách, điểm đến, mô tả marketing.

Trạng thái thường gặp:

- Draft/chờ duyệt.
- Approved/được phép bán.
- Rejected/cần chỉnh sửa.

### Tour Instance

Một lần khởi hành cụ thể của tour program.

Ví dụ: tour Hạ Long khởi hành ngày `2026-05-08` là một instance.

Tour instance có thể đi qua các bước:

1. Chờ mở bán.
2. Đang bán.
3. Đủ điều kiện điều hành.
4. Chờ nhận điều hành.
5. Chờ dự toán.
6. Chờ duyệt dự toán.
7. Phân công HDV.
8. Đang khởi hành.
9. Chờ quyết toán.
10. Hoàn thành.

### Booking

Đơn đặt tour của khách.

Booking chứa:

- Mã booking.
- Tour instance.
- Customer/account nếu có.
- Contact info.
- Passengers.
- Room counts.
- Tổng tiền, đã thanh toán, còn lại.
- Payment transactions.
- Cancellation/refund info.

Trạng thái booking chính:

- `pending`: chờ sales kiểm tra/xác nhận.
- `confirmed`: đã xác nhận.
- `pending_cancel`: khách yêu cầu hủy, chờ xử lý.
- `cancelled`: đã hủy.
- `completed`: tour hoàn thành.

### Payment

Payment transaction ghi nhận từng yêu cầu/giao dịch thanh toán.

Trạng thái transaction:

- `UNPAID`: đã tạo yêu cầu thanh toán nhưng chưa nhận tiền.
- `PAID`: đã nhận thanh toán.
- `PARTIAL`: booking đã thanh toán một phần.
- `REFUNDED`: đã hoàn tiền.
- `CANCELLED`: yêu cầu thanh toán cũ đã bị hủy/superseded.

Quy tắc PayOS hiện tại:

- Khi tạo payment request mới cho cùng booking, các PayOS request cũ còn `UNPAID` phải bị hủy trước.
- Local DB đánh dấu request cũ là `CANCELLED`.
- Webhook paid của request đã `CANCELLED` không được làm thay đổi booking.
- Webhook paid hợp lệ (`code = "00"` hoặc status paid) cập nhật `paidAmount`, `remainingAmount`, `paymentStatus`.

### Voucher

Voucher có thể là fixed amount hoặc percent.

Vòng đời:

1. Sales tạo draft.
2. Sales gửi phê duyệt.
3. Manager approve/reject.
4. Voucher approved mới được áp dụng theo điều kiện.

### Cancellation and refund

Khách có thể yêu cầu hủy nếu booking còn trong điều kiện cho phép.

Luồng:

1. Customer gửi yêu cầu hủy + lý do + thông tin ngân hàng nếu cần hoàn tiền.
2. Sales xác nhận hủy.
3. Nếu có tiền cần hoàn, sales upload bill hoàn tiền.
4. Sales xác nhận hoàn tiền.

### Service and supplier

Coordinator quản lý dịch vụ vận hành tour như khách sạn, vận chuyển, ăn uống, HDV, vé tham quan.

Supplier là nhà cung cấp dịch vụ. Service có thể gắn giá theo supplier, đơn vị tính và công thức tính.

## Business rule quan trọng

- Backend là source of truth cuối cùng cho trạng thái và tiền.
- Frontend chỉ preview và điều hướng, không tự quyết định kết quả tiền cuối.
- Mọi action đổi trạng thái phải đi qua API.
- Test destructive phải reset DB fixtures sau khi chạy.
- Payment request cũ không được gây nhầm lẫn hoặc cập nhật ngược booking sau khi đã bị hủy.
