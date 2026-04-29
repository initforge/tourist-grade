# Yêu Cầu Nguyên Văn Từ User

File này lưu nguyên văn các yêu cầu đã được giao để làm nguồn tham chiếu khi nhận task mới. Không sửa nghĩa, không diễn giải lại nghiệp vụ trong file này.

## Quy Tắc Làm Việc Nguyên Văn

```text
Ok bây h t sẽ tổng hợp feedback của khách khắc cốt ghi tâm 3 điều sau :
1. Làm đúng nhiệm vụ, không làm hoặc không đụng tới các tính năng, giao diện không liên quan
2. Test phải test theo luồng, không test rời rạc ở những điểm mới sửa mà mọi thứ liên quan luồng, có thể dính dáng ở role khác hoặc tất cả những thứ có liên kết đều phải test hế
3. Làm việc và test tuần tự theo từng thứ tự task t đưa không có móc nối với nhau hay sao hết làm việc theo từng task t đưa
Nếu có các task thực sự liên quan nhau thì test đơn lẻ xong rồi gom các luồng liên quan test thêm 1 lần nữa
```

```text
CẦN GÌ ĐỂ HOÀN THÀNH TÍNH NĂNG THÌ HỎI T CHỨ CẤM IM LẶNG
```

```text
Tiếng Việt phải có dấu đàng hoàng
```

```text
Cứ test bthg đi và xem cách dữ liệu phản ứng ok chưa, xem xét mọi case và mọi yêu cầu t nói chỉnh sửa
```

```text
Luồng hiện tại đã chạy được là chưa đủ với t mà tất cả phải tối ưu, test phải cực căng đẩy mức khó
Test tuần tự lại và review lại tất cả những cái m đã làm
```

```text
vcl vậy thì tách nó ra đi lúc nào cần mới chạy thôi, cả trong script setup nữa
```

## Batch Ban Đầu - NV Điều Phối

```text
Đầu tiên đến với Role nhân viên điều phối :
1. http://localhost:8080/coordinator/tour-programs/create
"Thêm mới chương trình tour - thông tin chung
- Nếu số đêm =0 thì ko hiện Tiêu chuẩn lưu trú
- Điểm khởi hành và Điểm tham quan không được trùng nhau:
+ Khi chọn Điểm khởi hành: Loại bỏ điểm này khỏi danh sách chọn của Điểm tham quan
+ Khi chọn Điểm tham quan: Loại bỏ các điểm đã chọn khỏi danh sách Điểm khởi hành
- Với loại tour quanh năm, Datepicker cần hỗ trợ sao cho cuộn mượt và nhanh. Khi người dùng cuộn, phải hiển thị rõ tháng hiện tại đang được focus (sticky header), tương tự lịch hệ thống-[Image #1]
- Mỗi ngày trong danh sách ngày dự kiến có nút “X” đi kèm, cho phép người dùng xóa ngày đó khỏi danh sách.
- Lỗi khi validate cần hiển thị kiểu popup hoặc toast message chứ ko phải kiểu im im đợi lướt lên mới thấy lỗi"

2. http://localhost:8080/coordinator/tour-programs/create
"Thêm mới chương trình tour - lịch trình
- Nếu số đêm =0 thì ko hiển thị phần Địa điểm lưu trú (vì ko có lưu trú)
- Lỗi khi validate cần hiển thị kiểu popup hoặc toast message chứ ko phải kiểu im im đợi lướt lên mới thấy lỗi"
```

## Batch Ban Đầu - NV Kinh Doanh

```text
Tiếp theo là nhân viên kinh doanh :
1. http://localhost:8080/sales/bookings?tab=completed
Trang Quản lý booking/ Tab Hoàn thành, khi ngày khởi hành + thời gian tour tức ngày kết thúc của tour đã qua thì chuyển những đơn nào đặt tour ấy có trạng thái Đã xác nhận thành Hoàn thành

2. http://localhost:8080/manager/tours
"- Khi NV kinh doanh xác nhận hủy thành cồng thì  hệ thống chưa gửi mail cho khách hàng thông báo Yêu cầu hủy đã được xác nhận.
- Khi Quản lý hủy tour bên màn Quản lý tour/ Không đủ điều kiện khởi hành   thì các booking liên quan sẽ bị hủy, chuyển trạng thái từ Đã xác nhận thành Đã hủy với  lý do hủy là Không đủ điều kiện khởi hành và Số tiền hoàn là 100%. Ở chi tiết những đơn hủy (đến từ phía Quản lý) thì sẽ k có phần Thông tin hoàn tiền. Quy tắc tải ảnh hoàn lên như hiện tại là đúng r ạ.
- Khi Quản lý hủy tour trong TH thiên tai bất khả kháng  thì các booking liên quan sẽ bị hủy, chuyển trạng thái từ Đã xác nhận thành Đã hủy với  lý do hủy là Bất khả kháng và Số tiền hoàn là 100%. Ở chi tiết những đơn hủy (đến từ phía Quản lý) thì sẽ k có phần Thông tin hoàn tiền. Quy tắc tải ảnh hoàn lên như hiện tại là đúng r ạ. "

3. "Khi Quản lý phê duyệt voucher, voucher đó ở màn Quản lý voucher của NV kinh doanh phải được chuyển từ trạng thái ""Chờ phê duyệt"" sang ""Sắp diễn ra"".
Nếu Quản lý từ chối voucher, voucher đó ở màn Quản lý voucher của NV kinh doanh phải được chuyển từ trạng thái ""Chờ phê duyệt"" sang ""Không được phê duyệt "" kèm theo lý do không phê duyệt trong màn Chi tiết voucher. "

4. http://localhost:8080/sales/bookings/cmoisdlzi0011o646uqaiksnq?tab=cancelled
"Trang Quản lý booking/ Đơn Đã hủy/ Chi tiết đơn Đã hủy
- Hoàn tiền lỗi. VD ảnh nhỏ-[Image #2]  thì tải lên được, ảnh lớn-[Image #3]  thì k được.
- Khi nhân viên tải ảnh hoàn tiền lên và ấn Lưu thành công,  khách hàng chưa nhận được email thông báo hoàn tiền thành công.Trong mail cần phải có thông tin đơn hủy, thông tin về số tiền được hoàn và ảnh bill hoàn tiền.
- Khi nhân viên chỉnh sửa ảnh bill hoàn tiền, ảnh bill chuyển khoản mới được lưu trong hệ thống và khách hàng nhận được email thông báo cập nhật bill chuyển khoản hoàn tiền kèm ảnh bill mới.
Phần người hoàn tiền trong chi tiết đơn Đã hủy cần lưu thông tin người hoàn và thời điểm hoàn ở lần sửa gần nhất (hiện tại đang để thông tin người hoàn ở lần hoàn đầu tiên) nên Bỏ cột refundBillEditedat và refundBillEditedBy trong db. Thông tin người hoàn đã lưu ở refundBillat và refundBillBy r. "

5. Đơn nào mà chưa thanh toán thì sẽ chuyển thông tin đơn sang trang Quản lý booking (Cần xác nhận đặt) nhưng trạng thái thanh toán là Chưa thanh toán. Nếu sau 15p mà k thanh toán thì đẩy sang tab Đã hủy với lý do Quá hạn thanh toán giữ chỗ. Khi sang tab đã hủy thì trạng thái hoàn tiền để là Hoàn thành luôn.
```

## Batch Ban Đầu - Khách Hàng

```text
TIếp theo là khách hàng :
1.http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao
"Trang chi tiết tour
1. Ảnh lỗi, vỡ bố cục
2. Thông tin lịch khởi hành lấy từ DB với những tourInstance có status là DANG_MO_BAN

5. Giao diện
- Thẻ thông tin đặt tour bên phải giữ nguyên vị trí khi scroll down như web này-https://travel.com.vn/chuong-trinh/nha-trang-ben-du-thuyen-ana-marina-vinh-nha-trang-bai-tranh-dao-robinson-i-resort-pid-9902, thẻ đặt tour ở màn đặt tour/thanh toán cố định tương tự
- Icon chỗ lịch trình chi tiết bị lệch
"

2. "Nút Xem đánh giá chưa hoạt động đúng
- Hiện tại: Khi nhấn nút Xem đánh giá => giao diện chi tiết đơn
- Mong muốn: Khi nhấn nút Xem đánh giá => popup đánh giá với nội dung đã đánh giá, không thể sửa"

3. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-4
"Trang Đặt tour
Lỗi 1( QUAN TRỌNG ảnh hưởng nhiều chức năng): Dữ liệu booking bị lưu trong Local Storage => lỗi mỗi khi vào đặt tour đó
Các bước thực hiện:
1. Đặt tour thành công ( thanh toán thành công), thoát khỏi đơn booking ( bao gồm thoát ra trang chủ, tải lại trang, đăng xuất đều vậy)
2. Vào đặt lại đúng tour và đúng lịch khởi hành đó
Kết quả Hiện tại: Hiển thị các thông tin của đơn đặt hàng cũ và không thể đặt booking mới với cùng ngày khởi hành
KQ Mong muốn: Tạo được booking mới

Lỗi 2: Booking thành công chưa có mail về cho khách

Lỗi 3: Giao diện
- Thông tin hành khách để bố cục như demo trước ấy a, thể hiện được người lớn/trẻ em/em bé . Mỗi loại hành khách tính từ 1. Ví dụ NGười lớn 1, Người lớn 2,  Trẻ em 1 ( Hiện tại đang để Người lớn 1, Người lớn 2, Trẻ em 3)
[Image #4] ,[Image #5] "

3. http://localhost:8080/customer/bookings
"Lịch sử đặt tour
2. Tab Đã hủy: chưa xem được ảnh bill hoàn tiền
"

4. Trang chủ hiển thị nhiều thông tin rác

5. "Tổng tiền tính sai
1. Đặt tour với số lượng khách tối đa ( chỗ trống =2)
2. Điền đầy đủ thông tin hành khách tại mục 1. Thông tin  => Nhấn btn Tiếp tục thanh toán => Sang mục 2. Thanh toán
3. Nhấn btn Quay lại sửa đơn để quay lại mục 1 THông tin và chỉnh sửa thông tin => Nhấn Tiếp tục thanh toán => Sang 2. Thanh toán
4. Áp mã giảm giá, quan sát tổng tiền
Kết quả hiện tại
1. Tại mục 1, Thông tin, hiển thị chỗ trống =4 ( SAI)
2. Sai giá trị giảm giá, sai tổng tiền, đôi khi thông báo sai số lượng như hình bên phải
3. Tuy nhiên payos vẫn tính đúng số tiền thanh toán
Kết quả mong muốn: Hiển thị đúng số chỗ trống, đúng số tiền khi thay đổi số lượng và mã giảm giá [Image #6] [Image #7] "

4. "Tra cứu đơn đặt tour:
- Hiện tại: Xem chi tiết của đơn đặt bắt phải đăng nhập
- Mong muốn: Không cần đăng nhập vẫn xem được chi tiết đơn đặt"
```

## Feedback Căng Sau Push - Nguyên Văn

```text
1. [Image #1] trang chi tiết đơn đang bị lỗi font, chỉnh - audit và rules cứng để nhớ (/memories) sau này dell bao h gặp lại nữ
2. [Image #2] dòng 28 phải có mail trả vể cho khách hàng nhma e k nhận được mail ạ
NẾU TRƯỜNG HỢP CẦN GÌ ĐỂ HOÀN THÀNH TÍNH NĂNG THÌ HỎI T CHỨ CẤM IM LẶNG
3. nó vẫn lưu booking-draft tại local storage ấy, em đăng nhập tài khoản khách khác rồi nhưng nó vẫn hiện thông tin đặt hàng của đơn cũ a ạ
quét các trường hợp tương tự, rules cứng để dell bao h gặp các tính năng đó lại nữa
em đăng nhập tài khoản khách thứ 2 nhưng nó tự điền thông tin booking cua người thứ nhất đây ạ
4. a ơi tour hết hạn đặt r nhma vẫn hiện bên màn khách ạ [Image #3] , [Image #4]
A chỉnh cho e việc tour hết hạn đặt thì k được hiện ở bên màn khách và
Quy tắc nhảy sang màn (Điều hành tour/ Chờ dự toán/ Danh sách hành khách) khi đơn đã được xác nhận như sau:
Khi tour đủ điều kiện khởi hành + hết hạn đặt tour + NV kinh doanh xác nhận hết các booking của tour ấy thì danh sách hành khách mới của tour mới hiện trong màn Danh sách hành khách.
E cảm ơn ạ
5. CÁI CUỐI CÙNG LÀ TẤT CẢ CÁC YÊU CẦU CHỈNH SỬA VÀ FIX LỖI, BẢN BATCH LỚN NHẤT T NÓI TỪ ĐẦU KHÁCH NÓI VỚI T VẪN TIẾP TỤC GẶP LỖI CŨ, ĐIỀN NGUYÊN VĂN NHỮNG GÌ T GHI VÀO : P:\tourist-grade\docs\04-FEEDBACK-BACKLOG-NGUYEN-VAN.md THAY THẾ CÁC LOG CŨ VÀ REVIEW CHI TIẾT LẠI TUẦN TỰ TỪNG CÁI CHO BỐ
GẶP VẤN ĐỀ GÌ THÌ KHAI BÁO RÕ RÀNG
```

## Batch Tập Trung NV Điều Phối + Khách Hàng - Nguyên Văn

```text
Tiếp tục làm việc, bây h t đang chạy 1 tiến trình codex khác lo NV kinh doanh + quản lý, m cứ hoàn thành các task t giao mà có minh chứng khách đưa rõ ràng còn t sẽ đưa các task mới liên quan NV Điều phối + Khách hàng để m tập trung và sửa triệt để, tránh để 2 tiến trình xung đột nhau. nhớ take note ra docs để có cái tham chiếu trong quá trình làm tránh mất context lung tung
NV điều phối :
1. http://localhost:8080/coordinator/tour-programs/create
"Thêm mới chương trình tour - thông tin chung
- Nếu số đêm =0 thì ko hiện Tiêu chuẩn lưu trú
- Điểm khởi hành và Điểm tham quan không được trùng nhau:
+ Khi chọn Điểm khởi hành: Loại bỏ điểm này khỏi danh sách chọn của Điểm tham quan
+ Khi chọn Điểm tham quan: Loại bỏ các điểm đã chọn khỏi danh sách Điểm khởi hành
- Với loại tour quanh năm, Datepicker cần hỗ trợ sao cho cuộn mượt và nhanh. Khi người dùng cuộn, phải hiển thị rõ tháng hiện tại đang được focus (sticky header), tương tự lịch hệ thống-[Image #1] .
- Mỗi ngày trong danh sách ngày dự kiến có nút “X” đi kèm, cho phép người dùng xóa ngày đó khỏi danh sách.
- Lỗi khi validate cần hiển thị kiểu popup hoặc toast message chứ ko phải kiểu im im đợi lướt lên mới thấy lỗi"
2. http://localhost:8080/coordinator/tour-programs/create
"Thêm mới chương trình tour - giá và cấu hình
- Nếu số đêm =0 thì ko hiển thị phần khách sạn
- Đơn giá của HDV ko tự động điền mà yêu cầu nhập
- Danh sách khách sạn để chọn đang không lọc dựa trên hạng sao = tiêu chuẩn lưu trú
- Không nên có cột Tên khoản mục mà dòng thông tin khoản mục nên để kiểu này cho các phần Vận chuyển, Khách sạn, Dịch vụ ăn uống và Vé tham quan
- Các cột Thành tiền / Đơn giá áp dụng phải sửa khớp với từng loại dịch vụ:
+ Vận chuyển, Dịch vụ ăn uống, Vé tham quan: Đơn giá (nếu vé tham quan có thiết lập giá = Theo độ tuổi thì lấy giá của đối tượng là Người lớn)
+ Khách sạn: Thành tiền
- Phần Vận chuyển không có cột Thông tin mà có cột Dịch vụ. Cách xác định dịch vụ như sau:
+ Lấy danh sách dịch vụ vận chuyển của nhà cung cấp đã chọn
+ Lọc các dịch vụ có: Số chỗ ≥ Số lượng khách dự kiến
+ Trong các dịch vụ thỏa điều kiện, chọn: Dịch vụ có số chỗ nhỏ nhất
+ Nếu không có dịch vụ nào đủ chỗ → báo lỗi hoặc yêu cầu chọn phương án khác (vd: nhiều xe)
-Ở phần Vé tham quan và Dịch vụ ăn uống:
+ Không cho phép chọn trùng một dịch vụ đã có trong danh sách.
+ Nếu dịch vụ đã được chọn ở một khoản mục trước đó, thì dịch vụ đó sẽ không được chọn lại ở khoản mục khác.
- Vé tham quan không có cột mặc định, mặc định là tất cả vé tham quan đều được tính phí (vẫn giữ nguyên theo nhóm ngày để tính phí theo ngày)
- Chi phí khác đang bị thiếu mất cái Mặc định có bảo hiểm du lịch
- Dịch vụ ăn uống mở popup không ra các dịch vụ ăn uống của nhà hàng vì khi tạo dịch vụ ăn ko ở nhà hàng ko đánh isMealService mà lọc dịch vụ ăn lại theo isMealService
"
kiểu này là ảnh [Image #2] trong đoạn pasted trên
3. "Về trạng thái của chương trình tour (ở tab nháp)
- Chương trình sau khi gửi duyệt ở trạng thái Chờ duyệt
- Chương trình tour khi bị từ chối duyệt ở trạng thái Từ chối duyệt. Sau khi chỉnh sửa xong ấn Gửi duyệt mới chuyển trạng thái Chờ duyệt
- Chỉ có chương trình tour vừa mới tạo xong ấn lưu nháp thì mới ở trạng thái Nháp
- Cả 3 trạng thái Chờ duyệt, Nháp và Từ chối duyệt đều nằm ở tab Nháp
- Chỉ có chương trình tour trạng thái Chờ duyệt mới hiện màn Chờ duyệt của Quản lý"
4. [Image #3] "Khi tạo và duyệt thành công chương trình mới, web bị crash trắng xóa cả màn với lỗi sau
Biết khi xóa bản ghi chương trình tour vừa tạo thì hết lỗi.
Sau khi duyệt chương trình tour, hệ thống chưa tự tạo tour từ previews"

Tiếp theo là khách hàng :
1. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao
"Trang chi tiết tour
1. Ảnh vỡ
2. Thông tin lịch khởi hành lấy từ DB với những tourInstance có status là DANG_MO_BAN, chưa đến bookingdDeadlineAt ( Anh check lại

5. Giao diện
- Icon chỗ lịch trình chi tiết bị lệch
"
2. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-4
"Trang Đặt tour
Lỗi 1( QUAN TRỌNG ảnh hưởng nhiều chức năng): Dữ liệu booking bị lưu trong Local Storage => lỗi mỗi khi vào đặt tour đó
Các bước thực hiện:
1. Đặt tour thành công ( thanh toán thành công), thoát khỏi đơn booking ( bao gồm thoát ra trang chủ, tải lại trang, đăng xuất đều vậy)
2. Vào đặt lại đúng tour và đúng lịch khởi hành đó
Kết quả Hiện tại: Hiển thị các thông tin của đơn đặt hàng cũ và không thể đặt booking mới với cùng ngày khởi hành
KQ Mong muốn: Tạo được booking mới

Lỗi 2: Booking thành công chưa có mail về cho khách

Lỗi 3: Giao diện
- Thông tin hành khách để bố cục như demo trước

[Image #4] , [Image #5] "

3. http://localhost:8080/customer/bookings
"Lịch sử đặt tour
2. Tab Đã hủy: chưa xem được ảnh bill hoàn tiền
"
4. "Tổng tiền tính sai
1. Đặt tour với số lượng khách tối đa ( chỗ trống =2)
2. Điền đầy đủ thông tin hành khách tại mục 1. Thông tin  => Nhấn btn Tiếp tục thanh toán => Sang mục 2. Thanh toán
3. Nhấn btn Quay lại sửa đơn để quay lại mục 1 THông tin và chỉnh sửa thông tin => Nhấn Tiếp tục thanh toán => Sang 2. Thanh toán
4. Áp mã giảm giá, quan sát tổng tiền
Kết quả hiện tại
1. Tại mục 1, Thông tin, hiển thị chỗ trống =4 ( SAI)
2. Sai giá trị giảm giá, sai tổng tiền, đôi khi thông báo sai số lượng như hình bên phải
3. Tuy nhiên payos vẫn tính đúng số tiền thanh toán
Kết quả mong muốn: Hiển thị đúng chỗ trống, đúng số tiền khi thay đổi số lượng và mã giảm giá"
[Image #6] [Image #7]
5. Các tour trong danh sách  tour yêu thích, nếu sắp hết slot ( <5) hoặc có giảm giá thì email nhắc nhở khách
6. "Tra cứu đơn đặt tour:
- Hiện tại: Xem chi tiết của đơn đặt bắt phải đăng nhập
- Mong muốn: Không cần đăng nhập vẫn xem được chi tiết đơn đặt"

Cần gì hoặc thiếu gì cần t cung cấp thì cứ hỏi, không im lặng, check code lẫn check e2e thật kĩ và tuần tự
Còn rất nhiều vấn đề đang chờ m fix
làm việc phải đảm bảo 100% chứ không có vụ lỗi này xong sinh lỗi kia
Lo đúng phần việc của 2 role t được giao tránh xung đột
Báo cáo rõ ràng ngắn gọn
```

## EmailJS Và Quota - Nguyên Văn

```text
Về các crendentials liên quan email thì m vào web emailJS rồi đăng nhập Elderfate@proton.me - EmailJSID22# rồi tự config tự setup tự test nhé
```

```text
Còn có 69 lượt gửi thư m test ít thôi nhé cỡ 5-9 lượt nữa thôi
```

```text
các thư được gửi đi nhưng chưa config nội dung, audit các case và giải quyết vấn đề này
Thư còn dell có dấu nữa
```

```text
Còn lại nó gửi email phản hồi ntn đây : Message not delivered
Your message couldn't be delivered to khach-fill1@test.vn because the remote server is misconfigured. See technical details below for more information.
The response from the remote server was:
553 Relaying disallowed xem xét thử nó đã gửi email về đúng theo thông tin của khách chưa ? (khách đặt đơn hay thao tác thì gửi đúng email của khách đó)
```

