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
- Input nên bao gồm:
  - thông tin chung: `name`, `days`, `nights`, `departurePoint`, `sightseeingSpots`, `routeDescription`, `bookingDeadline`, `transport`, `arrivalPoint`
  - loại tour: `tourType`
  - nếu `tourType = mua_le`: `holiday`, `selectedDates[]`
  - nếu `tourType = quanh_nam`: `yearRoundStartDate`, `yearRoundEndDate`, `weekdays[]`, `coverageMonths`
  - `itinerary[]`: `day`, `title`, `meals[]`, `description`, `accommodationPoint`
  - `pricingConfig`: `expectedGuests`, `profitMargin`, `taxRate`, `otherCostFactor`, `guideUnitPrice`, `manualOverrides`
  - `costEstimateDraft`: danh sách nhóm chi phí, NCC/dịch vụ dự kiến, đơn giá, dòng mặc định và ghi chú
  - `previewRows[]`: các tour dự kiến đang được tick tạo, gồm `departureDate`, `endDate`, `dayType`, `expectedGuests`, `costPerAdult`, `sellPrice`, `profitPercent`, `bookingDeadline`
- Backend cần validate `selectedDates[]` hoặc `yearRoundStartDate/yearRoundEndDate` theo `tourType`; frontend hiện đã sinh preview nhưng backend vẫn là nguồn kiểm tra cuối.

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
- Với luồng tạo mới chương trình, `rows[]` có thể lấy từ `previewRows[]` của `POST /tour-programs` sau khi CT tour được lưu và được phép sinh tour dự kiến.

### `GET /tour-instances/:id`

- Chi tiết một lần khởi hành.

### `POST /tour-instances/:id/receive`

- Coordinator nhận điều hành.
- Backend cần set `receivedBy`, `receivedAt`, `assignedCoordinatorId` và chuyển tour sang tab xử lý tiếp theo của đúng điều phối viên đã nhận.
- Sau khi nhận, tour không được còn xuất hiện ở tab `Chờ nhận điều hành` của điều phối viên khác.

### `POST /tour-instances/:id/estimate`

- Lưu dự toán.
- Payload dự toán nên lưu bảng chính theo khoản mục tính tiền và bảng giá NCC/dịch vụ tách riêng:
  - dòng chính: `categoryId`, `categoryName`, `itemId`, `itemName`, `unit`, `target`, `quantity`, `usageMetric`, `appliedUnitPrice`, `total`
  - bảng giá: `supplierId`, `supplierName`, `serviceVariant`, `quotedPrice`, `notes`, `isPrimary`
- UI expand theo từng dòng chính để hiển thị bảng giá; API nên trả dữ liệu đủ để render hai lớp này.

### `POST /tour-instances/:id/estimate/approve`

- Manager duyệt dự toán.

### `POST /tour-instances/:id/settlement`

- Lưu quyết toán.
- Payload quyết toán kế thừa dòng từ dự toán tour, không thêm mới dịch vụ/hạng mục.
- Mỗi dòng gồm `supplierId`, `supplierName`, `serviceName`, `estimated`, `actual`, `variance`, `note`, kèm `categoryId/categoryName` để nhóm theo khoản mục.
- Chỉ `actual` và `note` là trường chỉnh sửa trên màn quyết toán hiện tại.

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
- Trả về list NCC phục vụ màn catalog và màn chọn NCC trong dự toán.

### `POST /suppliers`

- Tạo NCC.
- Body nên tách rõ:
  - thông tin NCC
  - `services`
  - `mealServices` nếu là khách sạn có dịch vụ ăn kèm

### `PATCH /suppliers/:id`

- Cập nhật NCC.

### `POST /suppliers/:id/service-variants`

- Thêm biến thể dịch vụ/bảng giá.

### `POST /suppliers/:id/quotes`

- Tạo đợt báo giá mới cho nhiều dòng dịch vụ cùng lúc.
- Dùng cho:
  - khách sạn cập nhật đồng thời lưu trú + ăn uống
  - vận chuyển cập nhật theo loại phương tiện
  - nhà hàng cập nhật set menu

### `GET /suppliers/:id`

- Chi tiết NCC.
- Trả kèm:
  - service lines
  - meal service lines
  - price history theo từng line

## 5.8 Services Catalog

### `GET /services`

- Query: `category`, `keyword`, `status`, `page`, `pageSize`
- Dùng cho kho dịch vụ coordinator.

### `POST /services`

- Chỉ áp dụng cho service catalog tạo từ UI như `Vé tham quan`, `Các dịch vụ khác`.

### `PATCH /services/:id`

- Sửa metadata service catalog.

### `POST /services/:id/prices`

- Thêm bảng giá mới cho service catalog.

### `PATCH /services/:id/prices/:priceId`

- Chỉnh sửa riêng một dòng bảng giá.

## 5.9 Guides

### `GET /guides`

- Query: `keyword`, `language`, `status`, `page`, `pageSize`

### `POST /guides`

- Tạo hồ sơ HDV.
- Body gồm:
  - thông tin cá nhân
  - số thẻ
  - ngày cấp/hết hạn
  - nơi cấp
  - ngoại ngữ

### `PATCH /guides/:id`

- Cập nhật hồ sơ HDV.

### `GET /guides/:id`

- Chi tiết HDV.

## 5.10 Blogs

### `GET /blogs`

- Query: `category`, `keyword`, `page`, `pageSize`

### `GET /blogs/:slug`

- Chi tiết bài viết.

## 5.11 Reports

### `GET /reports/sales-dashboard`

- Aggregate cho sales dashboard.

### `GET /reports/coordinator-dashboard`

- Aggregate cho coordinator dashboard.

### `GET /reports/manager-summary`

- Aggregate cho manager.

## 5.12 Chuẩn pagination

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
