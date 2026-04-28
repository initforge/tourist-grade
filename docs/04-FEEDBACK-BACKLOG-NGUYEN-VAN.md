# Feedback Backlog Nguyên Văn

File này gom lại các task/feedback mà user đã giao theo role, giữ nguyên câu chữ gốc nhiều nhất có thể để phục vụ audit hồi quy và bắt lỗi kiểu "sửa chỗ này vỡ chỗ khác".

## Điều phối

### Batch 1 - `http://localhost:8080/coordinator/tour-programs/create`

```text
1. http://localhost:8080/coordinator/tour-programs/create
- Bổ sung Tiêu chuẩn lưu trú (2-5 sao)
- Đổi Độ phủ mở bán tối thiểu của loại tour Quanh năm thành Thời gian mở bán tối thiểu
- Các trường thông tin (trừ Thời hạn đặt tour và Thời gian mở bán tối thiểu của loại tour Quanh năm) khi vừa mới vào không được tự điền sẵn mà khi ấn tiếp theo thì validate thông tin xem thiếu trường nào thì báo lỗi
- Phương tiện có rule như sau:
+ Chỉ hiển thị khi cả Điểm khởi hành và Điểm tham quan đều chứa tỉnh thành có sân bay (nếu không không hiển thị và phương tiện default là Xe du lịch); 
+ Điểm đến khi chọn Phương tiện là máy bay là 1 trong các Điểm tham quan có sân bay; Nếu chỉ có 1 Điểm tham quan có sân bay thì Default Điểm đến = tỉnh thành có sân bay đó và không cho sửa
- Với loại tour Quanh năm, rule như sau : 
+ Ngày bắt đầu:
   +> Default rỗng hoặc auto = Ngày hiện tại + 1 tháng
   +> Datepicker chỉ cho chọn từ Ngày hiện tại + 1 tháng trở đi
   +> Nếu nhập tay ngày < Ngày hiện tại + 1 tháng thì hiện lỗi ở dưới là chương trình tour phải tạo ít nhất trước 1 tháng
+ Ngày kết thúc:
   +> Default disable, chỉ khi nhập ngày bắt đầu hợp lệ rồi mới enable 
   +> Datepicker chỉ cho chọn ngày từ ngày bắt đầu trở đi
   +> Nếu nhập tay ngày kết thúc < ngày bắt đầu thì hiện lỗi ở dưới là Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu
   +> Khi cập nhật ngày bắt đầu, nếu ngày bắt đầu mới > ngày kết thúc thì clear ngày kết thúc
+ Nếu chưa chọn1 trong 3 trường Ngày bắt đầu, Ngày kết thúc và Ngày khởi hành trong tuần thì không hiển thị danh sách ngày khởi hành dự kiến
- Với loại tour Mùa lễ, chỉ được chọn Dịp lễ có Ngày bắt đầu >= ngày hiện tại + 0.5 tháng
2. http://localhost:8080/coordinator/tour-programs/create
- Thêm validate xem đã điền đủ các trường thông tin chưa trước khi chuyển sang tab khác
```

### Batch 2 - `http://localhost:8080/coordinator/tour-programs/create`, `TP003`, `TP004`

```text
1. http://localhost:8080/coordinator/tour-programs/create
- Không được tự động thêm sẵn dịch vụ và nhà cung cấp vào các khoản mục (trừ dịch vụ bảo hiểm du lịch)
- Muốn thêm nhà cung cấp, dịch vụ vào khoản mục thì phải hiển thị popup với các thông tin sau và cho tìm kiếm kèm chọn nhiều:
+ Xe tham quan: Nhà cung cấp, Khu vực hoạt động và Dịch vụ (liệt kê các biến thể dịch vụ của họ dạng text kiểu Xe 29 chỗ, Xe 35 chỗ).
+ Vé máy bay:  Nhà cung cấp,  Số lần hợp tác và Lần hợp tác gần nhất
+ Khách sạn (dịch vụ lưu trú các đêm): Nhà cung cấp, Địa chỉ (danh sách khách sạn được lọc theo tiêu chuẩn lưu trú ở thông tin chung và địa điểm lưu trú ở lịch trình)
+ Dịch vụ ăn uống: Tên dịch vụ, Mô tả, Địa chỉ, Nhà cung cấp (danh sách nhà hàng đc lọc theo các điểm tham quan)
+ Vé tham quan: Tên dịch vụ, Mô tả, Địa chỉ (danh sách dịch vụ lọc theo các điểm tham quan)
+ Chi phí khác: Tên dịch vụ, Nhà cung cấp
- Dòng khoản mục thì merge 4 cột thành 2 cột Tên khoản mục (Lưu trú - Đêm 1, 2; Lưu trú - Đêm 3; Ngày 1 - Bữa trưa; Ngày 1 - Bữa tối...) và Thành tiền/Đơn giá áp dụng; Vé tham quan merge 4 cột thành 1 cột Tên khoản mục (Ngày 1; Ngày 2; ....)
- Hướng dẫn viên Đơn giá có đơn vị là đ chứ ko phải đ/ngày
- Phần gợi ý giá khi ở chế độ nhập thủ công nằm phía dưới ô nhập
- Đơn giá do hệ thống tự hiển thị (của dịch vụ khách sạn, ăn uống, vé tham quan và chi phí khác có hình thức giá là Niêm yết) được xác định theo bảng giá áp dụng cho từng ngày trong tour khởi hành đầu tiên. Cụ thể, với mỗi ngày trong tour:
+ Ưu tiên chọn bảng giá có khoảng hiệu lực (ngày bắt đầu – ngày kết thúc) bao gồm ngày đó.
+ Nếu không có, chọn bảng giá thỏa mãn:
   +> Có ngày bắt đầu trước ngày đó
   +> Không có ngày kết thúc
+ Đối với khách sạn (theo nhóm đêm): Đơn giá được tính bằng trung bình các đêm, sau đó làm tròn đến hàng nghìn.
+ Không được chỉnh sửa đơn giá do hệ thống hiển thị
- Phần chi phí khác:
+ Chi phí khác hiển thị các thông tin: Nhà cung cấp, Tên dịch vụ, Đơn giá, Số lần và Ghi chú (thay Đơn vị hiện tại thành Số lần)
+ Nếu thêm dịch vụ có Hình thức giá là Báo giá thì yêu cầu điền Đơn giá, có Công thức tính số lần là Nhập tay thì yêu cầu điền Số lần
- Phần tính toán dự kiến chưa sticky cuối màn
- Cho phép xóa dịch vụ /nhà cung cấp cuối cùng của khoản mục, chỉ cần validate tất cả khoản mục đều có dịch vụ/nhà cung cấp là được
- Khi validate việc chọn mặc định cho các khoản mục: nếu danh sách dự kiến chỉ có 1 lựa chọn thì hệ thống tự động chọn làm mặc định và không báo lỗi.
- Khi chuyển sang tab khác, hệ thống cần kiểm tra xem tất cả các khoản mục đã có dịch vụ, đã chọn mặc định (nếu có) và đã nhập đầy đủ thông tin hay chưa.
- Mỗi khi chỉnh sửa các trường Số lượng khách dự kiến, Tỷ lệ lợi nhuận mong muốn, Thuế và Hệ số chi phí khác, Thay đổi lựa chọn mặc định ở phần vận chuyển, khách sạn, ăn uống; Thêm dịch vụ vào Vé tham quan và Chi phí khác thì phải cập nhật lại phần Tính toán dự kiến theo thay đổi tương ứng
- Tỷ lệ lợi nhuận đc lưu để tính toán cho các tour sau là tỷ lệ lợi nhuận thực tế đc tính toán và làm tròn đến hàng đơn vị
2. http://localhost:8080/coordinator/tour-programs/create
- Bỏ phần tóm tắt
- Giá bán đc tính theo bảng giá tương ứng của tour đó với tỷ lệ lợi nhuận là tỷ lệ lợi nhuận thực tế tính ra ở Giá và cấu hình làm tròn đến hàng đơn vị 
- Giá bán được làm tròn đến hàng nghìn
- Chưa có dl test nhma phần tour trùng thời điểm khi hover vào cần hiện danh sách các chương trình tour trùng
- Không được điều chỉnh ngày khởi hành và ngày kết thúc
3. http://localhost:8080/coordinator/tour-programs/create
Gửi duyệt tour chưa có BE, chưa nối db
4. http://localhost:8080/coordinator/tour-programs/TP003

- Nếu chương trình có trạng thái là Từ chối duyệt thì cần hiển thị lý do từ chối
- Ấn nút chỉnh sửa cần hiển thị y hệt Màn tạo mới gồm 4 tab chỉ là đã có sẵn dữ liệu lưu trước đó thôi (cho phép sửa tất cả các trường như Tạo mới)
- Anh check lại giùm em này đã gắn db chưa với ạ vì Hôm trước em thấy đã được cập nhật rồi, nhưng hôm nay lại thấy chưa duyệt. Tuy nhiên khi em ấn duyệt thì dữ liệu vẫn được cập nhật ở cả hai bên và vẫn lưu đến hiện tại
4. http://localhost:8080/coordinator/tour-programs/TP004
- Chưa hiển thị lý do từ chối trong màn xem chi tiết và chỉnh sửa
- Màn chỉnh sửa chưa hiện danh sách ngày khởi hành dự kiến sau khi chọn đầy đủ ngày bắt đầu, ngày kết thúc và ngày khởi hành trong tuần; chưa cho chỉnh sửa Giá và cấu hình; chưa có tab tour dự kiến
- Gửi duyệt ở đây chưa kết nối db 
```

### Batch 3 - công thức tính toán dự kiến

```text
1. http://localhost:8080/coordinator/tour-programs/create
- Công thức tính toán dự kiến 
+ Giá net = (Chi phí cố định / Số khách dự kiến + Chi phí biến đổi của người lớn)× (1 + % Thuế) × (1 + Hệ số chi phí khác)
+ Giá bán = Giá net × (1 + Tỷ lệ lợi nhuận mong muốn) 
+ Giá bán trẻ em = 75% * Giá bán 
+ Giá bán trẻ sơ sinh Default = 0 hoặc bằng 10% Giá bán
+ Số lượng khách tối thiểu để triển khai tour = Chi phí cố định / (Giá bán người lớn - Chi phí biến đổi)
+ Tỷ lệ lợi nhuận thực tế = (Giá bán - Giá net)/Giá net
+ Phụ phí phòng đơn = Đơn giá phòng đơn - Đơn giá phòng đôi/2
Trong đó:
+ Chi phí cố định gồm:
   +> Chi phí vận chuyển có Cách tính chi phí = Theo phương tiện
   +> Chi phí Hướng dẫn viên
+ Các chi phí còn lại được tính là chi phí biến đổi
+ Thành tiền của khoản mục khách sạn phải chia đôi, vì đây là đơn giá của phòng đôi, trong khi chi phí biến đổi là chi phí cho 1 người
```

### Batch 4 - `tour-rules`, `tour-programs`, `estimate`, `tours`, `settle`, `services`, `suppliers`

```text
1. http://localhost:8080/coordinator/tour-rules
"Quản lý tour
- Đổi ""độ phủ""/""độ bao phủ"" thành ""thời gian mở bán"" (kiểu độ bao phủ đã tính -> thời gian mở bán đã tính)
- Thời gian mở bán đã xét = ngày khởi hành xa nhất đã có yêu cầu (kể cả từ chối) - ngày khởi hành gần nhất sắp tới đã có yêu cầu (kể cả từ chối)
- Thời gian mở bán khả dụng = số tuần hiện tại có tour bán /4
- Cách xét trạng thái
+ Khi Thời gian mở bán đã xét < Thời gian mở bán tối thiểu → chương trình tour được gắn trạng thái Cảnh báo.
+ Khi Thời gian mở bán đã xét ≥  Thời gian mở bán tối thiểu → chương trình tour được gắn trạng thái Đã đủ
- Ưu tiên hiển thị tour theo thứ tự:
+ Cảnh báo → sắp xếp theo thời điểm chuyển sang Cảnh báo (tăng dần)
+ Đã đủ → sắp xếp theo thời gian tạo yêu cầu gần nhất (tăng dần)
- Popup Tạo tour:
+ Bỏ tóm tắt
+ Giá vốn và giá bán của mỗi tour được tính theo bảng giá áp dụng của tour đó, sau đó làm tròn đến hàng nghìn. 
+ Rule khoảng thời gian tạo tour:
   +> Sinh từ ngày:
        * Default = MAX(Ngày hiện tại + 1 tháng; Ngày khởi hành kế tiếp của ngày xa nhất đã gửi yêu cầu)
        * Datepicker chỉ cho chọn từ Ngày hiện tại + 1 tháng trở đi
        * Datepicker chỉ cho phép chọn từ Ngày hiện tại + 1 tháng trở đi
        * Nếu nhập tay ngày < Ngày hiện tại + 1 tháng thì hiện lỗi ở dưới là  tour phải tạo ít nhất trước 1 tháng
   +> Đến ngày:
        * IF trạng thái = Cảnh báo → Đến ngày = Sinh từ ngày + Thời gian mở bán tối thiểu
        * IF trạng thái = Đã đủ → Đến ngày = Sinh từ ngày + 1 tháng → Làm tròn về ngày cuối tháng
        * Datepicker chỉ cho chọn ngày từ Sinh từ ngày trở đi
        * Nếu nhập tay Đến ngày < Sinh từ ngày thì hiện lỗi ở dưới là Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu
        * Khi cập nhật Sinh từ ngày, nếu Sinh từ ngày mới > Đến ngày thì clear Đến ngày
+ Mỗi khi cập nhật Sinh từ ngày hoặc Đến ngày thì preview tour dự kiến cx phải cập nhật theo
+ Ấn gửi thì validate xem có trường nào bị bỏ trống ko
+ Chưa có dl test nhma phần tour trùng thời điểm khi hover vào cần hiện danh sách các chương trình tour trùng
- Popup sửa tour logic tương tự tạo tour chỉ là ko default mà dùng dl đã nhập từ trước và nếu đó là yêu cầu có yêu cầu chỉnh sửa từ quản lý thì phải hiện cả yêu cầu sửa cạnh danh sách tour dự kiến
- Chưa kết nối db"
2. http://localhost:8080/coordinator/tour-rules
Màn danh sách chương trình tour tab Đang hoạt động không có chức năng ngừng kinh doanh ở nhân viên điều phối
3. http://localhost:8080/coordinator/tours/TI008/estimate
"Màn dự toán tour
- Chưa có BE, chưa kế thừa dữ liệu từ Giá và cấu hình
- Sửa giá của Xe vận chuyển và Vé máy bay thì có thể sửa trực tiếp, ko cần hiện popup sửa giá
- Cách xác định số lượng:
+ Số lượng của dịch vụ lưu trú là tính tổng theo loại phòng từ các booking của tour
+ Số lượng của dịch vụ có Công thức tính số lượng là Theo người (tất cả dịch vụ ăn uống, vé máy bay, vé tham quan) là tổng số khách, nếu Thiết lập giá của dịch vụ là Theo độ tuổi thì số lượng sẽ được tính riêng theo từng loại khách (người lớn, trẻ em)
+ Số lượng của dịch vụ có Công thức tính số lượng là Giá trị mặc định thì hiển thị giá trị mặc định của nó (xe tham quan mặc định là 1)
+ Số lượng của dịch vụ có Công thức tính số lượng là Nhập tay thì yêu cầu người dùng nhập số lượng
- Số lần của khoản mục lưu trú = Số đêm của nhóm đêm
- Hướng dẫn viên có số lần và số lượng mặc định = 1
- Doanh thu dự kiến = Tổng tiền từ các booking hiện tại + số tiền giữ lại từ các booking đã hoàn.
- Khi thay đổi Nhà cung cấp/Dịch vụ sử dụng; Giá và Số lượng nhập tay thì Tổng dự chi, Lợi nhuận dự kiến và Tỷ suất lợi nhuận cũng phải cập nhật theo
- Nếu dự toán ở trạng thái yêu cầu chỉnh sửa thì phải hiển thị yêu cầu chỉnh sửa cạnh dự toán
- Nếu cập nhật giá bán lên hệ thống thì có thể ko cần nhập ngày hết hiệu lực, cách cập nhật vào db:
+ Thêm bản ghi mới vào bảng giá
+ Nếu ko có ngày hết hiệu lực thì kiểm tra xem dịch vụ này có bảng giá nào đang không có ngày hết hiệu lực hay không. Nếu có → cập nhật ngày hết hiệu lực của bảng giá đó = ngày hiệu lực của bảng giá mới"
4. http://localhost:8080/coordinator/tours
"Màn danh sách tour tab Phân công HDV
- Popup lọc danh sách hướng dẫn viên dựa theo ngoại ngữ khớp với quốc tịch của hàn khách, vd trong đoàn có ng Nhật, Hàn, Trung thì hướng dẫn viên phải có ngoại ngữ này. Nếu họ thuộc các nước khác thì yêu cầu hdv biết tiếng Anh
- Đang ko có BE hay nối db
- Sau ấn phân công xong thì nút Phân công HDV trở thành nút Thay đổi HDV, nếu ấn Thay đổi HDV thì hiện popup xác nhận thay đổi, nếu xác nhận thì hiện popup như Phân công hdv nhưng đã loại HDV đang được phân công hiện tại ra khỏi danh sách. 
- Khi ấn phân công xong, hệ thống gửi thông tin tour, lịch trình, danh sách hành khách và bản kê chi phí dạng pdf hoặc excel cho hdv"
5. http://localhost:8080/coordinator/tours/TI004/settle
"Màn quyết toán tour
- Tất cả thực chi default ban đầu bằng thành tiền của dự toán
- Chưa có BE hay kết nối db"
6. http://localhost:8080/coordinator/services
"Màn dịch vụ
- Chưa có BE hay kết nối db
- Thiết lập giá theo độ tuổi đang không có cho nhập 2 đơn giá người lớn và trẻ em
- Đơn vị của chi phí khác không mặc định là khách mà yêu cầu nhập
- Khi tạo và chỉnh sửa lúc lưu cần validate dữ liệu 
- Cách lưu dịch vụ tạo mới : lưu thông tin dịch vụ và đơn giá lưu vào bảng giá với ngày hiệu lực = ngày tạo dịch vụ và ngày hết hiệu lực bỏ trống, người tạo bảng giá chính là người tạo dịch vụ; Vé tham quan default lưu thông tin Công thức tính số lượng Theo người và Công thức tính số lần có giá trị mặc định =1
- Thêm mới bảng giá thì có thể ko cần nhập ngày hết hiệu lực, cách cập nhật vào db:
+ Thêm bản ghi mới vào bảng giá
+ Nếu ko có ngày hết hiệu lực thì kiểm tra xem dịch vụ này có bảng giá nào đang không có ngày hết hiệu lực hay không. Nếu có → cập nhật ngày hết hiệu lực của bảng giá đó = ngày hiệu lực của bảng giá mới"
7. http://localhost:8080/coordinator/suppliers
"Màn nhà cung cấp
- Khách sạn các dịch vụ lưu trú là có cố định 3 dịch vụ phòng đơn, phòng đôi, phòng ba và yêu cầu nhập số lượng và đơn giá (bỏ cột mô tả, không cho chỉnh sửa tên dịch vụ)
- Các dịch vụ ăn uống khi ấn thêm mới phải hiện bản ghi rỗng để người dùng nhập rồi validate chứ ko đc điền sẵn thông tin
- Các dịch vụ xe vận chuyển cùng 1 nhà cung cấp ko đc trùng số chỗ
- Khi ấn thêm mới bảng giá ở màn nhà cung cấp là cập nhật đơn giá của tất cả các dịch vụ của nhà cung cấp đó 
- Thêm mới bảng giá thì có thể ko cần nhập ngày hết hiệu lực, cách cập nhật vào db:
+ Thêm bản ghi mới vào bảng giá
+ Nếu ko có ngày hết hiệu lực thì kiểm tra xem dịch vụ này có bảng giá nào đang không có ngày hết hiệu lực hay không. Nếu có → cập nhật ngày hết hiệu lực của bảng giá đó = ngày hiệu lực của bảng giá mới
- Cách lưu dịch vụ tạo mới : lưu thông tin dịch vụ và đơn giá lưu vào bảng giá với ngày hiệu lực = ngày tạo dịch vụ và ngày hết hiệu lực bỏ trống, người tạo bảng giá chính là người tạo dịch vụ
- Dịch vụ ăn uống mặc định lưu thông tin Công thức tính số lượng Theo người và Công thức tính số lần có giá trị mặc định =1
- Khi tạo mới và sửa thì cần khi lưu cần validate dữ liệu
- Chưa có BE hay kết nối db"
```

## Nhân viên kinh doanh

```text
1. http://localhost:8080/sales/bookings?tab=pending_confirm
Khi khách hàng thanh toán thành công, thông tin về đơn hàng và danh sách hành khách trong đơn được chuyển sang cho NV kinh doanh (cụ thể ở màn Quản lý Booking/ Cần xác nhận/ Cần xác nhận đơn đặt)
2. http://localhost:8080/coordinator/tours/TI009/estimate
"NV kinh doanh vào màn Cần xác nhận đơn đặt và điền đầy đủ thông tin về Phòng và Danh sách hành khách. Nếu những thông tin vừa rối đầy đủ và hợp lệ --> Nút xác nhận Enable. Nhân viên nhấn nút Xác nhận đơn đặt thành công 
+ Hệ thống hiển thị thông báo xác nhận đơn đặt tour thành công và trạng thái đơn được cập nhật thành “Đã xác nhận”.
+ Hệ thống lưu thông tin tác nhân xác nhận và thời gian xác nhận ở màn Chi tiết đơn. 
+ Thông tin của đơn được chuyển sang tab “Đã xác nhận”
+ Thông tin về danh sách hành khách lúc này mới được cập nhật sang màn của nhân viên điều hành (Điều hành tour/ Chờ dự toán/ Danh sách hành khách)
+ Hệ thống gửi mail cho khách hàng thông báo Đơn đặt tour đã được xác nhận.
"
3. Màn Chi tiết đơn cần xác nhận đặt, phần chỉnh sửa Danh sách hành khách. Nếu khách có quốc tịch là nước ngoài thì k cần validate 12 chữ số ở trường CCCD/ GSK. GKS của trẻ em cũng cần validate 12 chữ số (nếu của trẻ em Việt Nam).
4. "Khi Khách hàng gửi yêu cầu Hủy, trong trang Quản lý booking, đơn từ trạng thái ""Đã xác nhận"" chuyển sang trạng thái ""Cần xác nhận hủy"". Nhân viên kinh doanh vào trang Quản lý booking/ Cần xác nhận/ Cần xác nhận hủy(http://localhost:8080/sales/bookings?tab=pending_confirm), chọn đơn xác nhận hủy và vào màn chi tiết ấn Xác nhận hủy. NV xác nhận hủy thành công
+ Hệ thống hiển thị thông báo xác nhận yêu cầu hủy tour  thành công và trạng thái đơn được cập nhật thành “Đã hủy”.
+ Hệ thống lưu thông tin tác nhân xác nhận và thời gian xác nhận ở màn Chi tiết đơn. 
+ Thông tin của đơn được chuyển sang tab “Đã hủy”. 
+ Thông tin về danh sách hành khách lúc này mới được xóa khỏi  màn của nhân viên điều hành (Điều hành tour/ Chờ dự toán/ Danh sách hành khách(http://localhost:8080/coordinator/tours/TI009/estimate))
+ Hệ thống gửi mail cho khách hàng thông báo Yêu cầu hủy đã được xác nhận. 
"

5. "Khi Quản lý phê duyệt voucher, voucher đó ở màn Quản lý voucher của NV kinh doanh phải được chuyển từ trạng thái ""Chờ phê duyệt"" sang ""Sắp diễn ra"". 
Nếu Quản lý từ chối voucher, voucher đó ở màn Quản lý voucher của NV kinh doanh phải được chuyển từ trạng thái ""Chờ phê duyệt"" sang ""Không được phê duyệt "" kèm theo lý do không phê duyệt trong màn Chi tiết voucher. "
http://localhost:8080/sales/vouchers/VOU-06
http://localhost:8080/sales/vouchers/VOU-06

6. Màn Chỉnh sửa/ thêm mới voucher, chương trình tour áp dụng phải để dropdown menu . 
7. Màn chi tiết đơn Đã hủy, phần Thông tin ngân hàng phải lấy từ thông tin Khách hàng nhập trong Popup Gửi yêu cầu hủy. 
8.http://localhost:8080/sales/bookings/B005?tab=cancelled 
"Trang Quản lý booking/ Đơn Đã hủy/ Chi tiết đơn Đã hủy
Khi nhân viên tải ảnh hoàn tiền lên và ấn Lưu thành công, Đơn đặt tour được cập nhật trạng thái Đã hoàn tiền, chứng từ hoàn tiền được lưu trong hệ thống và khách hàng nhận được email thông báo hoàn tiền thành công.Trong mail cần phải có thông tin đơn hủy, thông tin về số tiền được hoàn và ảnh bill hoàn tiền. 
Khi nhân viên chỉnh sửa ảnh bill hoàn tiền, ảnh bill chuyển khoản mới được lưu trong hệ thống và khách hàng nhận được email thông báo cập nhật bill chuyển khoản hoàn tiền kèm ảnh bill mới. 
Phần người hoàn tiền trong chi tiết đơn Đã hủy cần lưu thông tin người hoàn và thời điểm hoàn ở lần sửa gần nhất (hiện tại đang để thông tin người hoàn ở lần hoàn đầu tiên)"

9."Đơn nào mà chưa thanh toán thì sẽ chuyển thông tin đơn sang trang Quản lý booking (Cần xác nhận đặt)-http://localhost:8080/sales/bookings?tab=pending_confirm nhưng trạng thái thanh toán là Chưa thanh toán. Nếu sau 15p mà k thanh toán thì đẩy sang tab Đã hủy-http://localhost:8080/sales/bookings?tab=cancelled với lý do Không thanh toán đúng hạn. Khi sang tab đã hủy thì trạng thái hoàn tiền để là Hoàn thành luôn. 

10.
http://localhost:8080/sales/dashboard
 Phần Dashboard của NV kinh doanh thêm 1 biểu đồ top 5 chương trình tour có tỷ lệ book (tổng số khách tham gia đi tour/ tổng số slot của chương trình tour) thấp nhất
"
```

## Quản lý

```text
1. http://localhost:8080/manager/tours
Màn xem chi tiết chương trình tour chưa nối db
2. Màn danh sách chương trình tour tab Đang hoạt động chức năng ngừng kinh doanh chưa nối db cũng chưa hiện popup điền lý do ngừng kinh doanh
http://localhost:8080/manager/tour-programs

3. http://localhost:8080/manager/tours
"Màn danh sách tour tab Chờ duyệt bán
- Kiểm tra lại xem đã nối db cả 3 nút duyệt, yêu cầu chỉnh sửa và từ chối chưa
- Nếu yêu cầu chỉnh sửa thì lưu trạng thái yêu cầu (và các tour dự kiến) là Yêu cầu sửa
- Nếu từ chối thì cập nhật trạng thái yêu cầu tour (và các tour dự kiến) là Từ chối bán"

4. http://localhost:8080/manager/tours/TI003/estimate-approval
"Màn duyệt dự toán 
Ko có BE và kết nối db"
5. http://localhost:8080/manager/tours
Màn danh sách tour tab hoàn thành chưa cho xem kết quả quyết toán như nhân viên điều hành
6. http://localhost:8080/manager/special-days
Màn ngày đặc biệt không kết nối db
7. http://localhost:8080/manager/tours
Màn không đủ điều kiện khởi hành bỏ lợi nhuận dự kiến và cũng chưa có BE và kết nối db
```

## Khách hàng

```text
1. Chưa áp dụng được mã giảm giá, 
2. - Khách hàng đã đăng nhập thì không cần hiện tính năng Tra cứu đơn đặt hàng

3. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao
"Trang chi tiết tour 
1. Chưa nhấn xem được ảnh, ảnh lệch nhau ,  khoảng cách xa so với tiêu đề bên dưới
2. Thông tin lịch khởi hành, đánh giá , cần được lấy từ db, liên kết với dữ liệu từ bên điều phối
3. Tính năng yêu thích tour: 
- Các tour đã nằm trong danh sách yêu thích thì không hiển thị trạng thái button Lưu yêu thích => phải hiển thị Đã lưu yêu thích
- Nhấn lưu yêu thích chưa hoạt động => chưa thêm vào danh sách yêu thích
4. Tour liên quan thì hiện thị các tour cùng vùng miền, khi nhần vào 1 tour => điều hướng về đầu trang giao diện chi tiết tour
5. Giao diện
- Thẻ thông tin đặt tour bên phải giữ nguyên vị trí khi scroll down như web này-https://travel.com.vn/chuong-trinh/nha-trang-ben-du-thuyen-ana-marina-vinh-nha-trang-bai-tranh-dao-robinson-i-resort-pid-9902, thẻ đặt tour ở màn đặt tour/thanh toán cố định tương tự 
- Bảng lịch khởi hành chỉ hiện thị lịch còn slot trống, chỗ phụ thu phòng đơn đang lỗi hiển thị
- Icon chỗ lịch trình chi tiết bị lệch
- Mã tour trong thẻ đặt tour: Hiện thị dạng Mã ctrinh tour - Mã tour cụ thể ( mã của tour theo lịch khởi hành)"
4. Các tour đã đặt chưa có tính năng đánh giá tour, cần đánh giá tour lưu vào db và được hiển thị đúng trên tour tương ứng
5. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-2
"Trang Đặt tour
1. Giao diện
- Thông tin hành khách để bố cục như demo trước ấy a, thể hiện được người lớn/trẻ em/em bé








+ Validate tại FE ngày sinh theo loại hành khách ( người lớn/trẻ em/ em bé) , tính theo ngày khởi hành, nếu không đúng loại hành khách, hiển thị inline message Tuổi không phù hợp
+ Quốc tịch chọn từ List, không phải nhập vào
- Số lượng hành khách : Thêm số lượng trống và validate chặn chọn quá số lượng trống. Thêm chú thích cạnh tên Người lớn ( Từ 12 tuổi), Trẻ em ( Từ 2- 11 tuổi), Em bé ( Dưới 2 tuổi)
- Thông tin liên hệ:  Chưa ghi rõ ràng các trường thông tin cần nhập ( họ tên/số điện thoại/email), bổ sung validate số điện thoại
- Thẻ đặt bên phải có thông tin khó hiểu : 







2. Luồng đặt tour : Hiện tại thanh toán thành công chưa xử lý kết quả trả về
- 1. Thông tin : Điền đầy đủ thông tin xong => Nhấn tiếp tục thanh toán thì sẽ tạo booking/gửi mail luôn ( Kiểm tra lại chỗ trống trước khi tạo booking) => Chuyển sang trang 2. Thanh toán => Chọn các thông tin thanh toán ( hình thức/ tỷ lệ) => Nhấn Thanh toán thì chuyển sang cổng thanh toán luôn 
+ Nếu thanh toán thành công thì quay về giao diện đặt đơn mục 3. Hoàn tất có  hiển thị thanh toán thành công. 
+ Nếu thanh toán thất bại/ Hủy thì quay về 2. Thanh toán và cho phép chọn lại các thông tin thanh toán, Thông báo yêu cầu thanh toán trong 15p 
+ Sau 15p thanh toán thất bại sẽ tự hủy đơn hàng
+ Ở trang 2. Thanh toán : Có cho quay lại sửa đơn như hiện tại, Nếu khách hàng sửa đơn => Nhấn Tiếp tục thanh toán sẽ update lại booking 
+ Ở trang 2. Thanh toán: Nếu đặt trước 7 ngày sẽ disable Tỷ lệ thanh toán 50%
"
6. http://localhost:8080/customer/bookings
"Lịch sử đặt tour
1. Tab Hoàn thành chưa có Đánh giá tour
2. Tab Sắp khởi hành
- Những đơn chưa thanh toán sẽ có nút thanh toán, Sau 15p từ lúc tạo booking mà không tiến hành thanh toán sẽ chuyển sang Đã Hủy
- Những đơn đã thanh toán 50%, có nút thanh toán,có ghi chú thanh toán trước ngày [ngày khởi hành -7 ngày],  trước 7 ngày khởi hành không tiến hành thanh toán nốt cũng sẽ tự động hủy
- Khi nhấn btn Hủy => Kiểu tra điều kiện hủy để tính tiền hoàn => sau khi điền thông tin, nhấn btn Gửi yêu cầu hủy thì kiểm tra điều kiện hủy lần nữa để đảm bảo trường hợp treo popup quá thời gian hoàn tiền
3. Tab Đã hủy
Hiển thị thêm trạng thái hoàn tiền và số tiền đã hoàn
- Hiện chưa nối kết quả xác nhận Hoàn tiền từ bên Sales sang Khách hàng"
7. Trang chủ anh cho hiển thị giống giao diện cũ ấy ạ, hiện tại trống trải quá ạ :< (thêm thắt vừa phải đừng phá nát các tính năng hiện tại, trang trí + phụ họa hoạt họa hoặc cách hình thức làm bớt trống trải)
```
