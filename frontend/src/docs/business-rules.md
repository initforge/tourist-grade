# Business Rules For API And Database Handoff

This file documents UI-enforced rules that should become backend contracts when the app moves from mock data and localStorage to API/database persistence.

## Voucher Lifecycle

Source helpers: `entities/voucher/lib/voucherRules.ts`

- `draft` and `pending_approval` vouchers whose `startDate <= today` are normalized to `rejected`.
- Auto rejection reason: `Quá thời gian phê duyệt`.
- A voucher can be saved only when `startDate - createdAt >= 10 days`.
- A voucher can be sent for approval only when `startDate - today >= 7 days`.
- `limit` is the denominator in the sales list `Áp dụng` field (`used / limit`) and must be a positive integer before sending for approval.
- Voucher value must be a positive integer input. Percent vouchers are rendered with `%`; fixed-amount vouchers are rendered as VND.
- Sales draft warning is shown when a draft voucher starts in 7-8 days.
- Manager approval warning is shown when a pending voucher starts in 1-2 days.

Suggested API fields:

- `id`
- `code`
- `type`: `percent | fixed`
- `value`: numeric integer
- `startDate`
- `endDate`
- `used`
- `limit`
- `applicableTours`
- `status`
- `rejectionReason`
- `createdBy`
- `createdAt`

Backend should own lifecycle normalization and return the normalized `status` plus `rejectionReason`. Frontend can keep the helper as a display fallback.

## Booking Reports

Source helpers: `shared/lib/bookingReports.ts`

- Daily revenue groups bookings by `createdAt` date.
- Booking passenger count is exported as `Adult / Child / Infant`.
- Booking note export uses cancellation reason for cancelled/pending-cancel bookings, otherwise contact note.
- Sales booking summary export must include `Số lượng khách` and `Ghi chú`.
- Sales refund follow-up export must match the cancelled booking tab fields:
  - `Mã đơn`
  - `Khách hàng`
  - `Tour`
  - `Ngày khởi hành`
  - `Số lượng khách`
  - `Tổng tiền`
  - `Trạng thái đơn`
  - `Lý do hủy`
  - `Số tiền hoàn`
  - `TT hoàn tiền`

Suggested report API endpoints:

- `GET /reports/daily-revenue?from=&to=&scope=`
- `GET /reports/bookings?from=&to=`
- `GET /reports/refunds?from=&to=&refundStatus=pending`
- `GET /vouchers?status=`
- `POST /vouchers/:id/submit-approval`
- `POST /vouchers/:id/approve`
- `POST /vouchers/:id/reject`

## Tour Program Approval

Manager approval route: `/manager/tour-programs/:id/approval`

- Approval screen renders the tour program in read-only mode with three business sections:
  - `Thông tin chung`
  - `Lịch trình`
  - `Giá & Cấu hình`
- Reject requires a non-empty reason before confirmation.
- Approve changes the local UI state to `active` and displays `Đang hoạt động`.
- `createdBy` and `createdAt` are preserved as source data; approval does not rewrite creator metadata.

Suggested API endpoints:

- `GET /manager/tour-programs/:id`
- `POST /manager/tour-programs/:id/approve`
- `POST /manager/tour-programs/:id/reject`

## Public Booking Flow

Public/customer route: `/tours/:slug/book?scheduleId=...`

- Step 1 is `Thông tin` and includes both contact information and passenger information.
- Passenger count controls must not allow `adult + child + infant` to exceed `departureSchedule.availableSeats`.
- Passenger nationality uses a predefined list selector, not free text.
- Single-room surcharge is an inline option on adult passengers.
- Step 2 is `Thanh toán` and must show payment ratio plus `Hình thức thanh toán`.
- Step 3 is `Hoàn tất`; successful booking stays inside checkout instead of navigating to a separate success route.

Suggested API endpoint:

- `POST /bookings` should validate `scheduleId`, available seats, passenger payload, contact payload, payment ratio, and payment method.

## Cancellation Request Visibility

Routes: `/booking/lookup`, `/customer/bookings`

- Booking status `pending_cancel` means the customer has sent a cancellation request and sales has not confirmed cancellation yet.
- For `pending_cancel`, hide customer-facing cancel actions.
- Show `Đã gửi yêu cầu hủy` beside the booking status.

## Testing Scope

- Rule helpers should stay deterministic by accepting explicit date inputs where possible.
- Playwright should cover the role workflows:
  - Sales voucher create/edit/list/detail actions.
  - Manager voucher approval warning and confirmation flows.
  - Sales/manager/coordinator dashboard daily revenue panels.
  - Sales report export field selections.

## Coordinator Internal Ops Mock Boundaries

These rules describe the current frontend mock behavior that must become API/database contracts later.

- Creating a year-round tour program requires `yearRoundStartDate` and `yearRoundEndDate`; the UI generates preview departure rows from the selected date range, similar to holiday tour previews.
- The tour program pricing step is grouped by operational cost category:
  - transport and flight rows have supplier quote lists and one default quote;
  - hotel quote groups are generated from selected accommodation points in the itinerary;
  - meal quote groups are generated from selected meals in the itinerary;
  - attraction tickets and other costs are direct service cost rows, not supplier selection lists;
  - guide cost stores only `unitPrice`.
- Any `add supplier`, `add service`, default selection, delete, price input, or note input in pricing tables must map to a future command or draft update endpoint, not just a static display row.
- Tour generation `pending approval` rows support view, edit, and delete in mock state. Backend should own the equivalent state transition and audit metadata.
- Coordinator/manager tour program stop actions currently update local state and reason. Backend should persist `status = inactive`, `inactiveReason`, `actorId`, and `actedAt`.
- Estimate and settlement submit/save buttons currently show local feedback. Backend migration must replace these with real draft/submit/complete commands.
