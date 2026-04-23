# Feedback Verify

Ngày cập nhật: `2026-04-23`

File này là source of truth duy nhất cho việc verify feedback khách hàng.

Nguồn:
- Google Sheet feedback khách, tab `Lỗi`
- Export nguồn đã lưu local: [feedback-source.xlsx](/P:/tourist-grade/docs/attachment-audit/feedback-source.xlsx)
- Attachment local: [attachment-audit](/P:/tourist-grade/docs/attachment-audit)
- Môi trường chuẩn để verify: `localhost` qua `docker compose`

Lệnh verify local chuẩn:

```powershell
docker compose up -d --build
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:8080'
cd frontend
npm run test:e2e
```

Kết quả chốt hiện hành:
- Verdict mặc định phải bám local stack, không bám `pages.dev`.
- Các nhắc tới `production`, `Cloudflare Pages` hoặc `pages.dev` ở một số row chỉ còn giá trị tham chiếu lịch sử.
- Khi feedback thay đổi, cập nhật lại file này thay vì tạo docs verify mới.

Nguyên tắc đọc row:
- Mỗi row được kết luận theo spec hợp nhất của `Lỗi + UPDATE + UPDATE LỖI`.
- Nếu cột sau override cột trước thì verdict bám cột sau.
- `Attachment` là ảnh/wireframe/mock link đã được mở trực tiếp. `-` nghĩa là row đó không có attachment trong sheet.
- Không dùng kết quả `72/72 pass` để thay thế verdict từng row. Kết quả test tổng chỉ là bước chốt cuối sau khi từng row đã có trace riêng.
- Không tạo thêm docs verify rời rạc; nếu feedback đổi thì cập nhật file này để giữ một source of truth.

Quy ước verdict:
- `Đáp ứng`
- `Đáp ứng theo spec mới`
- `Không áp dụng`

## Source Check

Export `feedback-source.xlsx` đã được parse trực tiếp từ tab `Lỗi`:

| Cột | Header nguồn | Cách dùng khi verify |
| --- | --- | --- |
| A | `Người dùng` | Role gốc từ khách. |
| B | `Lỗi` | Feedback gốc của row. |
| C | `UPDATE` | Bổ sung hoặc override feedback gốc. |
| D | `UPDATE LỖI` | Lỗi phát sinh hoặc yêu cầu mới sau update; có thể siết hoặc sửa nghĩa cột B/C. |
| E | `Tình trạng` | Chỉ là trạng thái tham khảo, không dùng thay verdict cuối. |
| F | `Lỗi sau sửa` | Ghi chú phát sinh sau sửa nếu có. |

Thống kê nguồn:
- Row có nội dung feedback trong `B/C/D`: `43`.
- Row trống hoặc không áp dụng trong batch này: `24, 25, 26`.
- Số row có nội dung ở cột `Lỗi`: `42`.
- Số row có nội dung ở cột `UPDATE`: `28`.
- Số row có nội dung ở cột `UPDATE LỖI`: `18`.
- Row phải đọc hợp nhất đủ cả `Lỗi + UPDATE + UPDATE LỖI`: `7, 10, 11, 12, 28, 32, 33, 34, 36, 37, 38, 39, 41, 42, 45`.

Role mapping:

| Role gốc trong sheet | Role/module verify |
| --- | --- |
| `NV kinh doanh` | `Sales` |
| `NV điều phối` | `Coordinator` |
| `Quản lý` | `Manager` |
| `Khách vãng lai` | `Public / Guest` |
| `Khách đăng nhập` | `Customer` |
| `admin` | `Admin` |

## Row Trace

| Row | Role | Attachment | Production | Code | Test | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Sales | `-` | `/sales/dashboard` | [SalesDashboard.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesDashboard.tsx:1) | [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:36) | `Đáp ứng` | Sidebar sales đúng scope. |
| 3 | Sales | `-` | sidebar sales | [SalesDashboard.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesDashboard.tsx:1) | [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:137) | `Đáp ứng` | Có toggle thu gọn. |
| 4 | Sales | `-` | `/sales/dashboard` | [SalesDashboard.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesDashboard.tsx:1) | [sales-dashboard.spec.ts](/P:/tourist-grade/frontend/tests/sales-dashboard.spec.ts:5) | `Đáp ứng` | Tách work/report, có filter ngày và popup chọn loại báo cáo. |
| 5 | Sales | `-` | `/sales/bookings` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1) | [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:36) | `Đáp ứng` | Dùng tabs thay dropdown trạng thái tổng. |
| 6 | Sales | `-` | `/sales/bookings` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1) | [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:32) | `Đáp ứng` | Search theo tab hiện tại. |
| 7 | Sales | `-` | `/sales/bookings` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1) | [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:16), [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:84) | `Đáp ứng` | Bỏ tab `Tất cả`, payment label `50%/100%`, filter con, hover title, bỏ export cũ; tab `Đã hủy` chỉ còn `Chưa hoàn` và `Hoàn thành`, không còn cột `Trạng thái đơn`. |
| 8 | Sales | `-` | `/sales/bookings` -> `/sales/bookings/:id` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1), [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1) | [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:52) | `Đáp ứng` | Xác nhận chuyển về detail. |
| 9 | Sales | `-` | `/sales/bookings` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1) | [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:70) | `Đáp ứng` | Có phân trang và range summary. |
| 10 | Sales | [row-10-C10.jpg](/P:/tourist-grade/docs/attachment-audit/row-10-C10.jpg) | `/sales/bookings/B003?tab=pending_confirm`, `/sales/bookings/B002?tab=cancelled`, `/sales/bookings/B006?tab=cancelled` | [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1) | [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:25), [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:147), [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:170) | `Đáp ứng` | Siết validate CCCD đúng 12 chữ số, GKS có format hợp lệ, và hủy chỉnh sửa bill luôn khôi phục ảnh/log cũ; bill mới vẫn giữ được sau reload. |
| 11 | Sales | `-` | `/sales/vouchers`, `/sales/vouchers/:id` | [Vouchers.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/Vouchers.tsx:1) | [sales-vouchers.spec.ts](/P:/tourist-grade/frontend/tests/sales-vouchers.spec.ts:5), [sales-vouchers.spec.ts](/P:/tourist-grade/frontend/tests/sales-vouchers.spec.ts:52) | `Đáp ứng` | Voucher list/detail/form bám state và action mới. |
| 12 | Manager | `-` | `/manager/voucher-approval` | [ManagerVoucherApproval.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ManagerVoucherApproval.tsx:1) | [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:109), [sales-manager.spec.ts](/P:/tourist-grade/frontend/tests/sales-manager.spec.ts:133) | `Đáp ứng` | List-only, có `Tour áp dụng`, `Ghi chú`, `Số lượng được dùng`, reject cần lý do. |
| 13 | Sales / Coordinator / Manager | `-` | `/sales/dashboard`, `/coordinator/dashboard`, `/manager/dashboard` | [SalesDashboard.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesDashboard.tsx:1), [CoordinatorDashboard.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/CoordinatorDashboard.tsx:1), [ManagerDashboard.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ManagerDashboard.tsx:1) | [sales-dashboard.spec.ts](/P:/tourist-grade/frontend/tests/sales-dashboard.spec.ts:5), [dashboard-feedback.spec.ts](/P:/tourist-grade/frontend/tests/dashboard-feedback.spec.ts:5), [dashboard-feedback.spec.ts](/P:/tourist-grade/frontend/tests/dashboard-feedback.spec.ts:26) | `Đáp ứng` | Cả 3 dashboard đều tách work/report đúng spec. |
| 14 | Sales | `-` | `/sales/bookings` | [SalesBookings.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookings.tsx:1) | [sales-bookings-tools.spec.ts](/P:/tourist-grade/frontend/tests/sales-bookings-tools.spec.ts:59) | `Đáp ứng theo spec mới` | Bị row 7 override theo hướng bỏ export booking list cũ. |
| 15 | Sales | `-` | `/sales/bookings/B003?tab=pending_confirm` | [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1) | [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:49) | `Đáp ứng` | Full-page + breadcrumb. |
| 16 | Sales | `-` | `/sales/bookings/B003?tab=pending_confirm` | [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1) | [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:95) | `Đáp ứng` | Download DSHK dạng Excel. |
| 17 | Sales | `-` | `/sales/bookings/B005?tab=cancelled`, `/sales/bookings/B006?tab=cancelled` | [SalesBookingDetail.tsx](/P:/tourist-grade/frontend/src/features/sales/pages/SalesBookingDetail.tsx:1) | [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:139), [sales-booking-detail.spec.ts](/P:/tourist-grade/frontend/tests/sales-booking-detail.spec.ts:163) | `Đáp ứng` | Refund bill flow đúng theo state. |
| 18 | Public | [row-18-C18.png](/P:/tourist-grade/docs/attachment-audit/row-18-C18.png), `B18` stale | `/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao` | [TourDetail.tsx](/P:/tourist-grade/frontend/src/features/public/pages/TourDetail.tsx:1) | [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:22) | `Đáp ứng` | Mock cũ không còn dùng được; attachment ảnh vẫn đối chiếu được với màn local hiện hành. |
| 19 | Customer / Guest | `-` | cùng route tour detail | [TourDetail.tsx](/P:/tourist-grade/frontend/src/features/public/pages/TourDetail.tsx:1), [Wishlist.tsx](/P:/tourist-grade/frontend/src/features/customer/pages/Wishlist.tsx:1) | [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:48) | `Đáp ứng` | Wishlist guest/customer đúng. |
| 20 | Public / Customer | [row-20-B20.png](/P:/tourist-grade/docs/attachment-audit/row-20-B20.png) | `/tours/.../book` | [BookingCheckout.tsx](/P:/tourist-grade/frontend/src/features/public/pages/BookingCheckout.tsx:1) | [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:59) | `Đáp ứng` | Flow 3 bước khớp attachment và màn local hiện hành. |
| 21 | Public / Customer | `-` | `/customer/bookings/B001` | [CancelBooking.tsx](/P:/tourist-grade/frontend/src/features/customer/pages/CancelBooking.tsx:1), [CancelBookingModal.tsx](/P:/tourist-grade/frontend/src/shared/ui/CancelBookingModal.tsx:1) | [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:100) | `Đáp ứng` | Popup hủy đúng nhãn submit. |
| 22 | Public / Customer | mock `B22` còn sống | `/booking/lookup` | [OrderLookup.tsx](/P:/tourist-grade/frontend/src/features/public/pages/OrderLookup.tsx:1) | [customer-flow.spec.ts](/P:/tourist-grade/frontend/tests/customer-flow.spec.ts:114) | `Đáp ứng` | Layout 2 cột, action theo status, popup không tràn. |
| 23 | Admin | `-` | `/admin/users` | [AdminUsers.tsx](/P:/tourist-grade/frontend/src/features/admin/pages/AdminUsers.tsx:1) | [admin-users.spec.ts](/P:/tourist-grade/frontend/tests/admin-users.spec.ts:15) | `Đáp ứng` | Tách staff/customer và customer history đúng. |
| 24 | N/A | `-` | `-` | `-` | `-` | `Không áp dụng` | Row trống. |
| 25 | N/A | `-` | `-` | `-` | `-` | `Không áp dụng` | Row trống. |
| 26 | N/A / legacy | `-` | `-` | `-` | [admin-users.spec.ts](/P:/tourist-grade/frontend/tests/admin-users.spec.ts:15) | `Không áp dụng` | Chỉ còn tồn tại như legacy numbering trong test. |
| 27 | Coordinator | [row-27-C27.jpg](/P:/tourist-grade/docs/attachment-audit/row-27-C27.jpg) | `/coordinator/tours` | [TourInstances.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourInstances.tsx:1), [TourGenerationRules.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourGenerationRules.tsx:1) | [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:215), [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:13) | `Đáp ứng` | Điều phối dùng popup/data đúng, không lẫn flow manager. |
| 28 | Coordinator | [row-28-D28.jpg](/P:/tourist-grade/docs/attachment-audit/row-28-D28.jpg) | `/coordinator/tour-programs/create`, `/coordinator/tour-programs` | [TourProgramWizard.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourProgramWizard.tsx:1), [TourPrograms.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourPrograms.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:62) | `Đáp ứng` | Lịch lễ/chọn ngày đã nhìn trực tiếp attachment. |
| 29 | Coordinator | [row-29-B29.jpg](/P:/tourist-grade/docs/attachment-audit/row-29-B29.jpg) | wizard lịch trình | [TourProgramWizard.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourProgramWizard.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:35) | `Đáp ứng` | Không còn thêm ngày tay. |
| 30 | Coordinator | [row-30-B30-gid-0-p1.png](/P:/tourist-grade/docs/attachment-audit/row-30-B30-gid-0-p1.png), [row-30-D30-gid-0-p1.png](/P:/tourist-grade/docs/attachment-audit/row-30-D30-gid-0-p1.png) | wizard giá & cấu hình | [TourProgramWizard.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourProgramWizard.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:114), [role-strict-hardening.spec.ts](/P:/tourist-grade/frontend/tests/role-strict-hardening.spec.ts:107) | `Đáp ứng` | Wireframe mạnh, đã mở và trace trực tiếp. |
| 31 | Coordinator | [row-31-D31.jpg](/P:/tourist-grade/docs/attachment-audit/row-31-D31.jpg) | wizard tạo mới | [TourProgramWizard.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourProgramWizard.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:45) | `Đáp ứng` | Tab `Tour dự kiến` khớp attachment. |
| 32 | Coordinator | [row-32-B32.jpg](/P:/tourist-grade/docs/attachment-audit/row-32-B32.jpg) | `/coordinator/tour-rules` | [TourGenerationRules.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourGenerationRules.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:84) | `Đáp ứng` | Bảng và popup tạo tour khớp attachment. |
| 33 | Coordinator | [row-33-B33.jpg](/P:/tourist-grade/docs/attachment-audit/row-33-B33.jpg), [row-33-D33.jpg](/P:/tourist-grade/docs/attachment-audit/row-33-D33.jpg) | `/coordinator/tours/TI009/estimate` | [TourEstimate.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourEstimate.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:114), [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:182) | `Đáp ứng` | Group booking và layout dự toán đã bám attachment cụ thể. |
| 34 | Coordinator | `-` | `/coordinator/tours/:id/receive` | [TourReceiveDispatch.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourReceiveDispatch.tsx:1) | [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:253), [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:161) | `Đáp ứng` | Không có attachment nhưng trace code/UI/test rõ. |
| 35 | Coordinator | `-` | `/coordinator/tour-programs` | [TourPrograms.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourPrograms.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:13) | `Đáp ứng` | 3 tab quản lý CT tour. |
| 36 | Coordinator | `-` | `/coordinator/tours` | [TourInstances.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourInstances.tsx:1) | [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:67), [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:130) | `Đáp ứng` | Popup HDV mở thật, bỏ nhập xe. |
| 37 | Coordinator | [row-37-B37-gid-738844847-p1.png](/P:/tourist-grade/docs/attachment-audit/row-37-B37-gid-738844847-p1.png) | `/coordinator/tours/TI004/settle` | [TourSettlement.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourSettlement.tsx:1) | [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:161), [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:182) | `Đáp ứng` | Wireframe quyết toán đã mở trực tiếp. |
| 38 | Coordinator | `-` | `/coordinator/services` | [ServiceList.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/ServiceList.tsx:1) | [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:295), [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:176) | `Đáp ứng` | Không có attachment nhưng UI/test cover đủ. |
| 39 | Coordinator | [row-39-B39.jpg](/P:/tourist-grade/docs/attachment-audit/row-39-B39.jpg) | `/coordinator/suppliers` | [Suppliers.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/Suppliers.tsx:1) | [coordinator.spec.ts](/P:/tourist-grade/frontend/tests/coordinator.spec.ts:276), [coordinator-remaining.spec.ts](/P:/tourist-grade/frontend/tests/coordinator-remaining.spec.ts:176) | `Đáp ứng` | Supplier split đã mở trực tiếp attachment. |
| 40 | Coordinator | [row-40-B40.jpg](/P:/tourist-grade/docs/attachment-audit/row-40-B40.jpg) | estimate/settlement edit price popup | [TourEstimate.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourEstimate.tsx:1), [TourSettlement.tsx](/P:/tourist-grade/frontend/src/features/coordinator/pages/TourSettlement.tsx:1) | [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:182) | `Đáp ứng` | Popup edit giá đã bám attachment. |
| 41 | Manager | `-` | `/manager/tours` | [ActiveTours.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ActiveTours.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:13), [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:238), historical ref `95d40e2e` | `Đáp ứng` | Tab `Không đủ ĐK KH`, action `Hủy tour/Tiếp tục triển khai/Gia hạn`, popup `Duyệt tour chờ bán` đúng trên trace hiện hành; `95d40e2e` chỉ còn là mốc lịch sử. |
| 42 | Manager | `-` | `/manager/tour-programs/TP003/approval` | [AdminTourProgramApproval.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/AdminTourProgramApproval.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:70) | `Đáp ứng` | Read-only đủ 3 phần. |
| 43 | Manager | `-` | `/manager/tours/TI003/estimate-approval` | [ManagerTourEstimateApproval.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ManagerTourEstimateApproval.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:93) | `Đáp ứng` | Có request-edit/reject/approve. |
| 44 | Manager | `-` | `/manager/tour-programs` | [TourPrograms.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/TourPrograms.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:111) | `Đáp ứng` | Nhãn/cột đúng feedback mới. |
| 45 | Manager | [row-45-B45.jpg](/P:/tourist-grade/docs/attachment-audit/row-45-B45.jpg) | `/manager/tours` | [ActiveTours.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ActiveTours.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:13), [feedback-hardening.spec.ts](/P:/tourist-grade/frontend/tests/feedback-hardening.spec.ts:238), historical ref `95d40e2e` | `Đáp ứng` | Popup review bám attachment row 45; trace hiện hành đủ cho `Duyệt tour chờ bán`, `Duyệt`, `Yêu cầu sửa`, `Từ chối`, còn `95d40e2e` chỉ là mốc lịch sử. |
| 46 | Manager | `B46` stale | `/manager/cancel-policies` | [ManagerCancelPolicy.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/ManagerCancelPolicy.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:111) | `Đáp ứng theo spec mới` | Mock cũ stale; row bị update sang `chính sách cố định`. |
| 47 | Manager | `-` | `/manager/special-days` | [SpecialDays.tsx](/P:/tourist-grade/frontend/src/features/manager/pages/SpecialDays.tsx:1) | [manager-remaining.spec.ts](/P:/tourist-grade/frontend/tests/manager-remaining.spec.ts:111) | `Đáp ứng` | Module ngày đặc biệt đúng cột yêu cầu. |

## Kết luận

- Đây là file verify duy nhất cần giữ để trace feedback khách.
- Tất cả role đều đã được trace theo từng row riêng, không gộp chung thành một kết luận mơ hồ.
- Các row có attachment đã được mở trực tiếp; các row không có attachment vẫn có trace rõ `route -> code -> test`.
- Mốc `95d40e2e` chỉ còn giữ làm tham chiếu lịch sử cho một số row manager tours.
- Trong quá trình verify chặt hơn, đã phát hiện thêm một số lỗi text public/catalog kiểu `Thàng`, `T?N`, `Chuy?n`, `đ?nh`; đã sửa và build lại trước khi chốt.
- GitHub push vẫn cần chạy lại khi network shell tới `github.com:443` thông, vì hiện tại shell vẫn không kết nối được GitHub.
