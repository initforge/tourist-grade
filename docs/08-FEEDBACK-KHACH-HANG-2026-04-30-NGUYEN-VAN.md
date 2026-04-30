# Feedback Khách Hàng 2026-04-30 - Nguyên Văn

File này lưu nguyên văn feedback khách hàng do user cung cấp để làm nguồn đối chiếu khi sửa và test tuần tự. Không sửa nghĩa, không chuẩn hóa câu chữ trong phần nguyên văn.

## Nguyên Văn

```text
Còn cực kì nhiều feedback đến từ khách hàng
Bước đầu hãy chép nguyên văn full feedback của khách ra 1 docs rồi trong quá trình vừa làm vừa check tuần tự từng feedback
Nếu test thì phải test theo luồng, có điểm không đúng với feedback khách hàng phải ngồi code lại và check các code liên quan cực kĩ
Đừng để xảy ra lỗi UTF-8 hoặc là vỡ giao diện hoặc là gây lỗi các tính năng
Làm xong thì test phải test theo luồng, nghiêm ngặt và logic, không tuyến tính mà hãy linh hoạt nhiều case khác nhau để đáp ứng yêu cầu khách hàng 
Nếu role này dính role kia thì cũng test thật kĩ và đảm bảo chạy đúng luôn
Nếu cái nào đã fix trong code hoặc có rồi và test thành công rồi thì không cần sửanhiều, trừ khi các luồng liên quan dính dáng đến
Có feedback t cấp vị trí rõ ràng có cái logic thì t không cấp phải xác định rõ ràng trước khi sửa và fix 
Bây h đoạn dưới đây là nguyên văn các feedback của khách hàng t sẽ viết ra :
NV điều phối :
1. http://localhost:8080/coordinator/tour-programs/create
"Datepicker nên update tháng năm theo lăn chuột chứ ko chỉ nên bằng mỗi nút mũi tên lên xuống
Thêm trường Giá tour bao gồm và Giá tour không bao gồm với kiểu dữ liệu như Mô tả"
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
kiểu này là ảnh đính kèm : [Image #1] 
Và "- Danh sách khách sạn để chọn đang không lọc dựa trên hạng sao = tiêu chuẩn lưu trú
- Popup của cái danh sách tour trùng nên hiển thị đè lên cái bảng chứ ko phải nằm trong cái bảng khiến khi hover vào cái bảng giãn ra để chứa cái popup đó"
3. "Về trạng thái của chương trình tour (ở tab nháp)
- Chương trình sau khi gửi duyệt ở trạng thái Chờ duyệt
- Chương trình tour khi bị từ chối duyệt ở trạng thái Từ chối duyệt. Sau khi chỉnh sửa xong ấn Gửi duyệt mới chuyển trạng thái Chờ duyệt
- Chỉ có chương trình tour vừa mới tạo xong ấn lưu nháp thì mới ở trạng thái Nháp
- Cả 3 trạng thái Chờ duyệt, Nháp và Từ chối duyệt đều nằm ở tab Nháp
- Chỉ có chương trình tour trạng thái Chờ duyệt mới hiện màn Chờ duyệt của Quản lý"
4. http://localhost:8080/coordinator/tour-rules
"- Chưa cập nhật trạng thái Từ chối bán cho các tour previews nhưng ko đc tích chọn, đúng sẽ là các tour đó vẫn sẽ được tạo chỉ là ở trạng thái Từ chối bán 
- Thời gian mở bán đã xét chỉ xét các trạng thái Chờ duyệt bán, Yêu cầu chỉnh sửa, Đang mở bán và Từ chối bán (các trạng thái còn lại đã ko còn đc bán)
- Thời gian mở bán khả dụng chỉ tính trạng thái Đang mở bán 
- Giá vốn chưa được tính theo ngày trong tour 
- Thời điểm chuyển sang cảnh báo đang ảo:
+ Đáng ra khi chương trình tour vừa tạo thì chưa có cảnh báo vì nó đã được tạo sẵn với chương trình tour khi đc active r
+ Thời điểm cảnh báo phải được xác định khi người dùng vào màn quản lý tour và hệ thống detect thiếu coverage tại thời điểm hiện tại.
+ Khi detect chuyển sang Cảnh báo thì mới set warningDate.
+ Nếu đã có warningDate rồi thì không cập nhật lại.
+ Cần lưu trạng thái cảnh báo của chương trình tour để biết trước đó đã ở trạng thái gì (tránh set lại sai).
- Chưa tránh tạo tour nằm trong khoảng thời gian có đợt hủy và có Điểm khởi hành hoặc 1 trong các điểm tham quan thuộc phạm vi hủy 
- Các tour được chọn trong preview hiện tại đang được tự tạo thành mỗi tour 1 request trong khi đúng ra là các tour đó chỉ thuộc 1 request thôi"
5. http://localhost:8080/coordinator/tours/TI008/estimate
"- Dự toán ko hiểu sao lại vậy, không hiển thị Vận chuyển, Khách sạn, Vé tham quan
- Chi phí ăn là chọn 1 trong các dịch vụ ăn uống đã chọn ở Dự toán chương trình tour chứ ko phải chọn nhà cung cấp rồi chọn dịch vụ
- Xem ở dự toán giá của Chương trình tour thấy Dịch vụ ăn uống chưa chọn dịch vụ nào cơ mà lại hiện thị?
- Còn lại cũng vậy, kế thừa những j đã chọn từ Dự toán giá rồi thêm số lượng thôi ko hiểu sao lại như này
- Cập nhật bảng giá là hiện cái bút cạnh mỗi dòng chứ đâu phải 1 cái nút ấn vào r tự hiện thông báo chứ ko ra cái j
==> XEM LẠI WIREFRAME ĐỂ LÀM CHO ĐÚNG
- Cột “Nhà cung cấp” ở bảng danh sách ncc/dv dự kiến để chọn hiển thị dạng text-link; khi hover vào sẽ hiển thị thông tin liên lạc của nhà cung cấp (số điện thoại).
- Về cập nhật bảng giá:
+ Validate Từ ngày:
   +> Datepicker chỉ cho chọn từ Ngày hiện tại trở đi
   +> Nếu nhập tay ngày < Ngày hiện tại thì hiện lỗi ở dưới là Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại
+ Validate Đến ngày (optional):
   +> Default disable, chỉ khi nhập Từ ngày hợp lệ rồi mới enable 
   +> Datepicker chỉ cho chọn ngày từ Từ ngày trở đi
   +> Nếu nhập tay Đến ngày < Từ ngày thì hiện lỗi ở dưới là Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực
   +> Khi cập nhật Từ ngày, nếu Từ ngày mới > Đến ngày thì clear Đến ngày
+ Đơn giá hiện tại phải cập nhật theo khoảng thời gian đang chọn:
   +> Nếu người dùng chỉ nhập Từ ngày, hệ thống hiển thị các bảng giá đang có hiệu lực từ ngày đó trở đi.
   +> Nếu người dùng nhập cả Từ ngày và Đến ngày, hệ thống hiển thị các bảng giá có hiệu lực giao với khoảng thời gian đang chọn.
   +> Hiển thị các bảng giá có hiệu lực trong thời gian đó kiểu này
+ Quy tắc cập nhật bảng giá:
   +> Nếu Ngày hết hiệu lực = NULL → lưu = 31/12/9999
   +> Nếu OldStart >= NewStart AND OldEnd <= NewEnd → Set: Status = Hết hiệu lực
   +> Nếu OldStart < NewStart AND OldEnd >= NewStart AND OldEnd <= NewEnd → Update: OldEnd = NewStart - 1
   +> Nếu OldStart >= NewStart AND OldStart <= NewEnd AND OldEnd > NewEnd → Update: OldStart = NewEnd + 1
   +> Nếu OldStart < NewStart AND OldEnd > NewEnd → Split thành 2 bản ghi: 1. Old:  OldStart → NewStart - 1
                                                                                                                                2. New:  NewEnd + 1 → OldEnd (giữ nguyên đơn giá cũ)
   +> Nếu tồn tại giá cũ: OldEnd = 31/12/9999 → Khi insert giá mới: OldEnd = NewStart - 1"
https://docs.google.com/spreadsheets/d/11NpjdRJbR3TSKdPRRptNZle1sBZjNZgRvgMHp3v7dqQ/edit?gid=395606734#gid=395606734 - Đây là LINK WIREFRAME, PHẢI SCROLL FULL VÀ XEM HẾT ĐƯỢC CÁI WIREFRAME NÓ NTN 
6. http://localhost:8080/coordinator/tours
"Màn danh sách tour tab Phân công HDV
- Chưa gửi vào mail file cho hdv mà đang là auto tải xuống
- Tách riêng file Thông tin chung kèm Lịch trình-https://docs.google.com/document/d/1w8yjc4dtOkivAy2oxX4gM1FJRiU_Y3EJ/edit?usp=sharing&ouid=105509425587870214648&rtpof=true&sd=true và file Danh sách khách hàng-https://docs.google.com/spreadsheets/d/1SBUo0TcI_OotM2CBnZAfNUCbcVMhVmi6/edit?usp=sharing&ouid=105509425587870214648&rtpof=true&sd=true"
Cũng phải scroll từ đầu và lấy hết thông tin để thực hiện chính xác 
7. http://localhost:8080/coordinator/tours/TI004/settle
"Ko hiểu sao ko thấy dl ở bảng quyết toán cơ mà phân tích kết quả vẫn có :/
Quyết toán kế thừa thành tiền (đơn giá*số lần*số lượng) của Dự toán chi phí tour và điền thêm thực chi và ghi chú nếu có
Default Thực chi = Thành tiền quyết toán "
8. http://localhost:8080/coordinator/services
"- Hình thức giá là Báo giá thì Xem chi tiết ko có nút Thêm bảng giá hay Bảng giá
- Thêm mới/Chỉnh sửa dịch vụ mà chọn Hình thức báo giá thì ko cho điền Đơn giá
- Màn Thêm mới dịch vụ không có chỉnh sửa trạng thái
- Màn Sửa dịch vụ phải hiện bảng giá chứ không hiện đơn giá, bên cạnh mỗi dòng bảng giá có cái bút để ấn vô chỉnh sửa bản ghi bảng giá đó
- Thêm mới bảng giá:
+ Validate Từ ngày:
   +> Datepicker chỉ cho chọn từ Ngày hiện tại trở đi
   +> Nếu nhập tay ngày < Ngày hiện tại thì hiện lỗi ở dưới là Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại
+ Validate Đến ngày (optional):
   +> Default disable, chỉ khi nhập Từ ngày hợp lệ rồi mới enable 
   +> Datepicker chỉ cho chọn ngày từ Từ ngày trở đi
   +> Nếu nhập tay Đến ngày < Từ ngày thì hiện lỗi ở dưới là Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực
   +> Khi cập nhật Từ ngày, nếu Từ ngày mới > Đến ngày thì clear Đến ngày
+ Đơn giá hiện tại phải cập nhật theo khoảng thời gian đang chọn:
   +> Nếu người dùng chỉ nhập Từ ngày, hệ thống hiển thị các bảng giá đang có hiệu lực từ ngày đó trở đi.
   +> Nếu người dùng nhập cả Từ ngày và Đến ngày, hệ thống hiển thị các bảng giá có hiệu lực giao với khoảng thời gian đang chọn.
   +> Hiển thị các bảng giá có hiệu lực trong thời gian đó kiểu này
+ Quy tắc cập nhật bảng giá:
   +> Nếu Ngày hết hiệu lực = NULL → lưu = 31/12/9999
   +> Nếu OldStart >= NewStart AND OldEnd <= NewEnd → Set: Status = Hết hiệu lực
   +> Nếu OldStart < NewStart AND OldEnd >= NewStart AND OldEnd <= NewEnd → Update: OldEnd = NewStart - 1
   +> Nếu OldStart >= NewStart AND OldStart <= NewEnd AND OldEnd > NewEnd → Update: OldStart = NewEnd + 1
   +> Nếu OldStart < NewStart AND OldEnd > NewEnd → Split thành 2 bản ghi: 1. Old:  OldStart → NewStart - 1
                                                                                                                                2. New:  NewEnd + 1 → OldEnd (giữ nguyên đơn giá cũ)
   +> Nếu tồn tại giá cũ: OldEnd = 31/12/9999 → Khi insert giá mới: OldEnd = NewStart - 1"
9. http://localhost:8080/coordinator/suppliers
"- Màn xem chi tiết không xem được danh sách dịch vụ, danh sách dịch vụ hiện như này, màn chỉnh sửa thì thêm cái bút bên cạnh mỗi dòng bảng giá để chỉnh sửa  dòng bảng giá đó
- Nút Thêm mới bảng giá nằm trong màn sửa nhà cung cấp chứu ko nằm tách biệt ở ngoài màn xem chi tiết
- Màn thêm mới không có chỉnh sửa trạng thái
- Khu vực hoạt động của Khách sạn và Nhà hàng là dropdown chọn tỉnh thành không phải nhập tay
- khách sạn chưa có hạng sao
- Nhà cung cấp loại Vận chuyển (Xe và máy bay) ko có Đơn giá cũng như nút Thêm mới bảng giá. Loại vé máy bay không có khu vực hoạt động
- Thêm mới bảng giá:
+ Validate Từ ngày:
   +> Datepicker chỉ cho chọn từ Ngày hiện tại trở đi
   +> Nếu nhập tay ngày < Ngày hiện tại thì hiện lỗi ở dưới là Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại
+ Validate Đến ngày (optional):
   +> Default disable, chỉ khi nhập Từ ngày hợp lệ rồi mới enable 
   +> Datepicker chỉ cho chọn ngày từ Từ ngày trở đi
   +> Nếu nhập tay Đến ngày < Từ ngày thì hiện lỗi ở dưới là Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực
   +> Khi cập nhật Từ ngày, nếu Từ ngày mới > Đến ngày thì clear Đến ngày
+ Đơn giá hiện tại phải cập nhật theo khoảng thời gian đang chọn:
   +> Nếu người dùng chỉ nhập Từ ngày, hệ thống hiển thị các bảng giá đang có hiệu lực từ ngày đó trở đi.
   +> Nếu người dùng nhập cả Từ ngày và Đến ngày, hệ thống hiển thị các bảng giá có hiệu lực giao với khoảng thời gian đang chọn.
   +> Hiển thị các bảng giá có hiệu lực trong thời gian đó kiểu này
+ Quy tắc cập nhật bảng giá:
   +> Nếu Ngày hết hiệu lực = NULL → lưu = 31/12/9999
   +> Nếu OldStart >= NewStart AND OldEnd <= NewEnd → Set: Status = Hết hiệu lực
   +> Nếu OldStart < NewStart AND OldEnd >= NewStart AND OldEnd <= NewEnd → Update: OldEnd = NewStart - 1
   +> Nếu OldStart >= NewStart AND OldStart <= NewEnd AND OldEnd > NewEnd → Update: OldStart = NewEnd + 1
   +> Nếu OldStart < NewStart AND OldEnd > NewEnd → Split thành 2 bản ghi: 1. Old:  OldStart → NewStart - 1
                                                                                                                                2. New:  NewEnd + 1 → OldEnd (giữ nguyên đơn giá cũ)
   +> Nếu tồn tại giá cũ: OldEnd = 31/12/9999 → Khi insert giá mới: OldEnd = NewStart - 1"
danh sách dịch vụ hiện như này là ảnh đính kèm : [Image #2] 
trong thời gian đó kiểu này là ảnh đính kèm : [Image #3] 
10. http://localhost:8080/coordinator/tours
"Danh sách tour tab Đang khởi hành
Mỗi tour cần có nút Xem chi tiết và xem đc 4 tab Thông tin tour, Lịch trình, Danh sách khách hàng và Dự toán chi phí tour ở dạng read-only. cột nhà cung cấp trong dự toán vẫn dạng text-link như ở dự toán để hover vào
Danh sách tour tab Hoàn thành
Ấn vào cũng không hiển thị dữ liệu quyết toán"

Tiếp theo là role quản lý :
1. "- Thiếu nút hủy tour ở màn quản lý tour
- Khi ấn Hủy hiển thị popup yêu cầu nhập Thời gian hủy (Ngày bắt đầu, Ngày kết thúc); Thông báo lý do hủy; chọn danh tỉnh thành bị ảnh hưởng ở Phạm vi hủy và nút xác nhận
- Sau khi ấn Xác nhận, cập nhật trạng thái hủy ở các tour có Ngày bắt đầu tour <= Ngày kết thúc hủy AND Ngày kết thúc tour >= Ngày bắt đầu hủy VÀ có Điểm khởi hành hoặc 1 trong các Điểm tham quan thuộc Phạm vi hủy
- Cập nhật trạng thái booking của các tour bị hủy tương ứng là Đã hủy"
2. http://localhost:8080/manager/tour-programs
Ngừng kinh doanh xong chưa cập nhật lại trạng thái yêu cầu bán và các tour chưa có booking của chương trình tour đó thành đã hủy
3. http://localhost:8080/manager/tours
"- Ko hiểu sao request chỉ có 1 tour ấn vào hiện mấy tour lận
- Bỏ cái màu xám xám bên cạnh cái Yêu cầu chỉnh sửa (popup request Nháp có yêu cầu chỉnh sửa)
- Sau duyệt chưa cập nhật trạng thái tour ở TH Nếu yêu cầu chỉnh sửa thì lưu trạng thái yêu cầu (và các tour dự kiến) là Yêu cầu sửa"
cái màu xám xám là đính kèm ảnh : [Image #4] 
4. http://localhost:8080/manager/tours/TI003/estimate-approval
Không hiển thị dữ liệu
5. http://localhost:8080/manager/tours
Không hiển thị dữ liệu
6. http://localhost:8080/manager/tours
"- Hiển thị sai vì chỉ cần tour có status đang mở bán là bị đưa vào, không kiểm tra thực tế có thiếu khách hay không. Chỉ hiển thị ở đây khi hết hạn đặt tour mà số khách đặt dưới 10 ng
- Đồng thời, số khách hiện tại đang lấy từ expectedGuests (giá trị dự kiến), Dự kiến hoàn = expectedGuests * priceAdult -->không phải dữ liệu booking thật 
- Rule cập nhật trạng thái tour: Nếu đã qua hạn đặt:
                                                  + Nếu số khách đặt ≥ 10 và các booking đã confirm → Chờ nhận điều hành
                                                  + Nếu số khách đặt < 10 → Không đủ điều kiện khởi hành"
7. http://localhost:8080/manager/tour-programs
"Danh sách chương trình tour -> Ấn duyệt chương trình tour
Duyệt chương trình tour xong thì redirect về màn danh sách chương trình tour tab Đang hoạt động"
8. "Khi NV nhấn  Gửi phê duyệt thì Popup Gửi phê duyệt phải biến mất, đồng thời có thông báo Gửi phê duyệt thành công. 
Những tính năng liên quan đến voucher (thêm. sửa, xóa, gửi phê duyệt, phê duyệt) chưa có BE. Xóa đang k có popup xác nhận. 
Voucher có 6 trạng thái Nháp, Chờ phê duyệt, Không được phê duyệt, Sắp diễn ra, Đang diễn ra, Vô hiệu ạ 
Nếu Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày thì voucher chuyển trạng thái từ Nháp sang Không được phê duyệt với Lý do Quá hạn gửi phê duyệt. "

Tiếp theo là nhân viên kinh doanh :
1. http://localhost:8080/sales/bookings?tab=pending_confirm
"- Màn xác nhận yêu cầu hủy: 
+ Nếu NV k xác nhận yêu cầu hủy trong vòng 24h kể từ khi yêu cầu hủy được tạo, đơn sẽ tự động được chuyển trạng thái từ Cần xác nhận hủy sang Đã xác nhận
--> Vậy nên trong tab Cần Xác nhận hủy, đơn nào được tạo sớm nhất thì phải cho lên đầu"
2. http://localhost:8080/coordinator/tours/TI009/estimate
"- Thời điểm xác nhận hiển thị ở giao diện khác với DB (trong giao diện hiện 22:45:53 28/4/2026 và trong DB hiện 2026-04-28 15:45:53.774). Thời gian đang lệch nhau 7h. 
Hình như tất cả các thời điểm ghi log (tạo booking, hủy, xác nhân yêu cầu hủy,....) trong db đều lệch so với giao diện 7h ạ 
- Khi ấn xác nhận thành công thì Hệ thống CHƯA gửi mail cho khách hàng thông báo Đơn đặt tour đã được xác nhận. (MAIL CẦN PHẢI CÓ NỘI DUNG ĐƠN ĐẶT TOUR KÈM DANH SÁCH HÀNH KHÁCH)
Quy tắc nhảy sang màn (Điều hành tour/ Chờ dự toán/ Danh sách hành khách) khi đơn đã được xác nhận như sau: 
Khi tour đủ điều kiện khởi hành + hết hạn đặt tour + NV kinh doanh xác nhận hết các booking của tour ấy thì danh sách hành khách mới của tour mới hiện trong màn Danh sách hành khách. 
- Khi khách đặt cọc thành công (tức thanh toán 50%), ban đầu đơn nhảy sang Tab Cần xác nhận đặt, nhưng sau 15p nhảy sang tab Đã hủy. 
--> CẦN CHỈNH LẠI QUY TẮC THANH TOÁN NHƯ SAU: 
+ Nếu khách đặt tour trong vòng 7 ngày trước ngày khởi hành, hệ thống chỉ cho phép chọn hình thức thanh toán 100% giá tour.
+ Nếu khách đặt tour trước ngày khởi hành trên 7 ngày, khách có thể chọn thanh toán 50% hoặc thanh toán 100% giá tour. Trường hợp khách chọn thanh toán 50%, phần tiền còn lại phải được hoàn tất chậm nhất 7 ngày trước ngày khởi hành. Nếu khách không thanh toán đầy đủ đúng hạn, hệ thống tự động chuyển trạng thái đơn từ Chờ xác nhận/ Đã xác nhận sang Đã hủy. Lý do hủy được ghi nhận là: Không thanh toán đầy đủ trước 7 ngày khởi hành."
3.http://localhost:8080/sales/bookings?tab=completed
Trang Quản lý booking/ Tab Hoàn thành, khi ngày khởi hành + thời gian tour tức ngày kết thúc của tour đã qua thì chuyển những đơn nào đặt tour ấy có trạng thái Đã xác nhận thành Hoàn thành 
4. http://localhost:8080/manager/tours
"- Khi NV kinh doanh xác nhận hủy thành cồng thì  hệ thống chưa gửi mail cho khách hàng thông báo Yêu cầu hủy đã được xác nhận. 
- Khi Quản lý hủy tour bên màn Quản lý tour/ Không đủ điều kiện khởi hành   thì các booking liên quan sẽ bị hủy, chuyển trạng thái từ Đã xác nhận thành Đã hủy với  lý do hủy là Không đủ điều kiện khởi hành và Số tiền hoàn là 100%. Ở chi tiết những đơn hủy (đến từ phía Quản lý) thì sẽ k có phần Thông tin hoàn tiền. Quy tắc tải ảnh hoàn lên như hiện tại là đúng r ạ. 
- Khi Quản lý hủy tour ơ màn Quản lý tour  thì các booking liên quan sẽ bị hủy, chuyển trạng thái từ Đã xác nhận thành Đã hủy với  lý do hủy là Bất khả kháng và Số tiền hoàn là 100%. Ở chi tiết những đơn hủy (đến từ phía Quản lý) thì sẽ k có phần Thông tin hoàn tiền. Quy tắc tải ảnh hoàn lên như hiện tại là đúng r ạ. "
5 Trong dropdown chọn Chương trình tour thì chỉ những Chương trình tour nào có trạng thái Active mới được hiển thị trong dropdown
6. Đơn nào mà chưa thanh toán thì sẽ chuyển thông tin đơn sang trang Quản lý booking (Cần xác nhận đặt) nhưng trạng thái thanh toán là Chưa thanh toán. Nếu sau 15p mà k thanh toán thì đẩy sang tab Đã hủy với lý do Quá hạn thanh toán giữ chỗ. Khi sang tab đã hủy thì trạng thái hoàn tiền để là Hoàn thành luôn.
7. http://localhost:8080/sales/bookings/cmoisdlzi0011o646uqaiksnq?tab=cancelled
chưa nhận được mail

Cuối cùng là khách hàng :
1. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao
"Trang chi tiết tour 
2. Thông tin lịch khởi hành lấy từ DB với những tourInstance có status là DANG_MO_BAN
- Nếu không có lịch khởi hành thì hiển thị dòng chữ giữa bảng 
"" Lịch khởi hành đang cập nhật
Lưu yêu thích để nhận thông báo sớm nhất ""
5. Giao diện
- Ảnh của tour vẫn lệch nhau => ăn chỉnh lại bố cục Bento Grid để cột trái và cột phải bằng nhau, thêm các chi tiết như bo góc, hiệu ứng hover để trông chuyên nghiệp hơn.,khi người dùng nhấn vào bất kỳ ảnh nào, một cửa sổ popup sẽ hiện ra để họ lướt xem toàn bộ ảnh.
- Icon chỗ lịch trình chi tiết bị lệch
"
3. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-4
"Trang Đặt tour  VẪN LỖI
Lỗi 1  Dữ liệu booking bị lưu trong Local Storage => lỗi mỗi khi vào đặt tour đó
Hiện tại: Ngoài thanh toán thành công, tất cả các trường hợp khác đều lưu thông tin đặt draft => Đăng nhập khác tài khoản vẫn hiện thông tin đặt của người khác 
Sửa mong muốn: Lưu draft và khôi phục khi đặt lại đúng lịch khởi hành tour theo quy tắc sau
- Nếu chưa thoát màn đặt tour => có hiện thị drafr
Nếu đã thoát khỏi màn đặt tour thì: 
- Nếu điền thông tin đặt tour ở mục 1. Thông tin, chưa nhấn nút Tiến hành thanh toán để sang 2.Thanh toán  => Không cần lưu, k cần khôi phục ( Vì còn liên quan đến số chỗ trống)
- Nếu điền thông tin đặt tour ở mục 1. THông tin, đã nhấn nút Tiến hành thanh toán dể sang 2.Thanh toán ( Đã tạo booking) nhưng chưa thanh toán :  
 + TH1: Đơn booking cũ chưa bị hủy ( trong db ) => Hiển thị thông báo hỏi "" Bạn có thông tin đặt Tour dang dở. Bạn muốn khôi phục hay đặt mới?"" . Nếu không đồng ý thì xóa thông tin cũ, nếu đồng ý thì khôi phục all dữ liệu, ở sẵn màn 2.Thanh toán để người dùg thanh toán nốt đơn đang 
 + TH2: Đơn booking cũ đã bị hủy ( do quá thời gian 15p không thanh toán thành công) => Xóa draft, Không khôi phục ( Vì còn liên quan đến số chỗ trống)
- Nếu đã thanh toán thành công => xóa hết ( Hiện tại đã ok)
- Nếu ĐĂNG XUẤT => LUÔN XÓA DRAFT


Lỗi 2: Booking thành công chưa có mail về cho khách

Lỗi 3: Giao diện
- Thông tin hành khách để bố cục như demo trước, hiện form thông tin tách làm 3 dòng tốn chỗ










"
[Image #5] 
4. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=TP001-TI011
"Đặt tour :  
Thỉnh thoảng Gặp tình trạng Unautherized khi update đơn booking, do update vô db thiếu userID dù đang đăng nhập
[Image #6] 


"
5.http://localhost:8080/customer/bookings
"Lịch sử đặt tour
 Tab Đã hủy: chưa xem được ảnh bill hoàn tiền"
6. "Trang chủ làm đẹp, font chữ, màu chữ thống nhất:
Header
Banner + Search ở chính giữa ( Điểm đến, Thời gian, Ngân sách)
Tour hot (6 tour Nhiều lượt booking nhất)
Tour theo Điểm đến ( Miền Bắc, Trung, Nam)
Khuyến mãi ( Tour đang được áp voucher giảm giá) 
Lý do chọn Travela
Đánh giá tour
Blog
Footer"
7. "Tổng tiền tính sai 
1. Đặt tour với số lượng khách tối đa ( chỗ trống =2)
2. Điền đầy đủ thông tin hành khách tại mục 1. Thông tin  => Nhấn btn Tiếp tục thanh toán => Sang mục 2. Thanh toán
3. Nhấn btn Quay lại sửa đơn để quay lại mục 1 THông tin và chỉnh sửa thông tin => Nhấn Tiếp tục thanh toán => Sang 2. Thanh toán
4. Áp mã giảm giá, quan sát tổng tiền
Kết quả hiện tại
2. Khi nhấn Áp dụng mã giảm giá => Kiểm tra slot trống, Trả sai thông báo, không tính lại giá tiền
3. Khi nhấn Thanh toán => Lại áp dụng được mã giảm giá , tính lại số tiền nhưng đã chuyển sang cổng thanh toán rồi
Kết quả mong muốn: 
Khi nhấn áp dụng mã giảm giá => Áp mã giảm giá "
8. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=TP001-TI011
"Màn đặt tour
Khi nhấn btn Tiến hành thanh toán => Kiểm tra slot trống mà không đủ thì phải cập nhật lại số slot trống tại mục Số lượng hành khách luôn để khách biết và sửa"
9.http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=TP001-TI011
"Màn đặt tour a bổ sugn giúp em validate Số lượng hành khách:
- 2 người lớn chỉ được kèm 1 em bé dưới 2 tuổi, em bé thứ 2 tính giá như trẻ em ( từ 2-11 tuổi)
- 2 người lớn chỉ được kèm 1 trẻ em, trẻ thứ 2 => Hiện thông báo: Có thể phát sinh phụ phí , từ trẻ thứ 3 => tính giá người lớn"
10. "Các tour trong danh sách  tour yêu thích, email đến khách nếu
- Tour giảm giá
- Có lịch khởi hành mới "
11. http://localhost:8080/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao
"Hiện tại: Chưa cập nhật lại màn Chi tiết tour mỗi khi nhấn xem chi tiết tour => Không hiển thị lịch khởi hành mới nhất mà phải reload trang mới tải lại
Mong muốn: Call APi load màn chi tiết tour để hiển thị lịch khởi hành mới nhất mỗi khi mở màn chi tiết tour 
Tương tự với màn Lịch sử đặt tour-http://localhost:8080/customer/bookings "
Test email thì test ít thôi cỡ 2-3 email rồi đăng nhập dô emailJS với Elderfate@proton.me-EmailJSID22# rồi xem thử nó đã gửi những email gì ? Đúng chưa có cần tạo template riêng cho các case không rồi hoàn thiện cho full case chứ còn có 22 lượt gửi phải tiết kiệm 
Nếu có test thì để thông tin trên web sao cho nó gửi email tới linhthaitu22@gmail.com
```

## Checklist Tuần Tự

- [x] NV điều phối 1: Datepicker scroll tháng/năm, thêm Giá tour bao gồm / không bao gồm. Test: frontend build, backend build, `npx vitest run src/lib/public-tours.test.ts src/routes/tour-programs.test.ts`.
- [x] NV điều phối 2: Giá và cấu hình chương trình tour. Đã sửa và test live FE-BE-DB: zero-night không hiện khách sạn, HDV nhập tay, lọc khách sạn theo hạng sao, chọn xe theo số chỗ, không chọn trùng dịch vụ ăn/vé, bảo hiểm có mặc định, popup tour trùng không làm giãn bảng và không còn duplicate key.
- [x] NV điều phối 3: Trạng thái chương trình tour trong tab Nháp. Code hiện có đã đúng: Điều phối lọc `status=draft` và hiển thị theo `approvalStatus`, Manager chỉ hiển thị `status=draft && approvalStatus=pending`, submit/reject backend set pending/rejected. Test: backend build, `npx vitest run src/routes/tour-programs.test.ts`.
- [x] NV điều phối 4: Tour rules. Đã test live FE-BE-DB: unchecked preview tạo tour trạng thái Từ chối bán; thời gian mở bán theo đúng nhóm trạng thái; khả dụng chỉ tính Đang mở bán; chặn đợt hủy theo ngày/phạm vi; một lượt preview được gom chung `saleRequest.id`; warning state có `coverageWarningStatus`, `coverageWarningDate`, `coveragePreviousStatus`.
- [x] NV điều phối 5: Dự toán tour và cập nhật bảng giá theo wireframe. Đã test live FE-BE-DB: TI008 hiển thị đủ nhóm chi phí, kế thừa dịch vụ đã chọn, NCC là text-link hover SĐT/email, bút cập nhật bảng giá từng dòng, validate ngày và overlap rule ở BE.
- [x] NV điều phối 6: Phân công HDV, gửi mail file riêng. Đã test live FE-BE-DB: FE không auto download, BE queue `guide_assignment`, DB lưu assigned guide và email outbox có 2 file riêng `thong-tin-lich-trinh` + `danh-sach-khach`.
- [x] NV điều phối 7: Quyết toán kế thừa dự toán. Đã test live FE-BE-DB: TI004 có bảng quyết toán, default Thực chi = Thành tiền quyết toán, lưu/reload không mất dòng dự toán.
- [x] NV điều phối 8: Services và bảng giá.
- [x] NV điều phối 9: Suppliers và bảng giá.
- [x] NV điều phối 10: Danh sách tour đang khởi hành / hoàn thành.
- [x] Quản lý 1-8: Hủy tour, trạng thái request/tour, dữ liệu estimate/tours, voucher.
- [x] Nhân viên kinh doanh 1-7: Booking, email, payment deadline, completion, dropdown active.
- [x] Khách hàng 1-11: Chi tiết tour, đặt tour, draft booking, trang chủ, voucher, slot, validate khách, favorite email, reload dữ liệu.
- [x] EmailJS: Đã gửi thật đúng 2 email tới `linthaitu22@gmail.com`, kiểm trên dashboard EmailJS đều OK.

## Kết quả test lại 2026-04-30

Nguyên tắc đang áp dụng: một feedback chỉ được tính là pass khi đã đối chiếu đủ FE, BE và DB hoặc có test tự động bao đúng logic backend kèm E2E FE cho màn liên quan.

- Build và unit/integration: backend `npm run build` pass; frontend `npm run build` pass; backend `npm test` pass 13 files / 59 tests.
- Live E2E chính: `npx playwright test tests/coordinator-live-e2e.spec.ts tests/reported-feedback-live.spec.ts tests/sales-manager-live-e2e.spec.ts tests/real-user-journeys.spec.ts tests/customer-live-e2e.spec.ts --config=playwright.manual.config.ts --workers=1` pass 34/34, không còn console warning duplicate key hoặc `img src=""`.
- UTF-8: scan `backend/prisma/seed.ts`, `backend/src`, `frontend/src`, docs feedback chỉ còn pattern mojibake cố ý trong test normalizer và code detect ký tự lỗi; chưa thấy lỗi UTF-8 thực tế trong source cần sửa.
- NV điều phối, dự toán TI008: FE hiển thị đủ Vận chuyển/Khách sạn/Chi phí ăn/Vé thắng cảnh/Hướng dẫn viên/Chi phí khác/Bảo hiểm; BE lưu estimate; DB có `costEstimateJson.estimate.categories.length = 6`. Ảnh: `coordinator-ti008-estimate-e2e.png`.
- NV điều phối, quyết toán TI004: FE có bảng quyết toán, thực chi default từ dự toán; BE lưu settlement; DB có `settlementJson.actualCosts`. Ảnh: `coordinator-ti004-settlement-e2e.png`.
- NV điều phối, dịch vụ/nhà cung cấp: FE kiểm tra dịch vụ báo giá không có bảng giá, dịch vụ niêm yết có bảng giá; supplier khách sạn có hạng sao và danh sách dịch vụ; backend test overlap/validate bảng giá pass. Ảnh: `coordinator-service-quoted-e2e.png`, `coordinator-service-listed-e2e.png`, `coordinator-supplier-hotel-e2e.png`.
- NV điều phối, phân công HDV: FE không auto download; BE queue email `guide_assignment`; DB lưu assigned guide và email outbox có 2 file riêng `thong-tin-lich-trinh` + `danh-sach-khach`.
- NV điều phối, tour đang khởi hành/hoàn thành: FE đã mở tab Đang khởi hành, xem chi tiết read-only đủ 4 tab; tab Dự toán dùng dữ liệu DB thật và nhà cung cấp là text-link hover SĐT. DB đã bổ sung `costEstimateJson` thật cho TI001 và seed đã được sửa tương ứng. FE tab Hoàn thành mở quyết toán TI004 có dữ liệu. Ảnh: `coordinator-running-detail-supplier-hover-e2e.png`, `coordinator-completed-settlement-e2e.png`.
- Quản lý, hủy tour: FE có popup ngày bắt đầu/kết thúc, lý do, phạm vi tỉnh; BE cascade hủy tour/booking; DB TI010 và booking liên quan cập nhật hủy, refund NOT_REQUIRED; email outbox có mail xác nhận hủy khách. Ảnh: `manager-cancel-popup-e2e.png`.
- Quản lý, không đủ điều kiện khởi hành và estimate approval: FE tab không đủ điều kiện dùng số khách booking thật, không dùng expectedGuests; BE/DB đối chiếu booking count; màn duyệt dự toán TI003 có dữ liệu. Ảnh: `manager-underfilled-e2e.png`, `manager-estimate-approval-e2e.png`.
- Quản lý, duyệt chương trình tour: FE duyệt TP003 và redirect về `/manager/tour-programs?tab=active`; BE approve; DB TP003 `status=ACTIVE`, `approvalStatus=approved`. Ảnh: `manager-program-approve-redirect-active-e2e.png`.
- Voucher: FE sales tạo/gửi phê duyệt, popup đóng và hiện thông báo; BE tạo voucher pending; DB voucher `E2E073859` từ `PENDING_APPROVAL` sang `ACTIVE` sau khi manager duyệt; FE manager duyệt thành công. Ảnh: `sales-voucher-send-approval-e2e.png`, `manager-voucher-pending-e2e.png`, `manager-voucher-after-approve-e2e.png`.
- Tour rules, đợt hủy: FE manager tạo đợt hủy theo thời gian/phạm vi Quảng Ninh; BE lưu `SpecialDay.occasion = TOUR_CANCELLATION_SCOPE`; FE coordinator preview TP001 trong 01/06/2026-10/06/2026 bị chặn bởi đợt hủy; DB không tạo tour TP001 trong khoảng bị chặn. Ảnh: `manager-cancel-scope-window-e2e.png`, `coordinator-tour-rules-cancel-window-block-e2e.png`, `coordinator-tour-rules-cancel-window-no-create-e2e.png`.
- Tour rules, request group/cảnh báo: FE tạo preview TP002/Amanoi 02/07/2026-12/07/2026 có 4 tour cùng `saleRequest.id = SR-TP002-1777548315532`; manager thấy 1 request, popup có 4 tour, yêu cầu chỉnh sửa cập nhật cả 4 tour sang `YEU_CAU_CHINH_SUA`. DB chương trình lưu `coverageWarningStatus=warning`, `coverageWarningDate=2026-04-30`, `coveragePreviousStatus=ok`.
- Sales booking: FE tab cần xác nhận hủy sort booking cũ lên trước, detail xác nhận hủy; BE/DB cập nhật B002 hủy và email outbox; BE xác nhận booking B001 có outbox mail xác nhận kèm passenger payload. Ảnh: `sales-pending-confirm-list-e2e.png`, `sales-booking-cancel-detail-e2e.png`.
- Khách hàng: FE trang chủ/tour detail/gallery/checkout/promo/draft/logout/customer cancelled bill đã test; BE tạo/update booking; DB booking checkout có `userId`, discount, passenger quốc tịch UTF-8 đúng; cancelled booking có refund bill. Ảnh: `public-home-e2e.png`, `public-tour-detail-gallery.png`, `customer-checkout-promo.png`, `customer-bookings-cancelled-bill.png`.
- EmailJS thật: đã gửi 2 email tới `linthaitu22@gmail.com`: `booking_confirmed` cho `E2E-MAIL-CONFIRM-001` và `booking_cancel_confirmed` cho `E2E-MAIL-CANCEL-001`; dashboard EmailJS đều status OK, còn 19 lượt.

Các điểm còn lại:

- Không còn feedback nào đang biết là chưa xử lý hoặc chưa test trong phạm vi codebase/local FE-BE-DB hiện tại.
- DB local đã bị mutate bởi E2E: TP003 active, TI010/BK-931389 bị hủy, TI001 được bổ sung estimate, B001/B002 thay đổi trạng thái, voucher E2E đã tạo/duyệt, special day `CXL573425`, sale request `SR-TP002-1777548315532`, email outbox có các mail test. Nếu cần quay trạng thái mẫu sạch thì chạy lại seed sau khi chốt nghiệm thu.
