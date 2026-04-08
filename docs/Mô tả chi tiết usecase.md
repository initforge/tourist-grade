1\. Đặt tour  
1.1. Xem danh sách tour  
1.2. Xem chi tiết tour  
1.3. Tìm kiếm tour

| Tên ca sử dụng | Tìm kiếm tour |
| :---- | :---- |
| **Tác nhân** | Khách hàng |
| **Điều kiện đầu vào** | Tác nhân truy cập vào trang web của Travela |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân truy cập màn hình Trang chủ. Tác nhân nhập thông tin tìm kiếm vào ô “Tìm kiếm tour” (Tên tour / Điểm đến / Thời gian khởi hành). Tác nhân click vào nút “Tìm kiếm”. Hệ thống thực hiện hiện tìm kiếm tương đối theo điều kiện truyền vào Hệ thống hiển thị kết quả: Nếu có thông tin truy vấn phù hợp, hiển thị danh sách tour. Nếu không truy vấn ra thông tin, chuyển đến luồng sự kiện phụ 1\. Luồng sự kiện phụ 1: Luồng phụ 1: Không truy vấn ra thông tin phù hợp: Hệ thống thông báo không tìm thấy tour. |
| **Kết quả trả về** | Danh sách tour theo kết quả truy vấn trả về |

1.4. Đặt tour

| Tên ca sử dụng | Đặt tour |
| :---- | :---- |
| **Tác nhân** | Khách hàng |
| **Điều kiện đầu vào** | Tác nhân truy cập trang web Travela và đã chọn được Tour muốn đặt  |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tại giao diện Chi tiết đặt tour, tác nhân chọn “Lịch khởi hành” mong muốn và nhấn vào nút **“Đặt tour”** Hệ thống hiển thị giao diện nhập thông tin đơn đặt tour: *Nếu đã đăng nhập:* Hệ thống tự động điền thông tin cá nhân nếu có (Họ tên, Email, SĐT, Địa chỉ). *Nếu chưa đăng nhập:* Tác nhân thực hiện điền thủ công các thông tin cá nhân ( Họ tên, Email, SĐT, Địa chỉ) Tác nhân chọn số lượng và điền danh sách hành khách theo phân loại (Người lớn, Trẻ em, Em bé) với các thông tin: Họ tên, Ngày sinh, Giới tính, Nhu cầu phòng đơn. Hệ thống thực hiện kiểm tra tính hợp lệ của thông tin đã nhập (số lượng, định dạng email, số điện thoại, sự tương thích giữa Ngày sinh và Phân loại hành khách). *Nếu thông tin không hợp lệ, chuyển sang Luồng phụ 1\.* Tác nhân chọn 1 trong các hình thức thanh toán: Thanh toán tại văn phòng, Thanh toán qua VNPay, hoặc Thanh toán qua Stripe. Tác nhân nhấn nút **"Xác nhận đặt tour"**. Hệ thống kiểm tra số lượng chỗ trống thực tế tại thời điểm hiện tại: *Nếu tour đã hết chỗ hoặc không đủ số lượng, hệ thống báo lỗi và dừng quy trình.* Hệ thống chuyển hướng tác nhân đến giao diện thanh toán tương ứng (nếu chọn cổng thanh toán online) hoặc chuyển sang hoạt động 10 nếu thanh toán tại văn phòng. Tác nhân thực hiện thanh toán trên cổng thanh toán. *Nếu thanh toán thất bại hoặc người dùng hủy, chuyển sang Luồng phụ 2\.* Sau khi thanh toán thành công, hệ thống chuyển hướng về giao diện "Tour đã đặt". Hệ thống hiển thị Toast thông báo **"Đặt tour thành công"**. Hệ thống cập nhật giảm số lượng chỗ trống của tour và gửi Email chi tiết đơn hàng cho tác nhân. **Luồng phụ: Luồng phụ 1** (Thông tin không phù hợp): Hệ thống đánh dấu đỏ và hiển thị thông báo lỗi cụ thể tại các trường dữ liệu sai định dạng/thiếu thông tin. Tác nhân phải chỉnh sửa lại trước khi có thể tiếp tục. **Luồng phụ 2** (Thanh toán thất bại/Hủy thanh toán): Hệ thống chuyển hướng người dùng quay lại màn hình "Chi tiết đơn hàng" với trạng thái đơn là "Chờ thanh toán". Tại đây, tác nhân có thể nhấn chọn lại phương thức thanh toán để thử lại hoặc hủy đơn. **Luồng ngoại lệ Ngoại lệ 1** (Hết chỗ phút chót): Nếu trong lúc tác nhân đang nhập liệu mà người khác đã đặt hết chỗ. Khi click button “Xác nhận đặt tour”, hệ thống sẽ thông báo "Tour đã hết chỗ, vui lòng chọn tour khác hoặc số lượng ít hơn". |
| **Kết quả trả về** | Một bản ghi Đơn đặt tour (Booking) mới được tạo ra trong cơ sở dữ liệu với trạng thái tương ứng (Đã thanh toán hoặc Chờ thanh toán). Số chỗ trống của tour được cập nhật chính xác. Email xác nhận được gửi thành công đến khách hàng. |

1.6. Hủy tour

| Tên ca sử dụng | Hủy tour |
| :---- | :---- |
| **Tác nhân** | Khách hàng |
| **Điều kiện đầu vào** | Tác nhân đã đặt tour thành công. Tour đã đặt còn trong thời hạn hủy |
| **Các luồng sự kiện**  | **Luồng sự kiện chính Truy cập đơn hàng:** *Trường hợp đã đăng nhập:* Tác nhân chọn tour từ danh sách "Lịch sử đặt tour", tab \[Chờ khởi hành\] *Trường hợp chưa đăng nhập:* Tác nhân nhập Mã tra cứu Booking gửi trong Email để tìm kiếm thông tin đơn hàng. Hệ thống truy vấn dữ liệu và hiển thị giao diện **Chi tiết đặt tour**. Hệ thống kiểm tra: Nếu tour đã đặt quá thời hạn hủy, không hiện button “Hủy tour”   Nếu tour đã đặt đủ điều kiện hủy, hiện button “ Hủy tour”  Tác nhân nhấn vào nút **"Hủy tour"**. Hệ thống thực hiện kiểm tra điều kiện hủy (kiểm tra thời gian hiện tại so với ngày khởi hành và chính sách hủy của tour). Hệ thống hiển thị **Form xác nhận hủy tour** gồm: Thông tin chính sách/phí hủy, số tiền dự kiến hoàn trả, và các trường nhập thông tin ngân hàng (Tên ngân hàng, Tên tài khoản, Số tài khoản). Tác nhân nhập đầy đủ thông tin hoàn tiền và nhấn nút **"Xác nhận"**. *Nếu tác nhân nhấn "Hủy bỏ", chuyển sang Luồng phụ 1\. Nếu thiếu thông tin, chuyển sang Ngoại lệ 1\.* Hệ thống thực hiện cập nhật dữ liệu: Cập nhật trạng thái đơn hàng thành "Chờ hoàn tiền" (hoặc "Đã hủy"). Cập nhật lại số lượng chỗ trống (Slots) cho tour tương ứng. Lưu trữ thông tin hoàn tiền vào cơ sở dữ liệu. Hệ thống hiển thị thông báo **"Hủy tour thành công"**. Hệ thống gửi Email xác nhận hủy tour kèm thông tin hoàn tiền cho khách hàng. Hệ thống tự động chuyển hướng người dùng về giao diện danh sách tour đã đặt. **Luồng phụ: Luồng phụ 1 (Hủy thao tác):** Tại bước 6, nếu tác nhân chọn nút "Hủy bỏ" hoặc nhấn icon \[X\], hệ thống đóng form xác nhận và giữ nguyên trạng thái đơn hàng tại trang Chi tiết đặt tour. **Luồng ngoại lệ Ngoại lệ 1 (Nhập thiếu dữ liệu):** Tại bước 6, nếu các trường thông tin ngân hàng bị bỏ trống, hệ thống hiển thị cảnh báo yêu cầu nhập đầy đủ thông tin trước khi cho phép xác nhận. |
| **Kết quả trả về** | Trạng thái đơn hàng được cập nhật chính xác trong hệ thống. Số lượng chỗ trống của tour được khôi phục về trạng thái sẵn dụng. Ghi nhận yêu cầu hoàn tiền để bộ phận kế toán xử lý tiếp theo. |

1.7. Đánh giá tour

| Tên ca sử dụng | Đánh giá tour |
| :---- | :---- |
| **Tác nhân** | Khách hàng |
| **Điều kiện đầu vào** | Tác nhân đã hoàn thành tour đặt và chưa thực hiện hiện đánh giá tour |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân chọn tour từ danh sách "Lịch sử đặt tour" tab \[Đã hoàn thành\]. Hệ thống truy vấn dữ liệu và hiển thị giao diện **Chi tiết đặt tour**. Tác nhân nhấn vào nút **"Đánh giá tour"**. Hệ thống kiểm tra trạng thái đơn hàng và quyền đánh giá của tài khoản. *Nếu không hợp lệ, chuyển sang Ngoại lệ 1\.* Hệ thống hiển thị **Form Đánh giá tour** gồm: Chọn số sao (từ 1 đến 5 sao). Ô nhập nội dung nhận xét (văn bản). Nút chọn tải lên hình ảnh/video minh họa (không bắt buộc). Tác nhân thực hiện chọn số sao, viết nội dung và tải ảnh (nếu có). Tác nhân nhấn nút **"Gửi đánh giá"**. *Nếu tác nhân nhấn "Hủy bỏ", chuyển sang Luồng phụ 1\. Nếu chưa chọn số sao hoặc nội dung quá ngắn, chuyển sang Ngoại lệ 2\.* Hệ thống thực hiện lưu dữ liệu đánh giá vào cơ sở dữ liệu và liên kết với tour tương ứng. Hệ thống tính toán lại điểm trung bình (Rating) của tour đó dựa trên đánh giá mới nhất. Hệ thống hiển thị thông báo **"Đánh giá thành công\! Cảm ơn bạn đã phản hồi"**. Hệ thống đóng form và cập nhật trạng thái nút "Đánh giá" thành "Xem đánh giá của bạn" (hoặc ẩn nút). |
| **Kết quả trả về** | Tác nhân đánh giá tour thành công Đánh giá của khách hàng được hiển thị công khai trên trang **Chi tiết tour** (phần bình luận). Điểm đánh giá trung bình của tour được cập nhật mới. |

2\. Quản lý người dùng  
2.1 Thêm người dùng

| Tên ca sử dụng | Thêm người dùng |
| :---- | :---- |
| **Tác nhân** |  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, được cấp quyền Thêm mới người dùng . |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tại giao diện trang chủ, tác nhân chọn “Quản lý người dùng” từ thanh công cụ của menu. Tác nhân chọn chức năng "Thêm mới người dùng" được hiển thị trên màn hình. Hệ thống hiển thị giao diện nhập thông tin người dùng với các trường: Mã người dùng, Tên người dùng, Vai trò Tác nhân điền đầy đủ các thông tin cần thiết và nhấn nút "Lưu". Hệ thống kiểm tra tính đầy đủ và tính hợp lệ của thông tin đã nhập:  Nếu thông tin đầy đủ và hợp lệ, chuyển sang bước 6\. Nếu điền thiếu thông tin hoặc thông tin không hợp lệ chuyển đến luồng sự kiện phụ 1\. Hệ thống lưu thông tin vào cơ sở dữ liệu và xác nhận thao tác thành công. Luồng sự kiện phụ: Luồng phụ 1: Nếu điền thiếu thông tin, thông tin không hợp lệ hệ thống hiển thị lỗi tại trường thiếu thông tin, yêu cầu tác nhân hoàn thiện. |
| **Kết quả trả về** | Dữ liệu được lưu vào cơ sở dữ liệu. Hiển thị thông báo: “Thêm mới thành công”  Cập nhật lại danh sách trên giao diện chính.. |

 

2.2 Kịch bản ca sử dụng Tìm kiếm người dùng:

| Tên ca sử dụng | Tìm kiếm người dùng |
| :---- | :---- |
| **Tác nhân** |  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, được cấp quyền tìm kiếm người dùng . |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân nhấn vào ô “Tìm kiếm người dùng” từ màn hình giao diện Quản lý người dùng. Tác nhân nhập từ khóa tìm kiếm: Mã người dùng, Tên người dùng. Tác nhân click vào nút “Tìm kiếm”. Hệ thống hiển thị kết quả: Nếu có thông tin truy vấn phù hợp, hiển thị danh sách người dùng. Nếu không truy vấn ra thông tin, chuyển đến luồng sự kiện phụ A1. **Luồng sự kiện phụ : A1**: Không truy vấn ra thông tin phù hợp: Hệ thống thông báo không tìm thấy người dùng, quay về trang Quản lý người dùng. |
| **Kết quả trả về** | Hiển thị danh sách  người dùng trả về theo giá trị tìm kiếm |

2.3 Kịch bản ca sử dụng Sửa thông tin người dùng:

| Tên ca sử dụng | Sửa thông tin người dùng |
| :---- | :---- |
| **Tác nhân** |  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, được cấp quyền sửa người dùng , dữ liệu muốn sửa đã tồn tại trong cơ sở dữ liệu |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân nhấn vào button “Sửa” cuối dòng thông tin của người dùng cần chỉnh sửa thông tin tại Danh sách người dùng được hiển thị trong giao diện Quản lý người dùng. Hệ thống hiển thị thông tin chi tiết của người dùng dưới dạng form chỉnh sửa.  Tác nhân chỉnh sửa thông tin cần thay đổi và nhấn nút “Lưu”. Hệ thống kiểm tra thông tin: Nếu thông tin được điền đầy đủ và hợp lệ, chuyển đến bước 5\. Nếu điền thiếu thông tin, hoặc thông tin không hợp lệ chuyển đến luồng sự kiện phụ 1\. Hệ thống lưu thông tin người dùng sau khi đã chỉnh sửa vào cơ sở dữ liệu và xác nhận chỉnh sửa thành công. Luồng sự kiện phụ: Luồng sự kiện phụ 1:  Nếu điền thiếu thông tin, hệ thống hiển thị lỗi tại trường thiếu thông tin, yêu cầu tác nhân hoàn thiện. Nếu thông tin không hợp lệ, hệ thống thông báo lỗi và quay trở lại trang sửa thông tin người dùng. |
| **Kết quả trả về** | Dữ liệu được cập nhật lại trong cơ sở dữ liệu. Hiển thị thông báo: “Cập nhật thành công”  Cập nhật lại danh sách trên giao diện chính.. |

#### 

2.4 Kịch bản ca sử dụng Xóa người dùng:

| Tên ca sử dụng | Xóa người dùng |
| :---- | :---- |
| **Tác nhân** | Admin |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, được cấp quyền xóa người dùng Dữ liệu chưa bị xóa. |
| **Các luồng sự kiện**  | **Luồng sự kiện chính:** Tác nhân tìm kiếm và chọn người dùng cần xóa trong danh sách. Tác nhân nhấn vào button “Xóa” cuối dòng thông tin người dùng cần xóa tại Danh sách người dùng được hiển thị trong giao diện Quản lý người dùng. Hệ thống hiển thị hộp thoại xác nhận: “Bạn có chắc muốn xóa người dùng này không?” và 2 button “Hủy” (nếu muốn quay lại), “Xóa” (xóa thông tin người dùng). Tác nhân xác nhận “Xóa”. Nếu chọn “Hủy” chuyển sang luồng phụ A1 Hệ thống thực hiện kiểm tra các ràng buộc dữ liệu. Hệ thống thực hiện xóa dữ liệu người dùng. Hệ thống thông báo xóa thành công và cập nhật lại danh sách trên màn hình. **Luồng phụ A1.** Hủy thao tác: Tại bước 4, nếu Admin chọn Hủy, hệ thống đóng hộp thoại xác nhận và không thực hiện bất kỳ thay đổi nào. **Luồng ngoại lệ E1:** Xóa chính mình: Nếu Admin vô tình nhấn xóa tài khoản chính mình đang đăng nhập, hệ thống hiển thị thông báo: "Không thể xóa tài khoản đang sử dụng." **E2:** Lỗi ràng buộc dữ liệu: Nếu người dùng đang có dữ liệu liên quan, hệ thống hiển thị toast báo lỗi: "Bạn không thể xóa do dữ liệu này đang có ràng buộc trên hệ thống." **E3**: Lỗi kết nối: Nếu gặp các lỗi mất kết nối, hệ thống báo lỗi: "Hệ thống đang bận, vui lòng thử lại sau." |
| **Kết quả trả về** | Cập nhật cơ sở dữ liệu: bản ghi được đánh dấu delete \= 1  Hiển thị thông báo: “Xóa thành công”  Cập nhật lại danh sách trên giao diện chính.. |

