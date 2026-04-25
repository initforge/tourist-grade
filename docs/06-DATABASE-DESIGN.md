# 06. Database Design

## Database

- Engine: PostgreSQL.
- ORM: Prisma.
- Schema: `backend/prisma/schema.prisma`.
- Seed: `backend/prisma/seed.ts`.

## Nhóm bảng chính

### User

Lưu tài khoản khách hàng và nhân sự nội bộ.

Trường quan trọng:

- `role`: `ADMIN`, `MANAGER`, `COORDINATOR`, `SALES`, `CUSTOMER`.
- `status`: active/locked.
- password hash.

### Auth/session

Refresh token/session phục vụ login và refresh token.

### TourProgram

Chương trình tour gốc.

Quan hệ:

- Có nhiều `TourInstance`.
- Có thể được voucher target.
- Có dữ liệu itinerary/pricing/policy trong JSON hoặc bảng liên quan tùy schema.

### TourInstance

Một lịch khởi hành cụ thể.

Quan hệ:

- Thuộc một `TourProgram`.
- Có nhiều `Booking`.
- Có workflow vận hành.
- Có coordinator/guide assignment nếu đã điều phối.

### Booking

Đơn đặt tour.

Quan hệ:

- Thuộc một `TourInstance`.
- Có thể thuộc một customer user.
- Có nhiều `BookingPassenger`.
- Có nhiều `PaymentTransaction`.

Các field tiền:

- `totalAmount`
- `paidAmount`
- `remainingAmount`
- `discountAmount`
- `refundAmount`

### BookingPassenger

Danh sách hành khách của booking.

Dùng cho sales kiểm tra giấy tờ, CCCD/GKS/passport, nationality, single room supplement.

### PaymentTransaction

Ghi từng giao dịch/yêu cầu thanh toán.

Status:

- `UNPAID`: yêu cầu thanh toán còn mở.
- `PAID`: đã nhận tiền.
- `PARTIAL`: trạng thái thanh toán một phần.
- `REFUNDED`: đã hoàn tiền.
- `CANCELLED`: yêu cầu thanh toán đã hủy/superseded.

Quy tắc consistency:

- Một booking có thể có nhiều transaction theo thời gian.
- Chỉ transaction mới nhất còn `UNPAID` nên được khách sử dụng để thanh toán.
- Khi tạo PayOS link mới, các PayOS transaction cũ còn `UNPAID` phải chuyển `CANCELLED`.
- Webhook stale từ transaction `CANCELLED` không được cập nhật booking.

### Voucher

Lưu mã khuyến mãi.

Status:

- draft.
- pending approval.
- approved/active.
- rejected.

Quan hệ:

- Có createdBy/approvedBy/rejectedBy.
- Có target tour program nếu voucher giới hạn tour.

### Service / Supplier

Phục vụ điều phối và dự toán.

- Supplier: nhà cung cấp.
- Service: dịch vụ như khách sạn, vận chuyển, ăn uống, vé, HDV.
- Price/variant: giá theo đơn vị, công thức hoặc supplier.

## Seed data

Seed tạo dữ liệu đủ cho:

- 5 account theo role.
- Tour public.
- Tour program và tour instance ở nhiều trạng thái.
- Booking ở nhiều trạng thái: pending, confirmed, pending cancel, cancelled, completed.
- Voucher ở draft/pending/approved/rejected.
- Service/supplier demo.

## Reset fixtures

`POST /api/v1/dev/reset-booking-fixtures` reset các nhóm dữ liệu phục vụ test:

- Booking và payment fixtures.
- Tour workflow fixtures.
- Voucher fixtures.

Dùng sau destructive E2E để DB trở lại trạng thái ban đầu.
