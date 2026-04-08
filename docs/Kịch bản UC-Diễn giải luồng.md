**1\. Dự toán chương trình tour (do nhân viên R\&D tạo)**

* Là bước **lên kế hoạch tour ban đầu**.  
* Nhân viên sẽ:  
  * Liệt kê **tất cả các dịch vụ có trong tour** (ăn uống, khách sạn, vận chuyển…).  
  * Với mỗi dịch vụ:  
    * Chọn **1 nhà cung cấp chính**.  
    * Và thêm **các nhà cung cấp dự phòng** (trường hợp nhà cung cấp chính hết chỗ).  
    * Ví dụ:  
      * Dịch vụ ăn tối đặc sản → Nhà hàng A (chính) \+ các nhà hàng gần đó (dự phòng).  
* Sau khi liệt kê:  
  * **Chi phí 1 khách** được tính dựa trên nhà cung cấp chính.  
  * Kết hợp thêm:  
    * Tỷ lệ lợi nhuận mong muốn  
    * Thuế và các chi phí khác  
  * → Hệ thống tính ra:  
    * **Giá bán tour**  
    * **Số khách tối thiểu**  
* Sau đó:  
  * Nhân viên R\&D gửi chương trình cho **quản lý duyệt**.  
  * Nếu được duyệt → **Tour được mở bán** và tạo ra **tour cụ thể**.

**2\. Khi tour bắt đầu được vận hành**

* Khi:  
  * Hết hạn đặt vé  
  * Và số khách ≥ số khách tối thiểu

→ Tour sẽ xuất hiện trong **danh sách chờ điều hành**.

* Nhân viên điều hành:  
  * Nhấn **“nhận điều hành”** để xử lý tour.

**3\. Dự toán tour (do nhân viên điều hành làm)**

* Là bước chi tiết hơn, dựa trên dự toán ban đầu.  
* Nhân viên điều hành sẽ:  
  * Chọn **nhà cung cấp cụ thể** (không còn là dự kiến).  
  * Tính:  
    * **Tổng chi phí tour**  
    * **Tổng doanh thu** (từ booking)  
    * → **Lợi nhuận dự kiến thực tế**  
* Sau đó:  
  * Gửi lại cho **quản lý duyệt**  
  * Quản lý quyết định:  
    * Có triển khai tour hay không

**4\. Điều phối tour** (aka tạo hồ sơ nghiệp vụ)

* Nếu quản lý duyệt:  
  * Tour chuyển sang **màn chờ điều phối**  
* Nhân viên điều hành:  
  * Phân công **hướng dẫn viên (HDV)**  
  * Hệ thống:  
    * Gửi thông tin tour qua email cho HDV  
  * Trạng thái tour → **Đang triển khai**

**5\. Sau khi kết thúc tour (quyết toán)**

* Sau ngày kết thúc:  
  * Tour chuyển sang trạng thái **chờ quyết toán**  
* Nhân viên điều hành:  
  * Cập nhật các **chi phí phát sinh thực tế**  
  * Tính lại:  
    * **Tổng chi phí thực tế**  
    * **Lợi nhuận thực tế**

→ Mục đích: **đánh giá hiệu quả tour**  
---

### **1\. Phân quyền quản lý dịch vụ**

* Chức năng **quản lý dịch vụ** có ở:  
  * Nhân viên **R\&D**  
  * Nhân viên **điều hành**

### **2\. Nội dung quản lý dịch vụ**

Bao gồm:

* **CRUD Dịch vụ**  
* **CRUD Nhà cung cấp**

### **3\. Quản lý dịch vụ**

* **Dịch vụ được tạo trước**, sau đó mới gán vào nhà cung cấp.

Mỗi dịch vụ gồm các thông tin:

* **Tên dịch vụ**  
* **Loại dịch vụ** (1 trong 6 loại):  
  * Vận chuyển  
  * Chi phí ăn  
  * Khách sạn  
  * Vé thắng cảnh  
  * Hướng dẫn viên (HDV)  
  * Chi phí khác  
* **Hình thức giá**:  
  * Vận chuyển có 3 kiểu:  
    * Báo giá từ nhà cung cấp  
    * Chọn giá từ danh mục  
    * Nhập tay theo đối tượng  
  * Các loại còn lại:  
    * Mặc định là **chọn giá danh mục**  
* **Kiểu đối tượng giá**:  
  * Tất cả  
  * Hoặc Người lớn & Trẻ em  
* **Tỉnh/Thành**:  
  * Chỉ áp dụng cho **vé thắng cảnh**  
* **Tùy chọn riêng**:  
  * Vận chuyển (xe) và khách sạn có thêm **tùy chọn về sức chứa** (vd xe 25 chỗ, xe 29 chỗ, phòng đôi, phòng đơn, phòng 3\)

### **4\. Quản lý nhà cung cấp**

Mỗi nhà cung cấp gồm:

* Tên  
* Số điện thoại  
* Loại nhà cung cấp (theo các loại dịch vụ, trừ HDV)  
* Địa chỉ  
* Tỉnh/Thành  
* Năm thành lập  
* Đánh giá nội bộ (số sao / 5 sao)

**Thông tin bổ sung theo loại:**

* Khách sạn → có *hạng sao (3, 4*, 5...)  
* Vận chuyển → có **các tỉnh/thành hoạt động**

### **5\. Gán dịch vụ vào nhà cung cấp**

* Khi thêm dịch vụ vào nhà cung cấp:  
  * Nếu **hình thức giá là nhập tay** → không cần nhập đơn giá sẵn  
  * Nếu **kiểu giá là Người lớn & Trẻ em** → phải nhập:  
    * Giá người lớn  
    * Giá trẻ em  
  * Nếu dịch vụ có nhiều tùy chọn:  
    * Chọn các tùy chọn mà nhà cung cấp có  
    * Nhập giá cho từng tùy chọn  
* Riêng **dịch vụ ăn uống**:  
  * Có thể **thêm trực tiếp dịch vụ từ màn nhà cung cấp**

### **6\. Dịch vụ HDV (đặc biệt)**

* HDV là dịch vụ do **chính công ty cung cấp**  
* Có:  
  * **1 nhà cung cấp mặc định** (chính công ty)  
  * **1 dịch vụ duy nhất: HDV**  
* Đơn giá:  
  * Đã có sẵn  
  * Chỉ được **chỉnh sửa tại màn nhà cung cấp**

### **7\. Điều chỉnh giá dịch vụ (nhân viên điều hành)**

* Khi điều hành:  
  * Liên hệ nhà cung cấp để đặt dịch vụ cho tour  
  * Có thể phát sinh **giá thực tế khác với giá ban đầu**  
* Khi đó:  
  * Điều hành cập nhật giá mới  
  * Nếu chọn lưu → giá này được lưu vào **bảng giá** (chỉ dành cho các dịch vụ có hình thức giá là Nhập tay theo đối tượng)  
  * Đồng thời gửi **yêu cầu duyệt** tới trưởng phòng điều hành.

### **8\. Xử lý của cập nhật giá**

Giá dịch vụ sẽ được cập nhật trong các trường hợp:

1. Yêu cầu thay đổi giá **được duyệt**  
2. Nhân viên R\&D **chỉnh sửa giá trực tiếp** ở màn quản lý nhà cung cấp  
3. Nhân viên R\&D **điều chỉnh giá khi tạo tour** (với dịch vụ dùng giá từ danh mục)

(Với trường hợp 2 và 3: Sau khi chỉnh sửa giá, hệ thống sẽ **hiện popup xác nhận** trước khi lưu.)  
Khi giá của nhà cung cấp thay đổi, hệ thống sẽ:

* Gửi thông báo đến các **nhân viên R\&D** có chương trình tour đang mở bán bị ảnh hưởng.  
* Trong thông báo sẽ:  
  * Thông tin giá đã thay đổi  
  * Người thực hiện thay đổi (R\&D hoặc Trưởng phòng điều hành)  
  * Danh sách dịch vụ trong tour đang dùng nhà cung cấp đó cùng expand các nhà cung cấp từ dự toán trước đó (chỉ áp dụng cho các dịch vụ khác Hướng dẫn viên)

Nhân viên R\&D có thể:

* **Giữ nguyên nhà cung cấp hiện tại**  
* Hoặc **chọn nhà cung cấp chính khác** cho dịch vụ đó

