# Sales/Manager Feedback 2026-04-29

## Quy tắc làm việc

- Chỉ xử lý phần NV kinh doanh, quản lý và các nơi liên quan trực tiếp đến luồng được giao.
- Không đụng, không refactor các khu vực không liên quan.
- Tiếng Việt phải đúng dấu, tránh mojibake/UTF-8 lỗi.
- Upload và lưu dữ liệu phải rõ ràng, không lưu bậy hoặc mất thông tin.
- Nếu thiếu rule/dữ liệu/credential để hoàn thành tính năng thì phải hỏi hoặc báo rõ.
- Làm tuần tự, test theo luồng liên quan.

## NV kinh doanh

1. Dropdown chọn Chương trình tour chỉ hiển thị chương trình tour trạng thái Active.

2. Trang Quản lý booking / Đơn Đã hủy / Chi tiết đơn Đã hủy:
- Upload bill hoàn tiền phải xử lý được ảnh lớn và các kiểu ảnh thông dụng.
- Khi lưu bill hoàn tiền lần đầu thành công, khách hàng phải nhận email thông báo hoàn tiền thành công, có thông tin đơn hủy, số tiền hoàn và ảnh bill.
- Khi sửa bill hoàn tiền, hệ thống lưu bill mới và gửi email thông báo cập nhật bill chuyển khoản hoàn tiền kèm ảnh mới.
- Người hoàn tiền và thời điểm hoàn phải là lần sửa gần nhất, dùng `refundBillAt` và `refundBillBy`.
- Bỏ/không dùng `refundBillEditedAt` và `refundBillEditedBy`.

3. Tab Cần xác nhận đặt:
- Rule cũ: chưa thanh toán chuyển vào Cần xác nhận đặt với trạng thái Chưa thanh toán, quá 15 phút không thanh toán thì Đã hủy, lý do Không thanh toán đúng hạn, trạng thái hoàn tiền Hoàn thành.
- Rule mới về thanh toán:
  - Nếu đặt tour trong vòng 7 ngày trước ngày khởi hành, chỉ cho thanh toán 100%.
  - Nếu đặt trước ngày khởi hành trên 7 ngày, cho thanh toán 50% hoặc 100%.
  - Nếu chọn 50%, phần còn lại phải hoàn tất chậm nhất 7 ngày trước ngày khởi hành.
  - Nếu không thanh toán đầy đủ đúng hạn, hệ thống tự động chuyển trạng thái Chờ xác nhận/Đã xác nhận sang Đã hủy.
  - Lý do hủy: Không thanh toán đầy đủ trước 7 ngày khởi hành.

4. Tab Cần xác nhận hủy:
- Nếu NV không xác nhận yêu cầu hủy trong vòng 24h từ lúc yêu cầu hủy được tạo, đơn tự động chuyển từ Cần xác nhận hủy sang Đã xác nhận.
- Trong tab Cần xác nhận hủy, đơn tạo yêu cầu hủy sớm nhất phải lên đầu.

5. Xác nhận booking và thời gian:
- Giao diện đang lệch DB 7h; cần thống nhất cách hiển thị/ghi log, không tự cộng lệch sai.
- Khi xác nhận booking thành công phải gửi mail cho khách thông báo đơn đặt tour đã được xác nhận.
- Mail xác nhận phải có nội dung đơn đặt tour và danh sách hành khách.
- Danh sách hành khách ở Điều hành / Chờ dự toán chỉ hiện khi tour đủ điều kiện khởi hành, hết hạn đặt tour và NV kinh doanh đã xác nhận hết booking của tour.

6. Tab Hoàn thành:
- Khi ngày khởi hành + thời gian tour đã qua, các booking của tour có trạng thái Đã xác nhận phải chuyển sang Hoàn thành.

7. Manager hủy tour và xác nhận hủy:
- Khi NV kinh doanh xác nhận hủy thành công, gửi mail cho khách thông báo yêu cầu hủy đã được xác nhận.
- Khi quản lý hủy tour vì Không đủ điều kiện khởi hành, booking liên quan chuyển từ Đã xác nhận sang Đã hủy, lý do Không đủ điều kiện khởi hành, số tiền hoàn 100%.
- Khi quản lý hủy tour vì Bất khả kháng, booking liên quan chuyển từ Đã xác nhận sang Đã hủy, lý do Bất khả kháng, số tiền hoàn 100%.
- Với đơn hủy từ phía quản lý, chi tiết đơn hủy không hiển thị phần Thông tin hoàn tiền; quy tắc tải ảnh hoàn giữ như hiện tại.

## Quản lý

1. Trang Danh sách chương trình tour:
- Sau khi duyệt chương trình tour, redirect về danh sách chương trình tour tab Đang hoạt động.

2. Voucher:
- Khi NV nhấn Gửi phê duyệt, popup phải biến mất và có thông báo Gửi phê duyệt thành công.
- Voucher cần có BE cho thêm, sửa, xóa, gửi phê duyệt, phê duyệt.
- Xóa voucher phải có popup xác nhận.
- Voucher có 6 trạng thái: Nháp, Chờ phê duyệt, Không được phê duyệt, Sắp diễn ra, Đang diễn ra, Vô hiệu.
- Nếu voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày mà quá hạn, chuyển từ Nháp sang Không được phê duyệt với lý do Quá hạn gửi phê duyệt.
