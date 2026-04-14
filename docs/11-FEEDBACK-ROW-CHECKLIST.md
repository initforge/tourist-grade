# Feedback Row Checklist

Ngày cập nhật: `2026-04-14`

Nguồn tham chiếu:
- Google Sheet feedback khách: tab `Lỗi` (`gid=465071017`)
- Verify local code tại repo này
- Verify automated bằng `npm run build`
- Verify automated bằng `npx playwright test --config=playwright.manual.config.ts --reporter=line`

Kết quả hiện tại:
- Build: `pass`
- Playwright full suite: `63/63 pass`
- Không còn row nào **đã xác định chắc chắn là chưa làm trong code hiện tại**

Lưu ý:
- Sheet hiện vẫn để nhiều row là `Chưa sửa`, nhưng trạng thái đó đang **stale hơn code/test hiện tại**.
- File này là checklist thực tế theo codebase hiện tại, không phải mirror nguyên xi cột `Tình trạng` trong sheet.

## Kết luận nhanh

### Row thực sự chưa làm
- `Không có row nào đang xác định là chưa làm dở trong code hiện tại.`

### Việc còn mở nhưng không phải thiếu code
- Cập nhật lại trạng thái trong Google Sheet cho đúng với thực tế.
- Nếu cần nghiệm thu khách hàng, chụp bằng chứng màn hình theo từng row để đối chiếu.

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
- [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:1)
