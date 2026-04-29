# Cross-Session Consensus

File này là điểm đồng bộ giữa hai tiến trình Codex đang chạy song song.

## Cách dùng

- Mỗi tiến trình chỉ sửa phần mình phụ trách, không sửa trạng thái của tiến trình còn lại nếu chưa kiểm chứng.
- Nếu một thay đổi đụng vào luồng dùng chung, ghi vào mục "Cần cả hai bên xác nhận".
- Bên còn lại đọc, phản hồi trực tiếp trong file này bằng một dòng `Phản hồi:` ngay dưới item đó.
- Một item chỉ được coi là chốt khi cả hai bên ghi rõ `Đồng ý`.
- Nếu cần hỏi người dùng, ghi rõ câu hỏi ở mục "Cần user quyết định", không im lặng.

## Phạm vi hiện tại

### Tiến trình A - NV Điều phối + Khách hàng

- Owner: session hiện tại.
- Docs tham chiếu: `docs/04-FEEDBACK-BACKLOG-NGUYEN-VAN.md`.
- Docs nguyên văn theo role/batch: `docs/07-YEU-CAU-NGUYEN-VAN-USER.md`.
- Trạng thái gần nhất: live E2E Điều phối + Khách hàng đã pass `20/20` trên Docker.
- Lưu ý: đã có chỉnh sửa dùng chung trong booking/email/public tour vì bắt buộc để hoàn thành luồng khách hàng.

### Tiến trình B - NV Kinh doanh + Quản lý

- Owner: tiến trình Codex khác.
- Docs tham chiếu: `docs/05-SALES-MANAGER-FEEDBACK-2026-04-29.md`.
- Docs nguyên văn theo role/batch: `docs/07-YEU-CAU-NGUYEN-VAN-USER.md`.
- Trạng thái gần nhất: chưa được session hiện tại xác nhận bằng test của tiến trình B.
- Lưu ý: session hiện tại không tự kết luận phần NV kinh doanh + Quản lý đã xong nếu chưa có phản hồi của tiến trình B.

## Cần cả hai bên xác nhận

### 1. Booking lifecycle và tự động chuyển trạng thái

- Liên quan: khách đặt tour, thanh toán 15 phút, thanh toán 50%, quá hạn thanh toán phần còn lại trước 7 ngày, sales tab Cần xác nhận/Đã hủy/Hoàn thành.
- File có khả năng giao nhau: `backend/src/lib/booking-lifecycle.ts`, `backend/src/routes/bookings.ts`, `frontend/src/shared/lib/bookingLifecycle.ts`, sales/customer booking pages.
- Điều phối + Khách hàng: đã test live các luồng customer booking, PayOS webhook, sửa booking, auto-cancel trong suite `customer-live-e2e` và `customer-payment-hardening`.
- NV Kinh doanh + Quản lý cần xác nhận: các tab sales vẫn lọc đúng booking sau khi lifecycle chạy.
- Phản hồi tiến trình B:
- Chốt:

### 2. Email outbox và EmailJS

- Liên quan: booking created, payment received, booking confirmed, cancel requested, cancel confirmed, refund completed/updated, wishlist reminder.
- File có khả năng giao nhau: `backend/src/lib/email-outbox.ts`, `backend/src/routes/bookings.ts`, `backend/src/routes/tour-instances.ts`, sales booking detail.
- Điều phối + Khách hàng: đã tách gửi email ra sau transaction commit trong `bookings.ts` để tránh lỗi `Transaction already closed` khi EmailJS chậm; đã cấu hình template EmailJS `template_mho0du8` có subject/body tiếng Việt có dấu, conditional block cho mã đơn/tour/tiền hoàn/bill; backend `email-outbox.ts` tự build nội dung cho các template booking/payment/cancel/refund/wishlist và chặn base64 bill quá lớn để không vượt giới hạn biến động của EmailJS; live E2E đã pass sau rebuild.
- NV Kinh doanh + Quản lý cần xác nhận: mail xác nhận booking, xác nhận hủy, hoàn tiền và cập nhật bill vẫn tạo đúng outbox/email sau các thao tác sales/manager.
- Phản hồi tiến trình B:
- Chốt:

### 3. Tour hết hạn đặt và điều kiện hiển thị public

- Liên quan: public tour detail/list chỉ lấy tourInstance `DANG_MO_BAN`, còn chỗ, chưa quá `bookingDeadlineAt`; booking API không cho đặt lịch hết hạn.
- File có khả năng giao nhau: `backend/src/lib/public-tours.ts`, `backend/src/routes/public.ts`, `backend/src/routes/bookings.ts`, manager/coordinator tour instance flows.
- Điều phối + Khách hàng: đã test public tour DB-backed schedule, checkout schedule `DS001-4`, và booking deadline rule trong live E2E.
- NV Kinh doanh + Quản lý cần xác nhận: các thao tác manager mở bán/hủy tour không làm public tour hiện sai trạng thái.
- Phản hồi tiến trình B:
- Chốt:

### 4. Quy tắc Danh sách hành khách ở Điều hành tour / Chờ dự toán

- Liên quan: chỉ hiện khi tour đủ điều kiện khởi hành, hết hạn đặt tour, và toàn bộ booking của tour đã được NV kinh doanh xác nhận.
- File có khả năng giao nhau: coordinator tour operation screens, sales booking confirmation, tour instance status transitions.
- Điều phối + Khách hàng: cần giữ rule này trong phần điều phối.
- NV Kinh doanh + Quản lý cần xác nhận: thao tác xác nhận booking của sales cập nhật đủ dữ liệu để điều phối nhìn thấy đúng.
- Phản hồi tiến trình B:
- Chốt:

### 5. Hủy tour từ Manager và thông tin hoàn tiền

- Liên quan: manager hủy tour vì không đủ điều kiện/bất khả kháng, booking liên quan chuyển Đã hủy, hoàn 100%, chi tiết đơn hủy từ manager không hiện phần Thông tin hoàn tiền.
- File có khả năng giao nhau: `backend/src/routes/tour-instances.ts`, `backend/src/routes/bookings.ts`, customer booking detail, sales booking detail.
- Điều phối + Khách hàng: customer cancelled booking/refund bill display đã nằm trong live E2E.
- NV Kinh doanh + Quản lý cần xác nhận: manager cancellation cascade và sales detail đúng rule mới.
- Phản hồi tiến trình B:
- Chốt:

### 6. Fixture/reset dữ liệu test

- Liên quan: `/dev/reset-booking-fixtures`, dữ liệu Docker, public schedule `DS001-4`, booking mẫu B009/B014.
- Điều phối + Khách hàng: live E2E đang reset fixture trước mỗi test; fixture đã được chỉnh để `DS001-4` còn bookable theo ngày hiện tại.
- NV Kinh doanh + Quản lý cần xác nhận: các test sales/manager không phụ thuộc vào dữ liệu cũ đã hết hạn hoặc bị auto-cancel.
- Phản hồi tiến trình B:
- Chốt:

## Cần user quyết định

- EmailJS hiện báo `Subscription Limitation` khi thêm Dynamic Attachment. Nếu bắt buộc email hoàn tiền phải đính kèm ảnh bill lớn trực tiếp trong mail, cần nâng gói EmailJS hoặc chuyển sang lưu bill bằng URL public/signed URL để template nhúng ảnh qua link; hiện tại backend không nhét base64 lớn vào EmailJS để tránh mail fail.

## Nhật ký xác nhận

- 2026-04-29: Tiến trình A ghi file consensus, đánh dấu các điểm giao nhau cần tiến trình B review.
- 2026-04-29: Tiến trình A cấu hình EmailJS template, gửi mail test thật qua `queueEmail()` với kết quả EmailJS History `OK`, backend build pass, backend test pass `56/56`, live E2E Điều phối + Khách hàng pass `20/20` sau rebuild backend Docker.
- 2026-04-29: Session hiện tại nhận toàn quyền kiểm tra cả hai phạm vi. Đã xác nhận các cụm: backend test `57/57`, backend build pass, frontend lint pass, frontend build pass, UI surface audit `35/35`, live regression lớn `34/34`, sales/manager suite `31/31`, user journey/role hardening `6/6`, feedback/customer/manager mixed suite `17/17`, coordinator suites đã pass theo từng cụm. Đã sửa seed `SV-TEAM` để không sinh lại dữ liệu tiếng Việt lỗi dấu và cập nhật DB Docker hiện tại cho bản ghi này.
- 2026-04-29: Bổ sung `docs/07-YEU-CAU-NGUYEN-VAN-USER.md` làm nguồn nguyên văn lời user, có cấu trúc theo role/batch để tránh nhầm giữa NV Điều phối, Khách hàng, NV Kinh doanh, Quản lý và các rule chung.
