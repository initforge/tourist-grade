# 03. Domain Model

## 3.1 Vai trò người dùng

- `admin`: quản trị tài khoản người dùng.
- `manager`: duyệt CT tour, duyệt dự toán, duyệt voucher, quản lý tour active.
- `coordinator`: tạo CT tour, sinh tour, nhận điều hành, dự toán, quyết toán, NCC, dịch vụ.
- `sales`: vận hành booking và voucher phía kinh doanh.
- `customer`: đặt tour, theo dõi booking, wishlist, profile.

## 3.2 Thực thể chính

### User

- Account đăng nhập nội bộ hoặc khách hàng.
- Gắn role.
- Có trạng thái hoạt động.

### TourProgram

- Là template nghiệp vụ của một sản phẩm tour.
- Chứa tuyến điểm, thời lượng, itinerary, pricing config, booking deadline.
- Không phải lần khởi hành cụ thể.
- Với loại `mua_le`, lịch dự kiến lấy từ các ngày khởi hành được chọn trong dịp lễ.
- Với loại `quanh_nam`, lịch dự kiến lấy từ khoảng `yearRoundStartDate` - `yearRoundEndDate` và bộ lọc thứ trong tuần nếu có.
- Itinerary có thể chứa `accommodationPoint` theo ngày để backend/DB suy ra nhóm lưu trú khách sạn theo các ngày liên tiếp cùng địa điểm.

### TourInstance

- Là lần khởi hành cụ thể sinh ra từ `TourProgram`.
- Có ngày khởi hành, giá bán snapshot, trạng thái vận hành, số khách kỳ vọng.
- Đây là record phải dùng cho booking thật.
- Màn tạo mới chương trình có bước `Tour dự kiến` để preview các `TourInstance` sẽ sinh trước khi gửi duyệt.

### Booking

- Đơn đặt chỗ của khách cho một `TourInstance`.
- Chứa contact info, passengers, payment, refund/cancel info.

### Passenger

- Danh sách hành khách thuộc một booking.
- Có loại khách, giới tính, ngày sinh, giấy tờ, phụ thu phòng đơn.

### Voucher

- Mã giảm giá theo phần trăm hoặc tiền cố định.
- Có vòng đời soạn thảo, chờ duyệt, active, inactive, rejected.

### Supplier

- Nhà cung cấp dịch vụ.
- Có nhiều biến thể dịch vụ/báo giá.

### BlogPost

- Nội dung public/cẩm nang.

## 3.3 Ranh giới TourProgram và TourInstance

- `TourProgram` là định nghĩa sản phẩm.
- `TourInstance` là lịch khởi hành và vận hành thực tế.
- Booking phải gắn với `TourInstance`, không gắn trực tiếp với `TourProgram`.

## 3.4 Booking lifecycle

- `pending`: khách tạo đơn, chờ xác nhận.
- `booked`: đã ghi nhận đơn.
- `confirmed`: đơn đã xác nhận hoàn chỉnh.
- `completed`: tour hoàn thành.
- `pending_cancel`: khách yêu cầu hủy.
- `cancelled`: đơn đã hủy.

## 3.5 Payment lifecycle

- `unpaid`
- `partial`
- `paid`
- `refunded`

## 3.6 Refund lifecycle

- `none`
- `pending`
- `refunded`
- `not_required`

## 3.7 TourInstance lifecycle

- `cho_duyet_ban`
- `yeu_cau_chinh_sua`
- `dang_mo_ban`
- `chua_du_kien`
- `da_huy`
- `cho_nhan_dieu_hanh`
- `cho_du_toan`
- `cho_duyet_du_toan`
- `san_sang_trien_khai`
- `dang_trien_khai`
- `cho_quyet_toan`
- `hoan_thanh`

## 3.8 Voucher lifecycle

- `draft`
- `pending_approval`
- `rejected`
- `active`
- `inactive`

## 3.9 Dữ liệu nào phải snapshot vào record con

### Snapshot bắt buộc

- `Booking` phải snapshot tên tour, contact info, payment state tại thời điểm đặt.
- `TourInstance` phải snapshot `programName`, giá bán, tuyến điểm, booking deadline.
- `TourInstance` sinh từ preview phải snapshot `departureDate`, `endDate`, `expectedGuests`, `costPerAdult`, `sellPrice`, `profitPercent`, `bookingDeadline` và trạng thái chọn tạo tại thời điểm submit.
- Dự toán chương trình phải snapshot NCC/dịch vụ mặc định đang chọn, đơn giá áp dụng và các giá bán đã sửa tay nếu người dùng bật manual override.

### Không nên snapshot nếu chưa cần

- Thông tin role hiện tại của user.
- Danh sách voucher toàn hệ thống.

## 3.10 Quy tắc nền cho backend

- `TourProgram` update không được làm sai lịch sử booking đã tạo.
- `TourInstance` là nguồn thật cho booking/report.
- Payment transaction phải tách bảng riêng.
- Passenger phải tách bảng riêng, không nhét JSON nếu còn cần filter/report.
