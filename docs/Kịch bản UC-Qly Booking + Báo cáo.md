  
1\. Quản lý booking

*Kịch bản ca sử dụng Tìm kiếm đơn đặt tour*

| Tên ca sử dụng | Tìm kiếm đơn đặt tour |
| :---- | ----- |
| **Tác nhân** | Nhân viên kinh doanh  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, đang ở giao diện Quản lý đơn đặt tour.  |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân nhấn vào biểu tượng tìm kiếm từ màn hình giao diện Quản lý đơn đặt tour. Tác nhân nhập từ khóa tìm kiếm: Mã tour, Tên tour, Tên khách hàng, SĐT,..... Tác nhân click vào biểu tượng tìm kiếm bên cạnh hoặc nhấn “Enter”. Hệ thống thực hiện tìm kiếm trên toàn bộ các trường thông tin được hiển thị của đơn đặt tour và hiển thị kết quả: Nếu có thông tin đơn đặt tour, hiển thị danh sách đơn có thông tin phù hợp với kết quả truy vấn. Nếu không truy vấn ra thông tin, chuyển đến luồng sự kiện phụ 1\. Luồng sự kiện phụ 1: Luồng phụ 1: Không truy vấn ra thông tin phù hợp: Hệ thống thông báo không tìm thấy đơn đặt tour phù hợp. |
| **Kết quả trả về** | Tác nhân tìm được đơn đặt tour cần tìm. |

*Kịch bản ca sử dụng Xác nhận đơn đặt tour*

| Tên ca sử dụng | Xác nhận đơn đặt tour |
| :---- | :---- |
| **Tác nhân** | Nhân viên kinh doanh  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công, đang ở giao diện Quản lý đơn đặt tour.  |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân nhấn vào tab “Chưa xác nhận”  Hệ thống hiển thị thông tin chi tiết của đơn đặt tour cần xác nhận bao gồm: Mã đơn, Tên tour, Ngày khởi hành, Ngày kết thúc, Số lượng khách, Tên người đặt, SĐT người đặt, Hình thức thanh toán, Trạng thái đơn.  Tác nhân nhấn nút Xác nhận ở cuối bản ghi → Hiển thị popup Có muốn xác nhận đơn không? Nếu tác nhân chọn có, hệ thống cập nhật trạng thái đơn đặt tour thành **“Đã xác nhận”**. Nếu tác nhân chọn không, trạng thái đơn giữ nguyên là “Chưa xác nhận”  Hệ thống lưu thông tin cập nhật vào cơ sở dữ liệu và hiển thị thông báo **xác nhận đơn đặt tour thành công**. C2: Tác nhân nhấn vào Xem chi tiết ở cuối bản ghi (đơn đặt tour muốn hoàn tiền). → Hiển thị thông tin chi tiết đơn đặt tour (Mã đơn, Tên tour, Ngày khởi hành, Ngày kết thúc, Số lượng khách, Tên người đặt, SĐT người đặt, Hình thức thanh toán, Trạng thái đơn và Danh sách người tham gia tour).  → Bên cạnh Trạng thái đơn để nút xác nhận, nhân viên kinh doanh có thể bấm vào để xác nhận. → Hiển popup để xác nhận …( như luồng sự kiện chính ở trên) |
| **Kết quả trả về** | Hệ thống hiển thị thông báo xác nhận đơn đặt tour thành công và trạng thái đơn được cập nhật thành “Đã xác nhận”.  Thông tin của đơn được chuyển sang tab “Đã xác nhận”.  |

Kịch bản ca sử dụng Hoàn tiền cho khách 

| Tên ca sử dụng | Hoàn tiền cho khách  |
| :---- | :---- |
| **Tác nhân** | Nhân viên kinh doanh  |
| **Điều kiện đầu vào** | Tác nhân đã đăng nhập thành công.  |
| **Các luồng sự kiện**  | Luồng sự kiện chính: Tác nhân truy cập màn hình Quản lý đơn đặt tour từ thanh menu hệ thống. Tác nhân chọn tab “Đã hủy” để hiển thị danh sách các đơn đặt tour đã bị hủy. Hệ thống hiển thị danh sách đơn với trạng thái Đã hủy và bộ lọc hoàn tiền gồm: Tất cả / Chưa hoàn / Đã hoàn. Tác nhân chọn bộ lọc “Chưa hoàn”. Hệ thống hiển thị danh sách các đơn đặt tour chưa được hoàn tiền. Tác nhân chọn đơn đặt tour cần xác nhận hoàn tiền. Hệ thống hiển thị màn hình chi tiết đơn đặt tour (Mã đơn, Tên tour, Ngày khởi hành, Ngày kết thúc, Số lượng khách, Tên người đặt, SĐT người đặt, Hình thức thanh toán, Trạng thái đơn và Danh sách người tham gia tour) và Phần hoàn tiền (Ô tải ảnh lên và nút hoàn tiền)  Tác nhân tải lên ảnh bill / chứng từ hoàn tiền và nhấn nút Hoàn tiền . Hệ thống kiểm tra thông tin tải lên: a. Nếu hợp lệ, hệ thống cập nhật trạng thái hoàn tiền của đơn thành “Đã hoàn”. b. Nếu không hợp lệ, chuyển đến Luồng sự kiện phụ 1\. Hệ thống lưu thông tin hoàn tiền vào cơ sở dữ liệu, hiển thị thông báo xác nhận hoàn tiền thành công và gửi email thông báo hoàn tiền cho khách hàng. Luồng sự kiện phụ:  Luồng sự kiện phụ 1: Nếu tác nhân chưa tải lên ảnh bill hoặc tải lên file không đúng định dạng / dung lượng cho phép, hệ thống hiển thị thông báo lỗi và yêu cầu tác nhân tải lại chứng từ hợp lệ trước khi xác nhận hoàn tiền |
| **Kết quả trả về** | Đơn đặt tour được cập nhật trạng thái **Đã hoàn tiền**, chứng từ hoàn tiền được lưu trong hệ thống và khách hàng nhận được email thông báo hoàn tiền thành công. |

2. Quản lý Dashboard 

**Dashboard:** 

***Lọc (Khoảng thời gian, Điểm đến, Khoảng giá tiền). Có thể chọn 1 hoặc nhiều bộ lọc đồng thời (Dùng lựa chọn tất cả ở trường k muốn lọc)*** 

* Top 5  Tour có doanh thu cao nhất   
* Điểm đến thu hút nhất   
* Doanh thu   
* Tổng số đơn đã hoàn thành   
* Tỉ lệ đơn hủy (Số đơn hủy/ Tổng số đơn)   
* Phương thức thanh toán (Biểu đồ tròn) 

**Xuất báo cáo theo excel**

Luồng sự kiện chính:

1. Tại giao diện thanh sidebar, tác nhân chọn “Dashboard”

2. Hệ thống hiển thị 1 loạt các dashboard với bộ lọc

- Thời gian: VD hôm nay 19/3/2026 thì ngày bắt đầu mặc định là 19/2/2026 và ngày kt là 19/3/2026. Tác nhân có thể chọn khoảng thời gian mong muốn.   
- Điểm đến (default: tất cả). Dropdown các điểm đến có trong csdl.   
- Khoảng giá tiền: (Căn cứ vào định giá bên điều phối viên và csdl)   
3. Tác nhân lựa chọn khoảng thời gian, điểm đến, khoảng giá tiền cần xuất báo cáo doanh thu.

4. Tác nhân nhấn nút “Xuất báo cáo”. Hệ thống hiển thị popup hỏi yêu cầu chọn loại báo cáo muốn xuất (Top 5  Tour có doanh thu cao nhất ,Điểm đến thu hút nhất , Doanh thu , Tổng số đơn đã hoàn thành , Tỉ lệ đơn hủy (Số đơn hủy/ Tổng số đơn) ,Phương thức thanh toán (Biểu đồ tròn) ). Nếu chọn nhiều hơn 2 báo cáo thì chọn mỗi báo cáo là 1 sheet trong file được tải về. Tên Sheet tương ứng với báo cáo xuất.   
     
5. Hệ thống kiểm tra tính hợp lệ của dữ liệu nhập:  
   1. Nếu thông tin đầy đủ và hợp lệ, chuyển sang bước 6\.  
   2. Nếu điền thiếu thông tin, chuyển đến luồng sự kiện phụ 1\.  
6. Hệ thống xử lý yêu cầu, tạo file báo cáo doanh thu theo bộ lọc.  
7. File báo cáo sẽ tự động được tải về máy sau khi hệ thống tạo dưới dạng excel.

Luồng sự kiện phụ 1:

1. Luồng sự kiện phụ 1: Khoảng thời gian không hợp lệ/ điền thiếu trường thông tin/ bị bỏ trống:  
   1. Hệ thống sẽ tự động thiết lập khoảng thời gian mặc định là 1 tháng gần nhất tính từ thời điểm hiện tại.   
   2. Sau đó, thực hiện tạo và tải file báo cáo như các bước còn lại trong luồng chính.

