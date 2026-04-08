# Travela — Hướng Dẫn Sử Dụng

> Cách sử dụng Travela — Nền tảng đặt tour du lịch cao cấp

---

## 1. Travela Là Gì?

Travela là nền tảng đại lý du lịch trực tuyến với **5 vai trò người dùng** riêng biệt, mỗi vai trò có workspace riêng:

| Vai trò | Ai | Quyền truy cập |
|---------|-----|----------------|
| **Khách hàng** | Người dùng cuối duyệt tour | Xem, đặt, quản lý booking cá nhân |
| **NV Kinh doanh** | Nhân viên sales | Xem và quản lý booking khách hàng |
| **Điều phối viên** | Điều phối tour | Quản lý dịch vụ, nhà cung cấp, đối soát |
| **Quản lý** | Quản lý vận hành | Chương trình tour, tour đang chạy, dự toán |
| **Quản trị** | Quản trị viên | Quản lý người dùng, voucher, toàn bộ thao tác |

---

## 2. Tính Năng Theo Vai Trò

### 2.1 Khách Hàng (Công khai)

**Duyệt Tour**
1. Mở http://localhost:5173 — trang **Landing**
2. Click tour card hoặc vào **Danh sách Tour** để xem tất cả tour
3. Click vào tour → trang **Chi Tiết Tour** hiển thị lịch trình, điểm nổi bật, giá, nút đặt tour

**Luồng Đặt Tour**
1. Trên Chi Tiết Tour, click **"Đặt Ngay"**
2. Điền thông tin hành khách và liên hệ
3. Xem lại và xác nhận booking
4. Nhận thông báo xác nhận với mã booking

**Quản Lý Booking**
- Vào **Lịch Sử Đặt Chỗ** để xem các chuyến sắp khởi hành, đã hoàn thành, đã hủy
- Click **"Xem Chi Tiết"** để xem chi tiết booking
- Hủy chuyến sắp khởi hành hoặc để lại đánh giá cho chuyến đã hoàn thành

---

### 2.2 NV Kinh Doanh (Sales)

**Quản Lý Booking**
1. Vào **Sales → Danh sách Booking**
2. Xem tất cả booking trong bảng có bộ lọc (theo trạng thái, trạng thái hoàn tiền)
3. Click một dòng → **Chi Tiết Booking** mở ra từ bên phải (slide-over)
4. Từ Chi Tiết, bạn có thể:
   - Tải danh sách hành khách dạng CSV
   - Xác nhận hoàn tiền (với booking đã hủy có trạng thái hoàn tiền đang chờ)

---

### 2.3 Điều Phối Viên (Coordinator)

**Quản Lý Dịch Vụ**
1. Vào **Coordinator → Dịch Vụ**
2. Xem tất cả dịch vụ với bộ lọc và tìm kiếm
3. Click **"Chi Tiết"** để mở drawer thông tin dịch vụ

**Quản Lý Nhà Cung Cấp**
1. Vào **Coordinator → Nhà Cung Cấp**
2. Quản lý thông tin nhà cung cấp (slide-over drawer)
3. Theo dõi hợp đồng và liên hệ nhà cung cấp

**Đối Soát Tour**
1. Vào **Coordinator → Đối Soát**
2. Xem lại và xử lý đối soát tài chính tour

---

### 2.4 Quản Lý (Manager)

**Chương Trình Tour**
1. Vào **Manager → Chương Trình Tour**
2. Tạo chương trình tour mới với wizard từng bước
3. Quản lý chương trình hiện có (đăng tải, chỉnh sửa, lưu trữ)

**Tour Đang Chạy**
1. Vào **Manager → Tour Đang Chạy**
2. Giám sát các tour đang chạy và sắp khởi hành

**Dự Toán Tour**
1. Vào **Manager → Dự Toán**
2. Xem và phê duyệt dự toán chi phí cho chương trình tour

---

### 2.5 Quản Trị (Admin)

**Quản Lý Người Dùng**
1. Vào **Admin → Người Dùng**
2. Xem tất cả người dùng với bộ lọc theo vai trò
3. Click dòng người dùng để mở drawer thông tin (xem hồ sơ, hoạt động)

**Quản Lý Voucher**
1. Vào **Admin → Voucher**
2. Tạo, chỉnh sửa, và ngưng kích hoạt mã voucher

**Tổng Quan Booking**
1. Vào **Admin → Bookings**
2. View toàn bộ booking từ tất cả vai trò

---

## 3. Chuyển Vai Trò

Vì đây là ứng dụng mock không có xác thực thật:

1. Trên trang **Landing**, tìm công tắc vai trò (top navigation hoặc demo panel)
2. Chọn vai trò bất kỳ: **Admin**, **Quản lý**, **Điều phối**, **NV Kinh doanh**, hoặc **Khách hàng**
3. Navigation cập nhật ngay để hiển thị dashboard của vai trò đã chọn
4. Vai trò hiện tại được hiển thị trong sidebar hoặc header

---

## 4. Xử Lý Sự Cố

| Vấn đề | Giải pháp |
|---------|-----------|
| "Không tìm thấy đơn booking" | Mã booking có thể không tồn tại trong mock data. Dùng các ID từ `src/data/bookings.ts` |
| Role guard chuyển hướng về trang chủ | Vai trò đó chưa được chọn. Dùng công tắc vai trò để chọn đúng vai trò |
| Danh sách booking trống | Mock data có 10 booking. Dùng bộ lọc trạng thái để xem kết quả |
| Trang không tìm thấy 404 | Kiểm tra URL có khớp với route trong `src/App.tsx` |

---

## 5. Câu Hỏi Thường Gặp

**H: Đây có phải hệ thống đặt tour thật không?**
Đ: Không — đây là prototype frontend với mock data. Không có booking thật được xử lý hay lưu trữ.

**H: Làm sao xem được trang admin?**
Đ: Dùng công tắc vai trò trên trang Landing để chọn "Admin".

**H: Tôi có thể thêm tour thật không?**
Đ: Hiện tại, tour nằm trong `src/data/tours.ts`. Khi backend được triển khai, phần này sẽ được thay bằng API calls.
