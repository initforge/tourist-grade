# 05. API Contract

Base URL local: `http://localhost:4000/api/v1`

## Auth

### `POST /auth/login`

Request:

```json
{ "email": "customer@travela.vn", "password": "123456aA@" }
```

Response:

```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "role": "customer" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### `POST /auth/refresh`

Đổi refresh token lấy access token mới.

### `POST /auth/logout`

Logout session hiện tại.

### `GET /auth/me`

Trả user hiện tại từ token.

## Bootstrap

### `GET /bootstrap`

Dùng cho frontend load dữ liệu sau login hoặc khi app khởi động.

Trả về:

- current user nếu có token.
- public tours/blogs.
- protected data theo role nếu authenticated.
- booking/voucher/tour workflow fixtures cho dashboard.

## Public data

### `GET /public/tours`

Danh sách tour public.

### `GET /public/tours/:slug`

Chi tiết tour public.

### `GET /public/blogs`

Danh sách blog.

### `GET /public/blogs/:slug`

Chi tiết blog.

## Booking

### `POST /bookings/public`

Tạo booking từ checkout.

Business rules:

- Validate tour/schedule.
- Validate contact và passengers.
- Tính tổng tiền, giảm giá, tỷ lệ thanh toán.
- Gắn user nếu có token hợp lệ.
- Tạo booking ở trạng thái phù hợp để sales xử lý.

### `GET /bookings/lookup?bookingCode=&contact=`

Tra cứu booking public bằng mã booking và contact.

### `PATCH /bookings/:id`

Cập nhật booking bởi role phù hợp.

Dùng cho:

- Sales lưu phòng/passenger docs.
- Sales xác nhận booking.
- Sales xác nhận hủy/refund.

### `POST /bookings/:id/cancel-request`

Customer/public gửi yêu cầu hủy.

## Payment

### `POST /payments/bookings/:id/payos-link`

Tạo yêu cầu thanh toán PayOS cho booking.

Business rules:

- Booking phải còn `remainingAmount > 0`.
- Nếu payment ratio là deposit và chưa trả gì, payable amount là 50% hoặc phần còn lại nhỏ hơn.
- Trước khi tạo link mới, backend hủy mọi PayOS transaction cũ cùng booking còn `UNPAID`.
- Link mới được lưu là `UNPAID`.

Response:

```json
{
  "success": true,
  "paymentLink": {
    "checkoutUrl": "https://pay.payos.vn/...",
    "paymentLinkId": "...",
    "orderCode": 123456789,
    "status": "PENDING"
  }
}
```

### `POST /payments/payos/webhook`

Webhook PayOS gọi về.

Rules:

- Verify signature qua PayOS SDK.
- `code = "00"` hoặc paid status được xem là thành công.
- Transaction `CANCELLED` bị ignore.
- Transaction `UNPAID` nhận paid webhook sẽ thành `PAID`.
- Booking cập nhật `paidAmount`, `remainingAmount`, `paymentStatus`.

### `POST /payments/payos/confirm-webhook`

Xác nhận webhook URL với PayOS. Cần auth.

## Users

### `GET /users`

Admin lấy danh sách user.

### `POST /users`

Admin tạo nhân sự nội bộ.

### `PATCH /users/:id`

Admin cập nhật user hoặc khóa/mở khóa.

## Vouchers

### `GET /vouchers`

Lấy danh sách voucher theo role/context.

### `POST /vouchers`

Sales tạo voucher.

### `PATCH /vouchers/:id`

Sales cập nhật draft hoặc gửi duyệt; manager approve/reject.

## Tour workflow

### `GET /tour-programs`

Danh sách chương trình tour.

### `PATCH /tour-programs/:id`

Cập nhật hoặc approve/reject chương trình tour.

### `GET /tour-instances`

Danh sách tour instance theo role/tab.

### `PATCH /tour-instances/:id`

Cập nhật trạng thái vận hành, nhận điều hành, phân công HDV, dự toán, quyết toán.

## Dev/test

### `POST /dev/reset-booking-fixtures`

Reset fixtures cho E2E/local QA. Không dùng production.
