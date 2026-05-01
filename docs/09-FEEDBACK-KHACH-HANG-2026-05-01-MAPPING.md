# Feedback khách hàng 2026-05-01 - Mapping phát sinh

Tài liệu này ghi batch feedback mới sau đợt fix trước. Feedback mới là nguồn ưu tiên; feedback cũ chỉ dùng để xác định ngữ cảnh và vùng code liên quan khi sửa/test.

## Quy ước kiểm tra

- FE: thao tác thật trên giao diện liên quan bằng Playwright/manual browser khi có luồng UI.
- BE: kiểm tra route/service/test backend tương ứng.
- DB: kiểm tra trạng thái ghi nhận qua Prisma/API dev/email-outbox hoặc dữ liệu trả từ DB.
- Layout/UTF-8: sau mỗi cụm sửa cần build/test và kiểm tra text tiếng Việt không mojibake, không vỡ responsive ở màn liên quan.

## NV điều phối

| ID | Feedback mới | Mapping feedback cũ | Vùng sửa/test |
| --- | --- | --- | --- |
| CO-01 | Thêm số lượng khách tối đa, ảnh minh họa tour, số lượng khách tối thiểu mặc định 10. | Datepicker, giá bao gồm/không bao gồm, ảnh minh họa tour. | TourProgramWizard, TourProgramDetail, tour-program API/public content, create/edit E2E. |
| CO-02 | Xem chi tiết hiển thị sai so với dữ liệu nhập; vé tham quan giá chung note "Không có" không lấy đơn giá; dịch vụ khác lọc bỏ dịch vụ đã chọn; tỷ lệ lợi nhuận/giá HDV không refresh về 0; số đêm 0 thì phụ thu phòng đơn = 0. | Giá và cấu hình, lọc khách sạn theo sao, popup tour trùng, giá HDV refresh. | TourProgramPricingTables, TourProgramWizard, detail screen, pricing preview. |
| CO-03 | Edit chương trình đang hoạt động chỉ có 3 tab như detail; chỉ mở sửa mô tả, giá bao gồm, giá không bao gồm, hạn đặt tour, mô tả lịch trình. | Trạng thái chương trình tour và luồng detail/edit. | TourProgramEdit, TourProgramWizard/detail active edit mode. |
| CO-04 | Bỏ số khách dự kiến; cho sửa giá bán và hạn đặt tour; popup danh sách tour trùng đè lên bảng. | Giá và cấu hình + popup overlap. | TourProgramWizard preview/manual pricing, tooltip/popover rendering. |
| CO-05 | Quy tắc tour chỉ hiển thị tour quanh năm; sửa selectedDates của tour mùa lễ/quanh năm; giá vốn theo ngày; khi cảnh báo -> đủ thì xóa warningDate; group request theo saleRequest.id. | Tour rules: trạng thái từ chối bán, coverage, cảnh báo, hủy tour, một request cho nhiều tour. | TourGenerationRules, tour-program persist payload, tour-instance payload. |
| CO-06 | Dự toán: dịch vụ báo giá không có bút sửa giá; chi phí khác không chọn trùng; UI giống tab dự toán nhận điều hành; số lượng người/phòng loại booking đã hủy. | Dự toán kế thừa dự toán giá, bảng giá, hover nhà cung cấp. | TourEstimate, TourReceiveDispatch parity, booking stats. |
| CO-07 | Phân công HDV chưa nhận email; phải test thật email tới linhthaitu22@gmail.com và tìm root cause. | Phân công HDV gửi mail + tách file. | TourInstances dispatch, email-outbox/EmailJS, guide email flow. |
| CO-08 | Vé tham quan bỏ trường đơn vị và hình thức giá, tự động đơn vị Vé, giá niêm yết. | Service quoted/listed UI. | ServiceList FE, services API normalization. |
| CO-09 | Thêm mới khách sạn không điền sẵn đơn giá. | Supplier detail/edit price table. | Suppliers FE, suppliers API/service variants. |
| CO-10 | Tab đang khởi hành: mở rộng bảng giá đang sử dụng giống dự toán; nhà cung cấp hover chưa hiện thông tin. | Read-only estimate tabs in running/completed tours. | TourInstances read-only detail/estimate render. |

## Nhân viên kinh doanh

| ID | Feedback mới | Mapping feedback cũ | Vùng sửa/test |
| --- | --- | --- | --- |
| SA-01 | Quá 24h không xác nhận yêu cầu hủy thì chuyển từ Cần xác nhận hủy sang Đã xác nhận, không sang Đã hủy. | Pending cancel ordering/auto handling. | booking-lifecycle backend, SalesBookings tabs. |
| SA-02 | Xác nhận booking gửi email có nội dung đơn + hành khách; deposit quá hạn trước 7 ngày hủy với refundStatus hoàn thành; chỉ đưa sang điều hành/dự toán/danh sách khách khi tour đủ điều kiện, hết hạn đặt, sales xác nhận hết booking. | Email xác nhận booking, payment rules, operation handoff. | bookings routes, email-outbox, lifecycle jobs, coordinator estimate/manifest. |
| SA-03 | Quản lý hủy tour hoặc hủy không đủ điều kiện: booking đã xác nhận -> đã hủy, lý do Bất khả kháng, người/thời điểm xác nhận là quản lý, refundStatus cần hoàn, số tiền cần hoàn = tổng đã thanh toán, không hiện thông tin hoàn tiền trong detail. | Manager cancel tour and underfilled cancellation. | tour-instances cancel API, SalesBookingDetail conditional UI, refund status mapping. |
| SA-04 | Đơn hoàn 0đ vào Đã hủy phải là Đã hoàn; upload/sửa bill hoàn tiền phải lưu bill mới và gửi email đúng variant kèm bill. | Refund upload email. | bookings refund route, email-outbox, sales cancelled tab/detail. |

## Quản lý

| ID | Feedback mới | Mapping feedback cũ | Vùng sửa/test |
| --- | --- | --- | --- |
| MA-01 | Voucher sắp diễn ra lưu DB là Upcoming; khách chỉ áp dụng khi Active và tour thuộc chương trình áp dụng; tiền mặt hiển thị đúng 100,000; tạo voucher không sinh 2 dòng. | Voucher BE thiếu, trạng thái voucher. | Prisma VoucherStatus, vouchers routes, sales/manager voucher UI/store. |
| MA-02 | Duyệt dự toán: có nút Từ chối; yêu cầu sửa chuyển trạng thái và lưu nội dung yêu cầu sửa; duyệt xong redirect về tab chờ duyệt dự toán, không duyệt lại. | Estimate approval missing data. | ManagerTourEstimateApproval, tour-instance estimate approval API/UI. |
| MA-03 | Duyệt chương trình tour xong tour previews mở bán luôn, không chờ duyệt bán; loại tour trong khoảng hủy nếu điểm khởi hành/tham quan thuộc phạm vi hủy. | Program approval and cancellation coverage. | AdminTourProgramApproval, tour-program approve route, tour rules cancellation filter. |

## Khách hàng

| ID | Feedback mới | Mapping feedback cũ | Vùng sửa/test |
| --- | --- | --- | --- |
| CU-01 | Chi tiết tour: ảnh bị tràn; icon lịch trình lệch. | Bento grid/lightbox/icon alignment. | TourDetail layout responsive. |
| CU-02 | Checkout draft: nút Khôi phục/Đặt mới; booking cũ đã hủy thì xóa draft; booking thành công gửi mail; passenger form gọn; bỏ số phòng ở card phải. | LocalStorage draft, booking success email, checkout layout. | BookingCheckout, bookings API/email, payment success. |
| CU-03 | Sai email/họ tên phải báo lỗi cụ thể, không chỉ Invalid booking payload. | Booking payload validation. | bookings route validation + FE error mapping. |
| CU-04 | Lịch sử đặt tour tab Đã hủy xem được ảnh bill hoàn tiền. | Customer cancelled history bill. | BookingHistory/BookingDetail. |
| CU-05 | Trang tours: đổi màu chữ xanh, banner một dòng và đổi ảnh; tour theo điểm đến dùng ảnh vùng miền; nút Đặt ngay tour nội địa vào chi tiết. | Home/tour list visual polish. | TourList/Landing public UI. |
| CU-06 | Sau khi cập nhật slot, khách vẫn được giảm số lượng hợp lệ, chỉ chặn vượt slot. | Slot validation checkout. | BookingCheckout passenger count validation. |

## Kết quả xử lý batch này

- CO-01/CO-02/CO-03/CO-04: Đã cập nhật wizard/detail chương trình tour cho ảnh minh họa, số khách tối đa, tối thiểu mặc định 10, active-edit 3 tab, dữ liệu xem chi tiết/pricing, giá chung vé tham quan, lọc trùng dịch vụ khác, không reset tỷ lệ lợi nhuận/giá HDV, số đêm 0 không tính phụ thu phòng đơn.
- CO-05: Đã giới hạn Quy tắc tour chỉ cho tour Quanh năm, sửa selectedDates theo loại tour, group request theo saleRequest.id, dùng preview pricing theo ngày, xóa warningDate khi đủ coverage, tạo unchecked preview ở trạng thái Từ chối bán và lọc phạm vi hủy.
- CO-06/CO-10: Đã chỉnh dự toán loại booking hủy khỏi số người/phòng, không hiện bút giá cho dịch vụ Báo giá/vận chuyển, chặn chọn trùng chi phí khác, giữ hover nhà cung cấp ở tab read-only.
- CO-07: Đã test email thật tới `linhthaitu22@gmail.com`; hệ thống có queue `booking_created` nhưng EmailJS trả `426 Monthly request quota exceeded`, nên root cause chưa nhận email là hết quota EmailJS. Luồng HDV đã test bằng `guide_assignment` với domain `.test` để không đốt quota, email outbox có đủ file thông tin chung và danh sách khách.
- CO-08/CO-09: Đã ép Vé tham quan luôn đơn vị Vé/giá niêm yết, ẩn trường đơn vị/hình thức giá; thêm khách sạn không tự điền sẵn đơn giá.
- SA-01/SA-02/SA-03/SA-04: Đã sửa lifecycle hủy quá 24h về Đã xác nhận, deposit quá hạn trước 7 ngày hủy với refundStatus hoàn thành, manager cancel set lý do Bất khả kháng/người-thời điểm xác nhận/refund cần hoàn, đơn 0đ là đã hoàn, email booking/cancel/refund có payload chi tiết và bill.
- MA-01/MA-02/MA-03: Đã thêm VoucherStatus UPCOMING, approve voucher tương lai -> Upcoming, parse tiền mặt 100.000/100,000 đúng 100000, bỏ duplicate optimistic row, duyệt dự toán có Từ chối/redirect/khóa xử lý lại; sau request-edit direct URL không còn nút duyệt/từ chối và hiển thị lý do quản lý yêu cầu. Approve chương trình tạo tour Đang mở bán và lọc phạm vi hủy.
- CU-01/CU-02/CU-03/CU-05/CU-06: Đã sửa gallery tràn/icon lịch trình, checkout draft modal Khôi phục/Đặt mới, xóa draft booking đã hủy, form hành khách gọn, bỏ số phòng card phải, lỗi email/tên cụ thể, tour list có hero ảnh thật, headline “Khám phá Việt Nam” một dòng, search giữa banner, destination cards dùng ảnh vùng miền, Đặt ngay vào detail, slot cho phép giảm sau khi lỗi vượt chỗ.
- CU-04: Đã xác nhận trên DB local thật và browser customer `/customer/bookings` tab Đã hủy có `Xem bill hoàn tiền` cho booking có bill.

## Kiểm tra đã chạy

- Docker stack thật: `travela-db` Postgres 5432 healthy, `travela-backend` 4000 healthy, `travela-frontend` 8080 running.
- DB: `npm run prisma:push` và `npm run prisma:seed` đã chạy thành công sau khi bật lại Docker/Postgres; seed bổ sung `TI011` để URL feedback `scheduleId=TP001-TI011` chạy đúng.
- BE: `npm test` trong `backend`: 13 file, 60 test passed.
- BE: `npm run build` trong `backend`: passed.
- FE: `npm run lint` trong `frontend`: passed.
- FE: `npm run build` trong `frontend`: passed.
- Docker build: `docker compose up -d --build backend frontend` passed; healthcheck backend OK, frontend 8080 trả 200.
- API/DB E2E: tạo booking public `TP001-TI011`, sales confirm, voucher future -> Upcoming, active voucher chỉ áp dụng khi Active, manager request-edit dự toán, manager cancel tour tương lai, refund bill upload, guide assignment email outbox. Các email domain `.test` được `SENT` kèm `emailSkipped=true`; email thật tới `linhthaitu22@gmail.com` fail đúng root cause EmailJS quota 426.
- Browser FE/BE/DB: đã kiểm tra `/tours` desktop/mobile không overflow, Đặt ngay vào detail; detail tour không tràn ảnh và thấy lịch `TP001 - TI011`; checkout tạo booking thật vào DB; coordinator active edit 3 tab `Bước 1 / 3`; tour rules chỉ hiển thị Quanh năm; dự toán TI009 có vận chuyển/khách sạn/ăn/tham quan/chi phí khác và loại booking hủy khỏi thống kê; services/suppliers add modal đúng trường; manager estimate direct URL sau request-edit bị khóa action; sales cancelled tab và customer cancelled bill hoạt động.
- UTF/layout: scan code/seed không còn chuỗi seed tiếng Việt lỗi `?`; các pattern mojibake còn lại chỉ là test intentional cho normalizer/email-outbox.
