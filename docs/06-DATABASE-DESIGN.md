# 06. Database Design

## 6.1 Database được chọn

- PostgreSQL 16
- Prisma schema nằm ở `backend/prisma/schema.prisma`

## 6.2 Mô hình chính

### Bảng người dùng

- `User`
- `RefreshToken`

### Bảng sản phẩm tour

- `TourProgram`
- `TourInstance`

### Bảng bán hàng

- `Booking`
- `BookingPassenger`
- `PaymentTransaction`

### Bảng khuyến mãi

- `Voucher`
- `VoucherTarget`

### Bảng NCC

- `Supplier`
- `SupplierServiceVariant`

### Bảng nội dung

- `BlogPost`

## 6.3 Quan hệ quan trọng

- Một `TourProgram` có nhiều `TourInstance`.
- Một `TourInstance` có nhiều `Booking`.
- Một `Booking` có nhiều `BookingPassenger`.
- Một `Booking` có nhiều `PaymentTransaction`.
- Một `Voucher` có thể áp dụng cho nhiều `TourProgram`.

## 6.4 Quyết định mô hình hóa

### Dùng cột JSON cho

- `sightseeingSpots`
- `itineraryJson`
- `pricingConfigJson`
- `costEstimateJson`
- `settlementJson`
- `coverageJson`
- `standardsJson`

Lý do:

- Giai đoạn đầu cần đi nhanh.
- Dữ liệu có cấu trúc lồng nhau, thay đổi nhiều.
- Chưa cần query analytics phức tạp trên từng node con.

### Tách bảng riêng cho

- passengers
- payment transactions
- refresh tokens
- voucher targets
- supplier service variants

Lý do:

- Cần query/report/filter rõ ràng.
- Có vòng đời và constraint riêng.

## 6.5 Indexes tối thiểu

- `User.email`
- `TourProgram.code`, `TourProgram.slug`
- `TourInstance.code`
- `TourInstance(programId, status)`
- `TourInstance.departureDate`
- `Booking.bookingCode`
- `Booking(tourInstanceId, status)`
- `Voucher.code`

## 6.6 Migration strategy

1. Tạo schema rỗng.
2. Dựng auth + users.
3. Dựng tour program + tour instance.
4. Dựng bookings + passengers + payments.
5. Dựng vouchers.
6. Dựng suppliers.
7. Dựng blogs/reports.

## 6.7 Chính sách seed

- Không seed business demo vào frontend.
- Nếu cần QA/demo nội bộ, seed ở backend dưới dạng migration/seed script riêng.
- Seed phải tách khỏi production path.

## 6.8 Phần mở rộng bắt buộc trước khi cắt mock coordinator

Schema draft hiện tại chưa đủ để thay thế hoàn toàn mock ở các màn:

- kho dịch vụ
- nhà cung cấp
- hướng dẫn viên
- dự toán / nhận điều hành / quyết toán

Đề xuất bổ sung:

### Service catalog

- `ServiceCatalog`
- `ServiceCatalogPrice`

Field tối thiểu:

- `category`
- `name`
- `unit`
- `priceMode`
- `setupMode`
- `provinceCode` cho vé tham quan
- `formulaCount`
- `formulaQuantity`
- `status`

### Supplier operation

- `SupplierServiceLine`
- `SupplierServicePrice`

Field tối thiểu:

- `supplierId`
- `serviceGroup` (`main`, `meal`)
- `transportType` nếu là vận chuyển
- `menu`, `note`
- `priceEffectiveFrom`
- `priceEffectiveTo`
- `createdBy`

### Guide profile

- `GuideProfile`
- `GuideLanguage`

Field tối thiểu:

- `phone`
- `email`
- `address`
- `operatingArea`
- `guideCardNumber`
- `issueDate`
- `expiryDate`
- `issuePlace`
- `languages`

### Estimate and settlement persistence

Nếu vẫn giữ snapshot JSON giai đoạn đầu, vẫn nên có metadata bảng riêng cho:

- `TourInstanceEstimateVersion`
- `TourInstanceSettlementVersion`

để audit được ai sửa, sửa lúc nào, và rollback/read-only approval dễ hơn.
