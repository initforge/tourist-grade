# Feedback Backlog Nguyên Văn

File này là nguồn tham chiếu cho batch feedback khách hàng. Nội dung phải giữ tiếng Việt có dấu, không để mojibake.

Nguồn lưu nguyên văn lời user theo role và theo batch: `docs/07-YEU-CAU-NGUYEN-VAN-USER.md`.
File này dùng để chuẩn hóa checklist triển khai/test, không thay thế file nguyên văn.

## Quy tắc làm việc bắt buộc

```text
1. Làm đúng nhiệm vụ, không làm hoặc không đụng tới các tính năng, giao diện không liên quan.
2. Test phải test theo luồng, không test rời rạc ở những điểm mới sửa. Mọi thứ liên quan luồng, có thể dính dáng ở role khác hoặc tất cả những thứ có liên kết đều phải test hết.
3. Làm việc và test tuần tự theo từng thứ tự task được giao. Không móc nối tùy tiện giữa các task.
4. Nếu có các task thực sự liên quan nhau thì test đơn lẻ xong rồi gom các luồng liên quan test thêm một lần nữa.
5. Nếu cần thông tin, credential, dữ liệu hoặc quyết định nghiệp vụ để hoàn thành tính năng thì phải hỏi rõ, cấm im lặng.
6. Các thay đổi phải tối ưu và test căng, không chỉ dừng ở mức “luồng hiện tại chạy được”.
7. Chỉ xử lý đúng phạm vi role được giao để tránh xung đột với tiến trình khác.
```

## Phạm vi hiện tại

```text
Bây giờ đang có một tiến trình Codex khác lo NV kinh doanh + Quản lý.
Tiến trình này tập trung NV Điều phối + Khách hàng.
```

## NV Điều Phối

### 1. Thêm mới chương trình tour - Thông tin chung

URL: `http://localhost:8080/coordinator/tour-programs/create`

```text
- Nếu số đêm = 0 thì không hiện Tiêu chuẩn lưu trú.
- Điểm khởi hành và Điểm tham quan không được trùng nhau:
  + Khi chọn Điểm khởi hành: Loại bỏ điểm này khỏi danh sách chọn của Điểm tham quan.
  + Khi chọn Điểm tham quan: Loại bỏ các điểm đã chọn khỏi danh sách Điểm khởi hành.
- Với loại tour quanh năm, Datepicker cần hỗ trợ sao cho cuộn mượt và nhanh. Khi người dùng cuộn, phải hiển thị rõ tháng hiện tại đang được focus (sticky header), tương tự lịch hệ thống.
- Mỗi ngày trong danh sách ngày dự kiến có nút “X” đi kèm, cho phép người dùng xóa ngày đó khỏi danh sách.
- Lỗi khi validate cần hiển thị kiểu popup hoặc toast message, không được im lặng bắt người dùng tự lướt lên mới thấy lỗi.
```

### 2. Thêm mới chương trình tour - Giá và cấu hình

URL: `http://localhost:8080/coordinator/tour-programs/create`

```text
- Nếu số đêm = 0 thì không hiển thị phần khách sạn.
- Đơn giá của HDV không tự động điền, yêu cầu nhập.
- Danh sách khách sạn để chọn phải lọc dựa trên hạng sao = tiêu chuẩn lưu trú.
- Không nên có cột Tên khoản mục; dòng thông tin khoản mục nên hiển thị theo nhóm cho Vận chuyển, Khách sạn, Dịch vụ ăn uống và Vé tham quan.
- Các cột Thành tiền / Đơn giá áp dụng phải sửa khớp với từng loại dịch vụ:
  + Vận chuyển, Dịch vụ ăn uống, Vé tham quan: Đơn giá. Nếu vé tham quan thiết lập giá theo độ tuổi thì lấy giá Người lớn.
  + Khách sạn: Thành tiền.
- Phần Vận chuyển không có cột Thông tin mà có cột Dịch vụ.
- Cách xác định dịch vụ vận chuyển:
  + Lấy danh sách dịch vụ vận chuyển của nhà cung cấp đã chọn.
  + Lọc các dịch vụ có số chỗ >= số lượng khách dự kiến.
  + Trong các dịch vụ thỏa điều kiện, chọn dịch vụ có số chỗ nhỏ nhất.
  + Nếu không có dịch vụ nào đủ chỗ thì báo lỗi hoặc yêu cầu chọn phương án khác, ví dụ nhiều xe.
- Ở phần Vé tham quan và Dịch vụ ăn uống:
  + Không cho phép chọn trùng một dịch vụ đã có trong danh sách.
  + Nếu dịch vụ đã được chọn ở một khoản mục trước đó thì dịch vụ đó không được chọn lại ở khoản mục khác.
- Vé tham quan không có cột mặc định; mặc định tất cả vé tham quan đều được tính phí, vẫn giữ nhóm ngày để tính phí theo ngày.
- Chi phí khác đang thiếu mặc định Bảo hiểm du lịch.
- Dịch vụ ăn uống mở popup không ra các dịch vụ ăn uống của nhà hàng vì khi tạo dịch vụ ăn không đánh isMealService, nhưng lọc dịch vụ ăn lại theo isMealService.
```

### 3. Trạng thái chương trình tour ở tab Nháp

```text
- Chương trình sau khi gửi duyệt ở trạng thái Chờ duyệt.
- Chương trình tour khi bị từ chối duyệt ở trạng thái Từ chối duyệt. Sau khi chỉnh sửa xong ấn Gửi duyệt mới chuyển trạng thái Chờ duyệt.
- Chỉ có chương trình tour vừa mới tạo xong ấn Lưu nháp thì mới ở trạng thái Nháp.
- Cả 3 trạng thái Chờ duyệt, Nháp và Từ chối duyệt đều nằm ở tab Nháp.
- Chỉ có chương trình tour trạng thái Chờ duyệt mới hiện ở màn Chờ duyệt của Quản lý.
```

### 4. Duyệt chương trình mới

```text
- Khi tạo và duyệt thành công chương trình mới, web bị crash trắng màn với lỗi Cannot read properties of undefined (reading 'adult').
- Khi xóa bản ghi chương trình tour vừa tạo thì hết lỗi.
- Sau khi duyệt chương trình tour, hệ thống chưa tự tạo tour từ previews.
```

## Khách Hàng

### 1. Trang chi tiết tour

URL: `http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao`

```text
- Ảnh vỡ.
- Thông tin lịch khởi hành lấy từ DB với những tourInstance có status DANG_MO_BAN và chưa đến bookingDeadlineAt.
- Tour hết hạn đặt thì không được hiện ở màn khách.
- Icon chỗ lịch trình chi tiết bị lệch.
```

### 2. Trang Đặt tour

URL: `http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-4`

```text
Lỗi quan trọng ảnh hưởng nhiều chức năng:
- Dữ liệu booking bị lưu trong Local Storage.
- Sau khi đặt tour thành công, thanh toán thành công, thoát khỏi đơn booking, vào lại đúng tour và đúng lịch khởi hành thì đang hiển thị thông tin đơn cũ và không thể đặt booking mới.
- Đăng nhập tài khoản khách thứ hai nhưng vẫn tự điền thông tin booking của người thứ nhất.
- Mong muốn: tạo được booking mới, không dùng lại dữ liệu của người khác.

Booking thành công:
- Booking thành công chưa có mail về cho khách.

Giao diện:
- Thông tin hành khách để bố cục như demo trước.
- Thể hiện Người lớn / Trẻ em / Em bé, mỗi loại hành khách tính từ 1.
- Ví dụ: Người lớn 1, Người lớn 2, Trẻ em 1. Không được là Trẻ em 3.
```

### 3. Lịch sử đặt tour

URL: `http://localhost:8080/customer/bookings`

```text
- Tab Đã hủy: chưa xem được ảnh bill hoàn tiền.
```

### 4. Tổng tiền tính sai

```text
Bước tái hiện:
1. Đặt tour với số lượng khách tối đa, ví dụ chỗ trống = 2.
2. Điền đầy đủ thông tin hành khách tại mục 1. Thông tin.
3. Nhấn Tiếp tục thanh toán sang mục 2. Thanh toán.
4. Nhấn Quay lại sửa đơn để quay lại mục 1. Thông tin và chỉnh sửa thông tin.
5. Nhấn Tiếp tục thanh toán sang mục 2. Thanh toán.
6. Áp mã giảm giá và quan sát tổng tiền.

Kết quả hiện tại:
- Tại mục 1. Thông tin hiển thị chỗ trống = 4, sai.
- Sai giá trị giảm giá, sai tổng tiền, đôi khi thông báo sai số lượng.
- PayOS vẫn tính đúng số tiền thanh toán.

Kết quả mong muốn:
- Hiển thị đúng chỗ trống.
- Hiển thị đúng số tiền khi thay đổi số lượng và mã giảm giá.
```

### 5. Tour yêu thích

```text
- Các tour trong danh sách tour yêu thích, nếu sắp hết slot (< 5) hoặc có giảm giá thì email nhắc nhở khách.
```

### 6. Tra cứu đơn đặt tour

```text
- Hiện tại: Xem chi tiết của đơn đặt bắt phải đăng nhập.
- Mong muốn: Không cần đăng nhập vẫn xem được chi tiết đơn đặt.
```

## Quy tắc liên quan điều phối tour sau khi booking được xác nhận

```text
Quy tắc nhảy sang màn Điều hành tour / Chờ dự toán / Danh sách hành khách:
- Khi tour đủ điều kiện khởi hành.
- Và hết hạn đặt tour.
- Và NV kinh doanh xác nhận hết các booking của tour ấy.
- Thì danh sách hành khách mới của tour mới hiện trong màn Danh sách hành khách.
```

## Ghi chú kiểm thử hiện tại

```text
- Không chạy bừa các live test có gọi /dev/reset-booking-fixtures nếu chưa xác nhận, vì endpoint này xóa và dựng lại dữ liệu fixture.
- Khi cần E2E thật, ưu tiên kiểm tra bằng browser/API không phá dữ liệu Docker hiện tại.
- Nếu phải reset fixture để test thì báo rõ trước.
```
