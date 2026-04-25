# 03. Luồng Nghiệp Vụ

Tài liệu này giải thích các luồng nghiệp vụ chính và dữ liệu nào bị ảnh hưởng trong hệ thống.

## 1. Nhóm vai trò

Hệ thống có hai nhóm người dùng:

```text
Khách hàng bên ngoài
  Customer

Nhân sự nội bộ
  Sales
  Coordinator
  Manager
  Admin
```

Customer tạo nhu cầu và booking. Nhân sự nội bộ xử lý booking, thanh toán, tour, dịch vụ, nhà cung cấp, duyệt và vận hành.

## 2. Tour public

Tour public là dữ liệu khách nhìn thấy ngoài website.

Nguồn dữ liệu chính:

```text
TourProgram.publicContentJson
TourInstance
```

Luồng hiển thị:

```text
Backend seed/tạo TourProgram
  ↓
TourProgram ACTIVE có publicContentJson
  ↓
API /public/tours trả danh sách tour
  ↓
Frontend hiển thị landing, list, detail
```

Các thông tin quan trọng của tour public:

- tên tour;
- slug;
- ảnh đại diện và gallery;
- mô tả;
- điểm khởi hành;
- điểm tham quan;
- lịch trình;
- giá người lớn/trẻ em/em bé;
- lịch khởi hành;
- chính sách trẻ em;
- chính sách hủy.

## 3. Khách đặt tour

Luồng đặt tour đi từ public UI đến booking trong database.

```text
Khách xem tour
  ↓
Bấm Đặt ngay
  ↓
Chọn lịch khởi hành
  ↓
Nhập thông tin liên hệ
  ↓
Nhập danh sách hành khách
  ↓
Áp voucher nếu có
  ↓
Chọn phương thức thanh toán
  ↓
Backend tạo Booking
  ↓
Backend tạo PaymentTransaction nếu thanh toán online
```

Booking cần giữ các thông tin:

- mã booking;
- customer hoặc thông tin liên hệ nếu khách chưa đăng nhập;
- tour instance;
- số lượng người lớn/trẻ em/em bé;
- danh sách hành khách;
- tổng tiền;
- số tiền đã thanh toán;
- trạng thái booking;
- trạng thái refund nếu có.

## 4. Trạng thái booking

Booking có các trạng thái chính:

- `PENDING`: booking mới, chờ xử lý hoặc chờ thanh toán.
- `BOOKED`: đã đặt thành công ở mức hệ thống ghi nhận.
- `CONFIRMED`: đã được xác nhận.
- `PENDING_CANCEL`: khách đã gửi yêu cầu hủy.
- `CANCELLED`: booking đã hủy.
- `COMPLETED`: tour đã hoàn tất.

Nguyên tắc: frontend không tự đổi trạng thái booking. Frontend gửi hành động, backend kiểm tra điều kiện rồi cập nhật database.

## 5. Thanh toán PayOS

PayOS gồm hai phần: tạo link thanh toán và nhận kết quả thanh toán.

### Tạo link thanh toán

```text
Frontend yêu cầu thanh toán
  ↓
Backend kiểm tra booking
  ↓
Backend hủy các PayOS transaction cũ còn UNPAID của booking đó
  ↓
Backend tạo PaymentTransaction mới
  ↓
Backend gọi PayOS tạo payment link
  ↓
Frontend mở link/QR cho khách thanh toán
```

Lý do phải hủy transaction cũ: tránh một booking có nhiều link thanh toán đang mở cùng lúc, gây nhầm lẫn trạng thái.

### Nhận webhook

```text
Khách thanh toán PayOS
  ↓
PayOS gọi webhook về backend
  ↓
Backend kiểm tra checksum/trạng thái
  ↓
Backend tìm PaymentTransaction
  ↓
Backend cập nhật transaction
  ↓
Backend cập nhật Booking paymentStatus/paidAmount nếu hợp lệ
```

Webhook cũ hoặc transaction đã hủy không được làm rối trạng thái booking hiện tại.

## 6. Tra cứu booking

Tra cứu booking giúp khách không cần đăng nhập vẫn xem được thông tin đơn.

```text
Khách nhập booking code + số điện thoại
  ↓
Backend tìm booking khớp thông tin liên hệ
  ↓
Backend trả trạng thái booking, payment, thông tin tour
  ↓
Frontend hiển thị hành động phù hợp
```

Ví dụ:

- booking còn hiệu lực thì hiển thị thông tin tour;
- booking có thanh toán chưa đủ thì có thể hiển thị thanh toán tiếp;
- booking có thể hủy thì hiển thị yêu cầu hủy;
- booking đã hủy thì chỉ hiển thị trạng thái.

## 7. Wishlist

Wishlist là luồng customer lưu tour quan tâm.

```text
Customer đăng nhập
  ↓
Bấm yêu thích tour
  ↓
Frontend lưu danh sách yêu thích
  ↓
Trang Wishlist hiển thị các tour đã lưu
```

Nếu muốn nâng cấp chặt hơn, wishlist nên được lưu ở backend để khách đổi máy vẫn giữ dữ liệu.

## 8. Sales

Sales xử lý phần thương mại và chăm sóc booking.

Các việc chính:

- xem danh sách booking;
- xem chi tiết booking;
- theo dõi trạng thái thanh toán;
- hỗ trợ khách;
- tạo hoặc quản lý voucher;
- xem voucher được duyệt hay bị từ chối.

Sales không nên tự duyệt những phần thuộc quyền Manager.

## 9. Coordinator

Coordinator xử lý vận hành tour sau khi tour/booking bước vào giai đoạn điều hành.

Các việc chính:

- nhận điều hành tour;
- lập dự toán;
- chọn dịch vụ và nhà cung cấp;
- phân công hướng dẫn viên;
- theo dõi tour đang triển khai;
- làm quyết toán.

Các dữ liệu liên quan:

- `TourInstance`;
- supplier;
- service;
- guide;
- cost estimate;
- settlement.

Luồng đơn giản:

```text
Tour đủ điều kiện vận hành
  ↓
Coordinator nhận điều hành
  ↓
Coordinator lập dự toán
  ↓
Manager duyệt dự toán
  ↓
Coordinator triển khai tour
  ↓
Coordinator làm quyết toán
```

## 10. Manager

Manager là người kiểm soát rủi ro và duyệt nghiệp vụ.

Manager thường xử lý:

- duyệt chương trình tour;
- yêu cầu chỉnh sửa chương trình tour;
- duyệt tour mở bán;
- duyệt dự toán;
- duyệt voucher;
- cấu hình hoặc xem chính sách hủy.

Nguyên tắc: các thao tác duyệt/từ chối phải để lại trạng thái rõ ràng, tránh UI hiển thị một kiểu nhưng backend lưu kiểu khác.

## 11. Admin

Admin quản lý tài khoản:

- tạo tài khoản;
- sửa thông tin;
- bật/tắt trạng thái hoạt động;
- phân role.

Tài khoản seed dùng chung mật khẩu `123456` để dễ test local.

## 12. Quan hệ giữa các luồng

Các luồng không đứng riêng lẻ. Một booking có thể ảnh hưởng nhiều phần:

```text
Public tour
  ↓
Booking
  ↓
Payment
  ↓
Sales theo dõi
  ↓
TourInstance đủ điều kiện vận hành
  ↓
Coordinator điều phối
  ↓
Manager duyệt chi phí/voucher/chính sách
```

Vì vậy khi test hệ thống, không chỉ bấm từng màn đơn lẻ. Cần test theo chuỗi: tạo booking, thanh toán, kiểm tra booking, kiểm tra dashboard role liên quan và trạng thái sau webhook.

## 13. Nguyên tắc dữ liệu

- Dữ liệu hiển thị public nên đến từ backend.
- Trạng thái quan trọng phải nằm trong database.
- Hành động destructive như hủy, duyệt, từ chối, refund cần cập nhật trạng thái rõ ràng.
- Payment phải nhất quán giữa `Booking` và `PaymentTransaction`.
- UI không nên có nút bấm giả; nếu có nút thì phải điều hướng hoặc gọi hành động thật.
