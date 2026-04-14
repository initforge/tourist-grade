# Feedback Row Checklist

Ngày cập nhật: `2026-04-14`

Nguồn tham chiếu:
- Google Sheet feedback khách: tab `Lỗi` (`gid=465071017`)
- Verify code tại repo này
- Verify automated bằng `npm run build`
- Verify trực tiếp trên production `https://tourist-grade.pages.dev`
- Verify automated bằng `npx playwright test --config=playwright.config.ts --reporter=line`

Kết quả hiện tại:
- Build: `pass`
- Playwright full suite trên production: `72/72 pass`
- Verify production theo role:
  - `public/customer`: `7/7 pass`
  - `sales`: `29/29 pass`
  - `coordinator`: `29/29 pass`
  - `manager`: `14/14 pass`
  - `admin`: `1/1 pass`
- Không còn row nào **đã xác định chắc chắn là chưa làm trong code hiện tại**

Lưu ý:
- Sheet hiện vẫn để nhiều row là `Chưa sửa`, nhưng trạng thái đó đang **stale hơn code/test hiện tại**.
- File này là checklist thực tế theo codebase hiện tại, không phải mirror nguyên xi cột `Tình trạng` trong sheet.
- Verify không chỉ theo từng màn đơn lẻ mà còn đi qua các luồng liên đới: popup/detail/list/dashboard/approval/lookup/checkout khi feedback của khách nối nhiều bước.
- Một row chỉ được coi là `done` khi acceptance criteria cuối đã được hợp nhất từ cả `Lỗi` + `UPDATE` + `UPDATE LỖI`; cột sau có thể mở rộng, siết chặt hoặc phủ nghĩa cột trước.

## Kết luận nhanh

### Row thực sự chưa làm
- `Không có row nào đang xác định là chưa làm dở trong code hiện tại.`

### Việc còn mở nhưng không phải thiếu code
- Cập nhật lại trạng thái trong Google Sheet cho đúng với thực tế.
- Nếu cần nghiệm thu khách hàng, chụp bằng chứng màn hình theo từng row để đối chiếu.

## Row Cần Đọc Hợp Nhất 3 Cột

- Các row có cả `Lỗi` + `UPDATE` + `UPDATE LỖI`, tức là phải verify theo spec hợp nhất thay vì từng cột rời nhau: `7, 10, 11, 12, 28, 32, 33, 34, 36, 37, 38, 39, 41, 42, 45`.
- Đây là nhóm ưu tiên cao khi rà nghiệm thu vì cột sau đang mở rộng hoặc siết chặt logic của cột trước.

## Verify Production Theo Role

### Public / Customer
- Row `18`, `19`, `20`, `21`, `22` đã được verify trực tiếp trên production qua tour detail, wishlist, checkout 3 bước, popup hủy và tra cứu booking.
- Đã kiểm tra thêm runtime audit, responsive cơ bản và ảnh/runtime request lỗi.

### Sales
- Row `7`, `9`, `10`, `11`, `13` đã được verify trực tiếp trên production qua booking list, booking detail, voucher list/detail/form và dashboard.
- Đã kiểm tra thêm các luồng liên đới: search theo tab, breadcrumb trả về đúng tab, validation hành khách/phòng, confirm/refund/cancel, action theo trạng thái voucher và export báo cáo.

### Coordinator
- Row `28`, `30`, `31`, `33`, `34`, `36`, `37`, `38`, `39` đã được verify trực tiếp trên production qua tour programs, tour rules, tour instances, dispatch HDV, estimate, settlement, service và supplier.
- Đã kiểm tra thêm các luồng liên đới giữa wizard -> generate -> estimate -> settlement và các constraint theo wireframe mới.

### Manager
- Row `12`, `13`, `41`, `42` đã được verify trực tiếp trên production qua voucher approval, tour approval, tour program approval, estimate approval và dashboard.
- Đã kiểm tra thêm các luồng liên đới: reject phải có lý do, màn read-only đúng vai trò, popup approve/request-edit/reject đầy đủ.

### Admin
- Row `26` đã được verify trực tiếp trên production qua phân tách tab nhân sự/khách hàng và action đúng theo từng loại user.

## Row Sheet Đang Ghi "Chưa sửa" Nhưng Đã Verify

| Row | Role | Trạng thái thực tế | Evidence chính |
| --- | --- | --- | --- |
| 7 | NV kinh doanh | Đã verify | `sales-bookings-tools.spec.ts`, `sales-manager.spec.ts`, `feedback-hardening.spec.ts` |
| 9 | NV kinh doanh | Đã verify | `sales-bookings-tools.spec.ts` |
| 10 | NV kinh doanh | Đã verify | `sales-booking-detail.spec.ts`, `sales-manager.spec.ts`, `feedback-hardening.spec.ts` |
| 11 | NV kinh doanh | Đã verify | `sales-vouchers.spec.ts`, `feedback-hardening.spec.ts` |
| 12 | Quản lý | Đã verify | `sales-manager.spec.ts`, `feedback-hardening.spec.ts` |
| 13 | Quản lý / NV kinh doanh / NV điều phối | Đã verify | `sales-dashboard.spec.ts`, `dashboard-feedback.spec.ts` |
| 28 | NV điều phối | Đã verify | `coordinator-remaining.spec.ts`, `coordinator.spec.ts`, `feedback-hardening.spec.ts` |
| 30 | NV điều phối | Đã verify | `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 31 | NV điều phối | Đã verify | `coordinator-remaining.spec.ts` |
| 33 | NV điều phối | Đã verify | `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 34 | NV điều phối | Đã verify | `coordinator.spec.ts`, `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 36 | NV điều phối | Đã verify | `coordinator.spec.ts` |
| 37 | NV điều phối | Đã verify | `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 38 | NV điều phối | Đã verify | `coordinator.spec.ts`, `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 39 | NV điều phối | Đã verify | `coordinator.spec.ts`, `coordinator-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 41 | Quản lý | Đã verify | `manager-remaining.spec.ts`, `feedback-hardening.spec.ts` |
| 42 | Quản lý | Đã verify | `manager-remaining.spec.ts`, `feedback-hardening.spec.ts` |

## Ghi chú theo cụm

### Sales
- Row `7`, `9`, `10`: booking list/detail đã được refactor theo feedback mới nhất, gồm tab/filter, pagination, search, disable confirm khi dữ liệu hành khách hoặc phân phòng chưa hợp lệ, breadcrumb giữ đúng tab.
- Row `11`: voucher sales đã dùng detail page riêng, action theo trạng thái mới và test đang bám route/detail mới.

### Manager
- Row `12`: phê duyệt voucher hiện chỉ còn dạng list page, có `Ghi chú`, `Số lượng được dùng`, `Tour áp dụng`, sort theo ngày bắt đầu và warning sát hạn.
- Row `41`, `42`: cụm quản lý tour và phê duyệt chương trình tour đang pass bộ spec manager hiện tại.

### Coordinator
- Row `28`, `30`, `31`, `33`, `34`, `36`, `37`, `38`, `39`: đã có implementation + spec verify cho wizard chương trình tour, dự toán, nhận điều hành, phân công HDV, quyết toán, dịch vụ, nhà cung cấp.

## File liên quan vừa được dùng để khóa checklist này

Code:
- [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1)
- [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1)
- [ManagerVoucherApproval.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ManagerVoucherApproval.tsx:1)

Tests:
- [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:1)
- [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:1)
- [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:1)
- [sales-vouchers.spec.ts](/P:/tourist-grade/frontend/tests/sales-vouchers.spec.ts:1)
- [sales-dashboard.spec.ts](/P:/tourist-grade/frontend/tests/sales-dashboard.spec.ts:1)
- [dashboard-feedback.spec.ts](/P:/tourist-grade/frontend/tests/dashboard-feedback.spec.ts:1)
- [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:1)
- [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:1)
- [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:1)
- [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:1)
- [admin-users.spec.ts](/P:/tourist-grade/frontend/tests/admin-users.spec.ts:1)
- [role-strict-hardening.spec.ts](/P:/tourist-grade/frontend/tests/role-strict-hardening.spec.ts:1)
- [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:1)
