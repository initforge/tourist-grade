# 05. API Contract

Base URL:

- Local: `http://localhost:4000/api/v1`

## 5.1 Auth

### `POST /auth/login`

- Input: `email`, `password`
- Output: `accessToken`, `refreshToken`, `user`

### `POST /auth/refresh`

- Input: `refreshToken`
- Output: token pair mới

### `POST /auth/logout`

- Input: refresh token hiện tại
- Output: success boolean

## 5.2 Users

### `GET /users`

- Query: `role`, `status`, `page`, `pageSize`, `keyword`
- Output: paginated user list

### `POST /users`

- Input: user create payload
- Output: created user

### `PATCH /users/:id`

- Input: partial update payload
- Output: updated user

## 5.3 Tour Programs

### `GET /tour-programs`

- Query: `status`, `type`, `keyword`, `page`, `pageSize`

### `POST /tour-programs`

- Tạo CT tour mới.

### `GET /tour-programs/:id`

- Chi tiết một CT tour.

### `PATCH /tour-programs/:id`

- Cập nhật CT tour.

### `POST /tour-programs/:id/approve`

- Manager duyệt CT tour.

### `POST /tour-programs/:id/reject`

- Manager từ chối CT tour, bắt buộc có `reason`.

## 5.4 Tour Instances

### `GET /tour-instances`

- Query: `status`, `programId`, `dateFrom`, `dateTo`, `page`, `pageSize`

### `POST /tour-instances/generate`

- Input:
  - `programId`
  - `rows[]`
  - mỗi row gồm `departureDate`, `endDate`, `expectedGuests`, `sellPrice`, `bookingDeadline`

### `GET /tour-instances/:id`

- Chi tiết một lần khởi hành.

### `POST /tour-instances/:id/receive`

- Coordinator nhận điều hành.

### `POST /tour-instances/:id/estimate`

- Lưu dự toán.

### `POST /tour-instances/:id/estimate/approve`

- Manager duyệt dự toán.

### `POST /tour-instances/:id/settlement`

- Lưu quyết toán.

### `POST /tour-instances/:id/cancel`

- Hủy tour, bắt buộc có lý do.

## 5.5 Bookings

### `GET /bookings`

- Query:
  - `status`
  - `paymentStatus`
  - `tourInstanceId`
  - `customerId`
  - `bookingCode`
  - `page`, `pageSize`

### `POST /bookings`

- Public checkout tạo booking.
- Input:
  - `tourInstanceId`
  - `contactInfo`
  - `passengers`
  - `paymentRatio`
  - `paymentMethod`
  - `promoCode`

### `GET /bookings/:id`

- Chi tiết booking.

### `GET /bookings/lookup/:bookingCode`

- Public tra cứu booking.

### `POST /bookings/:id/confirm`

- Sales xác nhận booking.

### `POST /bookings/:id/cancel-request`

- Customer gửi yêu cầu hủy.

### `POST /bookings/:id/cancel-confirm`

- Sales xác nhận hủy.

### `POST /bookings/:id/payment-transactions`

- Ghi nhận transaction mới.

## 5.6 Vouchers

### `GET /vouchers`

- Query: `status`, `keyword`, `page`, `pageSize`

### `POST /vouchers`

- Sales tạo voucher.

### `PATCH /vouchers/:id`

- Cập nhật voucher.

### `POST /vouchers/:id/approve`

- Manager duyệt voucher.

### `POST /vouchers/:id/reject`

- Manager từ chối voucher.

## 5.7 Suppliers

### `GET /suppliers`

- Query: `type`, `keyword`, `page`, `pageSize`

### `POST /suppliers`

- Tạo NCC.

### `PATCH /suppliers/:id`

- Cập nhật NCC.

### `POST /suppliers/:id/service-variants`

- Thêm biến thể dịch vụ/bảng giá.

## 5.8 Blogs

### `GET /blogs`

- Query: `category`, `keyword`, `page`, `pageSize`

### `GET /blogs/:slug`

- Chi tiết bài viết.

## 5.9 Reports

### `GET /reports/sales-dashboard`

- Aggregate cho sales dashboard.

### `GET /reports/coordinator-dashboard`

- Aggregate cho coordinator dashboard.

### `GET /reports/manager-summary`

- Aggregate cho manager.

## 5.10 Chuẩn pagination

Input:

- `page`
- `pageSize`

Output:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```
