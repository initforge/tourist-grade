1. ## **Mô tả tính năng Tạo mới chương trình tour (NV điều hành)**

   ### **1\. Truy cập module**

Người dùng chọn module **Quản lý chương trình tour**.  
Hệ thống hiển thị danh sách các chương trình tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Nháp**.  
Hệ thống hiển thị danh sách các chương trình tour đang ở trạng thái Nháp \+ Từ chối phê duyệt do chính người dùng tạo.  
Người dùng nhấn nút **Thêm mới**.  
Hệ thống hiển thị giao diện **Thêm mới chương trình tour**.  
---

## **2\. Bước 1 – Nhập thông tin chung**

Tại bước này, hệ thống yêu cầu người dùng nhập và lựa chọn các thông tin sau:

* **Tên chương trình**  
* **Thời lượng tour**, gồm:  
  * Số ngày  
  * Số đêm  
    Điều kiện: **Số ngày không được chênh số đêm quá 1**  
* **Mô tả**  
* **Điểm khởi hành**  
* **Điểm đến** (cho phép chọn nhiều giá trị)  
* **Kiểu chu kỳ**: SEASONAL hoặc YEAR\_ROUND

Tùy theo giá trị được chọn ở **Kiểu chu kỳ**, hệ thống hiển thị phần **quy tắc tạo tour** tương ứng.

### **2.1. Trường hợp kiểu chu kỳ \= SEASONAL**

Hệ thống cho phép người dùng chọn **1 trong 2 cách tạo ngày khởi hành**: **thủ công** hoặc **tự động**.  
Tùy theo lựa chọn của người dùng, hệ thống hiển thị phần tiếp theo.

#### **a. Chọn ngày khởi hành thủ công**

Hệ thống hiển thị lịch để người dùng chọn các **ngày khởi hành**.

#### **b. Tự sinh tour tự động**

Hệ thống cho người dùng chọn:

* **Ngày bắt đầu bán** từ lịch  
* **Ngày ngừng kinh doanh** từ lịch

Hệ thống cho phép chọn **Loại khởi hành**:

* DAILY  
* WEEKLY\_SCHEDULE

Nếu người dùng chọn WEEKLY\_SCHEDULE, hệ thống hiển thị các **thứ trong tuần** để người dùng chọn các **ngày khởi hành trong tuần**.

### **2.2. Trường hợp kiểu chu kỳ \= YEAR\_ROUND**

Hệ thống cho người dùng chọn:

* **Ngày bắt đầu bán** từ lịch

Hệ thống yêu cầu người dùng nhập:

* **Số tour sinh trước**

Hệ thống cho phép chọn **Loại khởi hành**:

* DAILY  
* WEEKLY\_SCHEDULE

Nếu người dùng chọn WEEKLY\_SCHEDULE, hệ thống hiển thị các **thứ trong tuần** để người dùng chọn các **ngày khởi hành trong tuần**.

### **2.3. Rà soát danh sách ngày khởi hành dự kiến**

Sau khi người dùng nhập đủ thông tin về **quy tắc tạo tour**, hệ thống tự động hiển thị **danh sách các ngày khởi hành dự kiến** để người dùng rà soát và **xóa bớt các ngày không mong muốn**.  
Người dùng nhấn **Tiếp theo** để chuyển sang **Bước 2 – Nhập lịch trình**.  
Hệ thống kiểm tra tính **đầy đủ** và **hợp lệ** của các thông tin đã nhập ở bước 1\. Nếu không đạt thì **hiện cảnh báo** và **không cho qua Bước 2**.  
---

## **3\. Bước 2 – Nhập lịch trình**

Hệ thống tự động hiển thị số lượng ô nhập nội dung tương ứng với **số ngày của tour** đã khai báo ở bước trước.  
Mỗi ô yêu cầu người dùng nhập:

* **Tiêu đề**  
* **Mô tả**

Người dùng nhấn **Tiếp theo** để chuyển sang **Bước 3 – Dự toán chương trình tour**.  
---

## **4\. Bước 3 – Dự toán chương trình tour [Wireframe](https://docs.google.com/spreadsheets/d/11NpjdRJbR3TSKdPRRptNZle1sBZjNZgRvgMHp3v7dqQ/edit?usp=sharing)**

Tại bước này, hệ thống hiển thị **2 mục**:

1. **Thông tin cấu hình giá tour**  
2. **Bảng kê chi phí**

   ### **4.1. Thông tin cấu hình giá tour**

Hệ thống yêu cầu người dùng nhập các thông tin sau:

* **Số lượng khách dự kiến**  
* **Tỷ lệ lợi nhuận mong muốn**  
* **% Thuế** (mặc định \= **10%**)  
* **Hệ số chi phí khác** (mặc định \= **15%**)

  ### **4.2. Bảng kê chi phí**

Bảng kê chi phí gồm **6 khoản mục**, tương ứng với **6 bảng**:

1. **Vận chuyển**  
2. **Khách sạn**  
3. **Chi phí ăn**  
4. **Hướng dẫn viên**  
5. **Vé thắng cảnh**  
6. **Chi phí khác**  
   ---

   ## **5\. Khoản mục Vận chuyển**

Người dùng nhấn **Thêm mới** tại khoản mục **Vận chuyển**.  
Hệ thống hiển thị popup danh sách **dịch vụ vận chuyển** với các thông tin:

* **Tên dịch vụ**  
* **Loại**  
* **Mô tả**  
* **Hình thức giá**

Người dùng chọn **một hoặc nhiều dịch vụ**.  
Người dùng nhấn **Lưu**.  
Hệ thống thêm các dịch vụ đã chọn vào bảng khoản mục vận chuyển. Mỗi dịch vụ được hiển thị với các trường:

* **Tên dịch vụ**  
* **Loại**  
* **Mô tả** (cho phép nhập nếu chưa có)  
* **Đơn giá áp dụng** (nếu chưa có giá thì để trống)

Bên dưới mỗi dịch vụ, hệ thống hiển thị phần **expand cấu hình giá**.  
Tùy theo **Hình thức giá** của dịch vụ, hệ thống hiển thị giao diện chi tiết tương ứng.

### **5.1. TH1 – Báo giá nhà cung cấp**

Áp dụng cho:

* Các dạng xe vận chuyển kèm tùy chọn 16 chỗ/ 29 chỗ/ 45 chỗ

Hệ thống hiển thị bảng báo giá với các cột:

* **Nhà cung cấp**  
* **Dịch vụ**  
* **Báo giá**  
* **Ghi chú**  
* **NCC chính**

Có nút **Thêm mới nhà cung cấp**.

#### **Luồng xử lý**

Người dùng nhấn **Thêm mới nhà cung cấp**.  
Hệ thống hiển thị popup danh sách nhà cung cấp có **khu vực hoạt động bao phủ toàn bộ các điểm đến của chương trình**. Popup bao gồm các thông tin: **Nhà cung cấp, Số điện thoại, Đánh giá nội bộ, Số lần hợp tác** và **Lần hợp tác gần nhất**.  
Người dùng chọn **một hoặc nhiều nhà cung cấp**.  
Hệ thống hiển thị bảng báo giá dưới dạng danh sách, trong đó các dòng dữ liệu được nhóm theo từng nhà cung cấp. Mỗi nhà cung cấp bao gồm các dịch vụ tương ứng mà họ cung cấp.  
Hệ thống yêu cầu người dùng nhập:

* **Giá báo**  
* **Ghi chú** (nếu có)

Người dùng chọn **một nhà cung cấp** để áp dụng bằng cách tích **radio button** ở cột **Nhà cung cấp chính**.  
Hệ thống cập nhật:

* **Đơn giá áp dụng \= Giá báo của dịch vụ tùy chọn, có sức chứa tương ứng với số khách dự kiến, từ nhà cung cấp được chọn. *(VD dự kiến 25 khách thì tính đơn giá theo dịch vụ xe 29 chỗ)***

  ### **5.2. TH2 – Chọn giá danh mục**

Áp dụng cho:

* Tàu tham quan  
* Cano  
* Các dịch vụ có giá ổn định

Hệ thống hiển thị bảng giá với các cột:

* **Nhà cung cấp**  
* **Đối tượng**  
* **Đơn giá**  
* **Ghi chú**  
* **NCC chính**

Cách hiển thị:

* Nếu kiểu đối tượng là tất cả → hệ thống sinh ra **1 dòng**, trong đó trường **Đối tượng** được tự động điền là **“Tất cả”**  
* Nếu kiểu đối tượng là **Người lớn và trẻ em** → hệ thống sinh ra **2 dòng**, trong đó trường **Đối tượng** được tự động điền lần lượt là **“Người lớn”** và **“Trẻ em”**

  #### **Luồng xử lý**

Hệ thống tự động hiển thị **danh sách giá kèm nhà cung cấp**.  
Người dùng chọn **1 bản ghi** bằng **radio button**.  
Hệ thống cập nhật:

* **Đơn giá áp dụng** theo bộ giá của bản ghi được chọn

Cách hiển thị đơn giá:

* Nếu kiểu đối tượng là tất cả →  xxx  
* Nếu kiểu đối tượng là **Người lớn và trẻ em** → NL: xxx / TE: xxx

  ### **5.3. TH3 – Nhập tay theo đối tượng**

Áp dụng cho:

* Vé máy bay  
* Tàu hỏa vận chuyển

Hệ thống hiển thị bảng nhập giá gồm các trường:

* **Nhà cung cấp**  
* **Nguồn tham khảo**  
* **Đối tượng**  
* **Đơn giá**  
* **Ghi chú**

Cách hiển thị:

* Nếu kiểu đối tượng là tất cả → hệ thống sinh ra **1 dòng**, trong đó trường **Đối tượng** được tự động điền là **“Tất cả”**  
* Nếu kiểu đối tượng là **Người lớn và trẻ em** → hệ thống sinh ra **2 dòng**, trong đó trường **Đối tượng** được tự động điền lần lượt là **“Người lớn”** và **“Trẻ em”**

  #### **Luồng xử lý**

Hệ thống tự động sinh các dòng theo cấu hình dịch vụ.  
Người dùng nhập **đơn giá** cho từng dòng.  
Hệ thống cập nhật:

* **Đơn giá áp dụng** hiển thị theo bộ giá đã nhập  
  ---

  ## **6\. Khoản mục Chi phí ăn**

Hệ thống hiển thị bảng với các trường:

* **Nhà cung cấp**  
* **Địa chỉ**  
* **Dịch vụ**  
* **Đơn giá**  
* **Cập nhật gần nhất**  
* **Dịch vụ chính**

Bảng được chia theo **ngày**, với số ngày bằng **số ngày đã nhập ở Thời lượng tour**.  
Trong mỗi ngày, bảng tiếp tục được chia theo **các bữa ăn**.  
Người dùng có thể chọn bữa nào sẽ được bao gồm trong từng ngày bằng cách chọn giá trị **Bao gồm** ở phần header của mỗi ngày, với các giá trị:

* **Bữa sáng**  
* **Bữa trưa**  
* **Bữa tối**

Cách chọn là **checkbox cho phép chọn nhiều giá trị**:

* Nếu chọn bữa nào thì hệ thống thêm **phân vùng** cho bữa đó  
* Nếu bỏ chọn bữa nào thì phân vùng bữa đó của ngày tương ứng sẽ biến mất

Người dùng chọn các **dịch vụ ăn tiềm năng** cho từng bữa theo từng ngày.  
Tại mỗi vùng bữa ăn theo ngày, khi người dùng nhấn **Thêm mới**, hệ thống hiển thị popup danh sách **dịch vụ ăn** đã được lọc theo **điểm đến của chương trình**.  
Ràng buộc:

* Danh sách chỉ được lọc theo **1 điểm đến**  
* Người dùng chỉ có thể chọn **một loạt dịch vụ thuộc cùng 1 điểm đến** cho **1 bữa trong 1 ngày**  
* Người dùng có thể thay đổi bộ lọc trong các giá trị **điểm đến**

Người dùng chọn **một hoặc nhiều dịch vụ ăn** và nhấn **Lưu**.  
Hệ thống ghi nhận các dịch vụ đã chọn vào **vùng bữa tương ứng**.  
Trong số các bản ghi đã chọn, người dùng chọn **1 dịch vụ chính** bằng **radio button**.  
Hệ thống cập nhật:

* **Đơn giá bữa ăn** hiển thị theo **Đơn giá của bản ghi được chọn**  
  ---

  ## **7\. Khoản mục Khách sạn**

Số đêm lưu trú của tour được tính theo công thức:

* **Số đêm lưu trú \= Số ngày của Thời lượng tour \- 1**

Trước khi cho phép chọn danh sách **nhà cung cấp dự kiến**, hệ thống yêu cầu người dùng nhập đầy đủ **Thông tin lưu trú**, gồm:

* **Tiêu chuẩn lưu trú**: chọn từ **2 sao đến 5 sao**  
* **Thiết lập lưu trú**: chọn 1 trong 3 giá trị:  
  1. **1 khách sạn xuyên suốt**  
  2. **Mỗi đêm 1 khách sạn**  
  3. **Tự chia nhóm lưu trú**

Tùy theo lựa chọn của **Thiết lập lưu trú**, hệ thống hiển thị cách chia bảng danh sách các nhà cung cấp dự kiến như sau:

* Nếu chọn **1 khách sạn xuyên suốt** → bảng **không có phân vùng**  
* Nếu chọn **Mỗi đêm 1 khách sạn** → bảng được chia thành số vùng bằng **số đêm lưu trú**  
* Nếu chọn **Tự chia nhóm lưu trú** → hệ thống hiển thị popup thiết lập nhóm (nếu tour chỉ có 1-2 đêm lưu trú thì message là quá ít ngày để chia nhóm)

  ### **7.1. Popup thiết lập nhóm lưu trú**

Popup hiển thị **danh sách các đêm** và chèn sẵn **1 vách ngăn** giữa danh sách để chia thành **2 nhóm**.  
Người dùng có thể:

* **Kéo vách ngăn** giữa 2 nhóm để điều chỉnh số đêm của từng nhóm  
* Nhấn **Thêm nhóm** nếu muốn thêm nhóm mới, khi đó hệ thống chèn thêm **1 vách ngăn**

Lưu ý:

* **Số nhóm \< số đêm**

  ### **7.2. Bảng nhà cung cấp khách sạn**

Mỗi phân vùng hiển thị thông tin:

* **Danh sách đêm *(VD: Đêm 1, Đêm 2\)***  
* **Tỉnh thành**  
* **Thành tiền *(của nhóm)*** (để trống nếu chưa chọn áp dụng)

Hệ thống yêu cầu người dùng chọn một **Tỉnh thành** danh sách các **điểm đến** đã khai báo trước khi nhấn nút Thêm mới.  
Nếu chưa chọn địa điểm → hiển thị message hướng dẫn kiểu “Vui lòng chọn địa điểm lưu trú trước khi thêm nhà cung cấp”.  
Người dùng nhấn **Thêm mới** ở từng phân vùng.  
Hệ thống hiển thị danh sách nhà cung cấp đã được lọc theo:

* **Tiêu chuẩn lưu trú**  
* **Địa điểm lưu trú** 

Người dùng chọn **một hoặc nhiều nhà cung cấp** và nhấn **Lưu**.  
Hệ thống ghi nhận các nhà cung cấp đã chọn và hiển thị vào **vùng nhóm tương ứng** trong bảng nhà cung cấp khách sạn với các trường thông tin: **Nhà cung cấp, Địa chỉ, Dịch vu, Đơn giá, Cập nhật gần nhất, NCC chính**  
Hệ thống hiển thị bảng báo giá dưới dạng danh sách, trong đó các dòng dữ liệu được nhóm theo từng nhà cung cấp. Mỗi nhà cung cấp bao gồm các dịch vụ tương ứng mà họ cung cấp kèm theo đơn giá tương ứng..  
Người dùng chọn **nhà cung cấp chính** bằng **radio button**.  
Hệ thống cập nhật:

* **Thành tiền \= Đơn giá dịch vụ phòng đôi × số đêm của nhóm**  
  ---

  ## **8\. Khoản mục Vé thắng cảnh**

Hệ thống hiển thị bảng với các trường:

* **Nhà cung cấp**  
* **Tên dịch vụ**  
* **Địa chỉ**  
* **Đơn giá người lớn**  
* **Đơn giá trẻ em**  
* **Cập nhật gần nhất**

Bảng được chia theo **ngày lịch trình** (ví dụ: **ngày 1, ngày 2, ...**).  
Tại mỗi phân vùng theo ngày, khi người dùng nhấn **Thêm mới**, hệ thống hiển thị popup danh sách dịch vụ đã được lọc theo **các điểm đến đã chọn**, với các trường:

* **Nhà cung cấp**  
* **Tên dịch vụ**  
* **Đơn giá người lớn**  
* **Đơn giá trẻ em**  
* **Tỉnh/Thành**

Quy tắc giá:

* Nếu đối tượng là ALL thì **đơn giá người lớn \= đơn giá trẻ em**  
* Nếu đối tượng khác ALL thì **đơn giá phải match với đối tượng ở bảng giá**

Người dùng chọn **một hoặc nhiều dịch vụ** và nhấn **Lưu**.   
Mỗi dịch vụ trong hạng mục vé tham quan chỉ được chọn một lần trong toàn bộ chương trình tour và không được lặp lại ở các ngày khác.  
Hệ thống thêm các dịch vụ đã chọn vào bảng chi phí và **tự động điền các trường tương ứng** từ danh sách dịch vụ.  
---

## **9\. Khoản mục Hướng dẫn viên**

Hệ thống hiển thị các trường:

* **Đơn giá**  
* **Số lần**  
* **Thành tiền**

Hệ thống tự động điền **Đơn giá mặc định** theo cấu hình.  
Hệ thống tự động tính **Số lần** theo thời gian tour:

* Bằng **số ngày** nếu **số ngày ≥ số đêm**  
* Bằng **số ngày \+ 0.5** nếu **số đêm \> số ngày**

Hệ thống tự động tính:

* **Thành tiền \= Đơn giá × Số lần**  
  ---

  ## **10\. Khoản mục Chi phí khác**

Hệ thống hiển thị bảng với các trường:

* **Nhà cung cấp**  
* **Tên dịch vụ**  
* **Đơn giá**  
* **Số lần**  
* **Thành tiền**  
* **Cập nhật gần nhất**

Khi người dùng nhấn **Thêm mới**, hệ thống hiển thị popup danh sách dịch vụ với các trường:

* **Nhà cung cấp**  
* **Tên dịch vụ**  
* **Đơn giá**

Người dùng chọn dịch vụ và lưu để thêm vào bảng chi phí.  
Người dùng nhập hoặc chỉnh sửa:

* **Số lần** (mặc định \= **1**)

Hệ thống tự động tính:

* **Thành tiền \= Đơn giá × Số lần**  
  ---

  ## **11\. Tính toán tự động trong bước 3**

Trong quá trình nhập thông tin ở **Bước 3**, nếu dữ kiện cần thiết đã đầy đủ thì hệ thống tự động tính các giá trị sau và cập nhật mỗi khi có thay đổi về dữ liệu liên quan:

* **Giá net \= Chi phí cố định / Số khách dự kiến \+ Chi phí biến đổi**  
* **Giá bán \= Giá net × (1 \+ Tỷ lệ lợi nhuận mong muốn) × (1 \+ % Thuế) × (1 \+ Hệ số chi phí khác)**  
  Giá bán được chia thành:  
  * **Giá bán người lớn**  
  * **Giá bán trẻ em**  
* **Số lượng khách tối thiểu để triển khai tour \= Chi phí cố định / (Giá bán người lớn \- Chi phí biến đổi)**

Trong đó:

* **Chi phí cố định** gồm:  
  * Chi phí vận chuyển có **Đơn vị ≠ Người**  
  * Chi phí **Hướng dẫn viên**  
* Các chi phí còn lại được tính là **chi phí biến đổi**  
* **Thành tiền của khoản mục khách sạn phải chia đôi**, vì đây là **đơn giá của phòng đôi**, trong khi **chi phí biến đổi là chi phí cho 1 người**

Người dùng có thể chỉnh sửa lại:

* **Giá bán**  
* **Số lượng khách tối thiểu**  
  ---

  ## **12\. Gửi phê duyệt/Lưu nháp**

1) Lưu nháp

Người dùng nhấn **Lưu nháp**.  
Hệ thống thực hiện:

* Sinh mã chương trình  
* Lưu chương trình tour  
* Gán trạng thái: Nháp

Sau đó nếu người dùng ấn Gửi phê duyệt thì bỏ qua bước sinh mã

2) Gửi phê duyệt

Người dùng nhấn **Gửi phê duyệt**.  
Hệ thống kiểm tra tính **đầy đủ** và **hợp lệ** của toàn bộ thông tin đã nhập.  
Nếu hợp lệ, hệ thống thực hiện:

* Sinh mã chương trình  
* Lưu chương trình tour  
* Gán trạng thái: Đang chờ phê duyệt  
  ---

2. ## **Mô tả tính năng Phê duyệt chương trình tour (Quản lý)**

## **Bước 1\. Chọn tour cần phê duyệt**

Người dùng chọn module **Quản lý chương trình tour**.  
Hệ thống hiển thị danh sách các chương trình tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Chờ phê duyệt**.  
Hệ thống hiển thị danh sách các chương trình tour đang ở trạng thái Chờ phê duyệt được gửi đến.  
Quản lý chọn một chương trình tour để xem xét.  
Hệ thống hiển thị đầy đủ thông tin chương trình tour đã chọn để quản lý xem xét.

## **Bước 2\. Thực hiện phê duyệt hoặc từ chối**

Hệ thống hiển thị 2 chức năng:

* **Phê duyệt**  
* **Từ chối**

### **Trường hợp 2.1: Quản lý chọn Phê duyệt**

* Quản lý nhấn nút **Phê duyệt**  
* Hệ thống cập nhật trạng thái chương trình tour thành **Đang mở bán**  
* Hệ thống gửi thông báo về chương trình mới đến:  
  * Điều phối viên  
  * Các nhân viên sale  
* Hệ thống sinh các tour tương ứng

### **Trường hợp 2.2: Quản lý chọn Từ chối**

* Quản lý nhấn nút Từ chối  
* Hệ thống hiển thị popup yêu cầu nhập lý do từ chối  
* Quản lý nhập lý do từ chối và xác nhận  
* Hệ thống cập nhật trạng thái chương trình tour thành Từ chối phê duyệt  
* Hệ thống gửi thông báo kèm lý do từ chối đến người tạo chương trình  
  ---

3. ## **Mô tả tính năng Duyệt tour sinh ra (NV Điều hành \+ Quản lý)**

## **Bước 1\. Cronjob kích hoạt quy trình**

Đến thời điểm được cấu hình (ví dụ thứ 2 hàng tuần), **cronjob** kích hoạt chức năng tự động sinh tour của hệ thống.

## **Bước 2\. Hệ thống tìm chương trình tour phù hợp**

Hệ thống truy xuất danh sách các chương trình tour thỏa điều kiện:

* Trạng thái **Đang mở bán**  
* Kiểu chu kỳ **YEAR\_ROUND**  
* **Số tour đang mở bán \< Số tour sinh trước**

## **Bước 3\. Hệ thống tính toán các tour cần tạo**

Đối với mỗi chương trình tour thỏa điều kiện, hệ thống:

* Xác định số tour cần sinh thêm để đạt đủ **số tour sinh trước**  
* Tính toán các **ngày khởi hành kế tiếp**, đảm bảo:  
  * ngày khởi hành **lớn hơn ngày hiện tại \+ hạn đặt trước**  
  * tuân theo quy tắc khởi hành của chương trình tour (daily hoặc weekly schedule)

Sau khi tính toán, hệ thống sẽ:

* Tạo các bản ghi tour với trạng thái Nháp.  
* Gửi thông báo đến người tạo chương trình tour

**Bước 4\. Hiển thị danh sách tour dự kiến (NV điều hành)**  
Người dùng chọn module Quản lý tour.  
Hệ thống hiển thị danh sách các chương trình tour hiện đang bán tại tab Current.  
Người dùng chọn tab Nháp.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Nháp và Từ chối phê duyệt.  
Danh sách được **nhóm theo chương trình tour** và hiển thị dạng **tab/accordion có thể mở hoặc thu gọn**.  
Trong mỗi nhóm hiển thị bảng các tour dự kiến với các thông tin:

* Ngày khởi hành  
* Giá vốn người lớn  
* Lợi nhuận  
* Giá bán  
* Giá bán trẻ em  
* Hạn đặt tour

## **Bước 5\. Người dùng duyệt tour (NV điều hành)**

Người dùng có thể:

* Chỉnh sửa giá bán và hạn đặt tour.  
* Lựa chọn một hoặc nhiều tour để xử lý.

Thao tác duyệt:

* Chọn Approve: hệ thống hiển thị popup Xác nhận → tour chuyển sang trạng thái Chờ duyệt.  
* Chọn Reject: hệ thống hiển thị popup Xác nhận → Hệ thống xóa tour.

**Bước 6\. Hiển thị danh sách tour dự kiến (Quản lý)**  
Người dùng chọn module Quản lý tour.  
Hệ thống hiển thị danh sách các tour hiện đang bán tại tab Current.  
Người dùng chọn tab Chờ duyệt.  
Hệ thống hiển thị danh sách các chương trình tour đang ở trạng thái Chờ duyệt.  
Danh sách được **nhóm theo chương trình tour** và hiển thị dạng **tab/accordion có thể mở hoặc thu gọn**.  
Trong mỗi nhóm hiển thị bảng các tour dự kiến với các thông tin:

* Ngày khởi hành  
* Giá vốn người lớn  
* Lợi nhuận  
* Giá bán  
* Giá bán trẻ em  
* Hạn đặt tour

## **Bước 7\. Người dùng duyệt tour (Quản lý)**

Người dùng có thể:

* Lựa chọn một hoặc nhiều tour để xử lý.

Thao tác duyệt:

* Chọn Approve: tour chuyển sang trạng thái Mở bán.  
* Chọn Reject:   
  * Hệ thống hiển thị popup yêu cầu nhập lý do từ chối.  
  * Hệ thống cập nhật trạng thái tour là Từ chối phê duyệt và thông báo tới người tạo.

  ---

4. ## **Mô tả tính năng Dự toán chi phi tour (NV điều hành)**

## **Bước 1\. Chọn tour cần dự toán**

Người dùng chọn module **Quản lý tour**.  
Hệ thống hiển thị danh sách các tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Chờ điều hành**.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Chờ điều hành mà chưa có ai nhận điều hành.  
Người dùng ấn nút **Điều tour** ở cuối mỗi bản ghi.  
Hệ thống hiển thị thông tin tour gồm 4 tab: **Tổng quan, Danh sách khách hàng, Lịch trình, Dự trù**. Trong đó tab Tổng quan gồm các thông tin: Mã tour, Tên chương trình tour, Ngày khởi hành, Ngày kết thúc, Điểm khởi hành, Điểm đến, Mô tả; Tab Danh sách khách hàng trông như này cơ mà không có email  
![][image1]  
Tab Lịch trình với Dự trù hiển thị như của chương trình tour chế độ read-only  
Người dùng ấn nút **Nhận điều tour** ở góc trên cùng.  
Hệ thống cập nhật người dùng là **Người điều hành** và chuyển trạng thái tour thành Chờ dự toán.  
Người dùng chọn tab **Chờ dự toán**.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Chờ dự toán mà người dùng nhận điều hành.  
Người dùng chọn 1 tour để dự toán.

## **Bước 2\. Hệ thống hiển thị màn hình dự toán**

Hệ thống hiển thị thông tin dự toán của tour theo các nhóm khoản mục, bao gồm phần **Tổng thu dự kiến** và **Các khoản chi dự kiến**.

### **Phần tổng thu dự kiến (tự động tính và hiển thị)**

Hệ thống hiển thị các khoản thu dự kiến theo từng mục, ví dụ:

* Tour người lớn  
* Tour trẻ em  
* Phụ thu

Mỗi dòng có thể hiển thị các trường:

* STT  
* Khoản mục  
* Số lượng  
* Đơn giá  
* Thành tiền

Hệ thống đồng thời tính và hiển thị Tổng thu 

### **Phần các khoản chi dự kiến**

Hệ thống hiển thị các nhóm chi phí dự kiến, ví dụ:

* Vận chuyển  
* Khách sạn  
* Chi phí ăn  
* Hướng dẫn viên  
* Vé thắng cảnh   
* Các nhóm chi phí khác nếu có

Trong từng nhóm chi phí, hệ thống hiển thị danh sách các dòng chi tiết với các trường:

* STT  
* Nhà cung cấp  
* Tên dịch vụ  
* Số lượng  
* Số lượt/đêm/bữa  
* Đơn giá  
* Đơn vị  
* Đối tượng  
* Thành tiền  
* Ghi chú

Trong đó:

* Danh sách dịch vụ kế thừa từ phần dự toán tour; với các nhà cung cấp được chọn là Nhà cung cấp chính.   
  Người dùng có thể chọn mũi tên bên cạnh mỗi bản ghi để expand ra danh sách nhà cung cấp dự phòng để chọn. Mỗi khi chọn, hệ thống cập nhật Nhà cung cấp, Đơn giá và Thành tiền theo  
* Số lượng được xác định theo dữ liệu khách của tour:  
+ Với dịch vụ vé, Chi phí ăn → tương ứng số người lớn, số trẻ em  
+ Với vận chuyển → số vé máy bay/tàu hỏa tương ứng số người lớn, số trẻ em, số xe mặc định là 1\.  
+ Với dịch vụ lưu trú → tương ứng số phòng theo từng loại (kế thừa từ UC liên hệ khách hàng)  
+ Hướng dẫn viên số lượng mặc định 1  
+ Các dịch vụ khác tủy chỉnh được số lượng  
* Người dùng có thể:  
+ Thêm dịch vụ vào mục chi phí khác  
+ Chỉnh sửa đơn giá của các dịch vụ trong danh sách:  
- Tại mỗi dòng bảng giá ở expand, người dùng nhấn nút “Điều chỉnh giá”.  
- Hệ thống hiển thị popup điều chỉnh giá, bao gồm các thông tin:  
* Giá gốc: xxx  
* Giá mới: (trường nhập liệu)  
* Lý do điều chỉnh (radio):  
+ NCC báo lại  
+ Giá mùa cao điểm  
+ Deal riêng  
+ Khác (cho phép nhập nội dung)  
- Câu hỏi xác nhận: “Có yêu cầu cập nhật bảng giá không?” (radio): Có và Không  
- Sau khi người dùng nhấn Lưu:  
* Giá tại dòng dịch vụ được cập nhật và highlight, hiển thị theo định dạng: xxx (đã chỉnh sửa)  
* Thành tiền được tự động tính lại nếu dòng dịch vụ này đang được chọn để tính giá.  
- Trường hợp người dùng chọn “Có” tại mục yêu cầu cập nhật bảng giá: Hệ thống tạo một yêu cầu cập nhật bảng giá với trạng thái Chờ duyệt.

## **Bước 4\. Hệ thống tính toán giá trị dự toán**

Căn cứ vào thông tin người dùng đã chọn và nhập, hệ thống tự động tính:

* Thành tiền của từng dòng  
* Tổng tiền theo từng nhóm chi phí  
* Tổng chi dự kiến  
* Lợi nhuận dự kiến (=Tổng thu \- Tổng chi)  
* Tỷ lệ lợi nhuận dự kiến (=Lợi nhuận dự kiến \* (1 \- %Thuế)/

## **Bước 5\. Người dùng kiểm tra và gửi phê duyệt**

Sau khi hoàn tất dự toán, nhân viên điều hành nhấn **Gửi phê duyệt**.

## **Bước 6\. Hệ thống kiểm tra thông tin**

Hệ thống kiểm tra tính đầy đủ và hợp lệ của các thông tin dự toán.

## **Bước 7\. Hệ thống tạo mã dự toán và lưu**

Nếu dữ liệu hợp lệ, hệ thống:

* Sinh mã dự toán  
* Lưu thông tin dự toán  
* Cập nhật trạng thái dự toán là Chờ duyệt và trạng thái tour là Chờ duyệt dự toán  
  ---

5. ## **Mô tả tính năng Phê duyệt dự toán (Quản lý)**

## **Bước 1\. Chọn tour cần phê duyệt**

Người dùng chọn module **Quản lý tour**.  
Hệ thống hiển thị danh sách các tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Chờ duyệt dự toán**.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Chờ duyệt dự toán được gửi đến.  
Quản lý chọn một dự toán tour để xem xét.  
Hệ thống hiển thị đầy đủ thông tin dự toán tour đã chọn để quản lý xem xét.

## **Bước 2\. Thực hiện phê duyệt hoặc từ chối**

Hệ thống hiển thị 2 chức năng:

* **Phê duyệt**  
* **Từ chối**

### **Trường hợp 2.1: Quản lý chọn Phê duyệt**

* Quản lý nhấn nút **Phê duyệt**  
* Hệ thống cập nhật trạng thái tour thành **Chờ điều phối**

### **Trường hợp 2.2: Quản lý chọn Từ chối**

* Quản lý nhấn nút Từ chối  
* Hệ thống hiển thị popup yêu cầu nhập lý do từ chối  
* Quản lý nhập lý do từ chối và xác nhận  
* Hệ thống cập nhật trạng thái chương trình tour thành Từ chối phê duyệt  
* Hệ thống gửi thông báo kèm lý do từ chối đến người tạo chương trình  
  ---

6. ## **Mô tả tính năng Tạo hồ sơ tour (NV điều hành)**

Người dùng chọn module **Quản lý tour**.  
Hệ thống hiển thị danh sách các tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Chờ điều phối**.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Chờ điều phối.  
Người dùng ấn nút **Điều HDV** ở cuối mỗi bản ghi.  
Hệ thống hiển thị popup danh sách HDV có **lịch trống trong khoảng thời gian từ ngày khởi hành đến ngày kết thúc** tour. Popup bao gồm các thông tin: **Tên HDV, số điện thoại, số lần đã dẫn tour này, số lần dẫn tour tương tự** và **số năm kinh nghiệm**.  
Người dùng chọn 1 hướng dẫn viên và ấn Lưu.  
Hệ thống cập nhật Hướng dẫn viên vào tour và trạng thái tour là **Đang triển khai**.  
Hệ thống gửi thông tin tour gồm Danh sách khách hàng, Lịch trình và Bảng kê dịch vụ tới email Hướng dẫn viên.  
---

7. ## **Mô tả tính năng Quyết toán (NV điều hành)**

## **Bước 1\. Chọn tour cần điều phối**

Người dùng chọn module **Quản lý tour**.  
Hệ thống hiển thị danh sách các tour hiện đang bán tại tab **Current**.  
Người dùng chọn tab **Chờ quyết toán**.  
Hệ thống hiển thị danh sách các tour đang ở trạng thái Chờ quyết toán (các tour đã khởi hành và đã qua ngày kết thúc).  
Người dùng chọn tour cần quyết toán

## **Bước 2\. Thực hiện quyết toán**

Màn hình hiển thị tương tự **dự toán**, tuy nhiên thay biểu tượng **expand** bằng nút **3 chấm** tại mỗi dòng.  
Người dùng nhấn nút **3 chấm** để thực hiện điều chỉnh phát sinh (tăng/giảm **đơn giá** và **số lượng**) ở mỗi dòng.

* Hệ thống cho phép chỉnh sửa trực tiếp các trường này.  
* Tại cuối dòng hiển thị 2 nút ✔ và ✖

Khi người dùng chọn ✔ :

* Hệ thống cập nhật lại thành tiền của dòng.  
* Nếu có thay đổi so với giá trị dự toán ban đầu:  
  * Highlight đỏ các trường thay đổi (đơn giá, số lượng, thành tiền).  
  * Hiển thị biểu tượng ↑ / ↓ thể hiện mức tăng/giảm.  
  * Khi hover vào biểu tượng, hiển thị % chênh lệch.

Hệ thống đồng thời cập nhật: Tổng chi và Lợi nhuận và hiển thị tương tự:

* Biểu tượng ↑ / ↓ cho biết biến động  
* Tooltip hiển thị % thay đổi khi hover

Người dùng nhấn **Hoàn thành** để lưu quyết toán.  
Hệ thống cập nhật trạng thái tour thành **Hoàn thành**.  
---

8. ## **Mô tả tính năng Ngừng kinh doanh (Quản lý)**

Người dùng chọn module **Quản lý chương trình tour**.  
Hệ thống hiển thị danh sách các chương trình tour hiện đang bán tại tab **Current**.  
Người dùng chọn nút 3 chấm cuối dòng để chọn chức năng Ngừng kinh doanh.  
Hệ thống hiển thị popup yêu cầu nhập lý do.   
Người dùng nhập lý do và bấm xác nhận.  
Hệ thống cập nhật trạng thái của chương trình tour thành **Ngừng kinh doanh**.  
Hệ thống ghi nhận **ngày dừng kinh doanh** của chương trình tour vào cơ sở dữ liệu.  
Hệ thống tìm các tour thuộc chương trình tour này đã được sinh ra nhưng **chưa có booking** và cập nhập nhật trạng thái các tour thành Cancel.  
Hệ thống gửi thông báo tới NV R\&D tạo chương trình và các NV điều hành \+ kinh doanh.  
***Ngừng kinh doanh của R\&D tương tự quản lý chỉ là sau khi bấm xác nhận, hệ thống gửi thông báo tới Quản lý, quản lý phê duyệt thì hệ thống mới bắt đầu cập nhật và gửi thông báo***  
***Chức năng Sửa tour \- nếu tour trạng thái Lưu nháp \-\> sửa thoải mái, ko thì chỉ được sửa mô tả***

[image1]: <data:image/png;base64,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>