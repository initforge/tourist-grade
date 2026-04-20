# 02. Frontend Modules

## 2.1 Kiến trúc frontend

Frontend đang theo cấu trúc:

- `src/components/layout/*`: layout theo role
- `src/pages/public/*`: public pages
- `src/pages/customer/*`: customer area
- `src/pages/admin/*`: admin pages
- `src/pages/manager/*`: manager pages
- `src/pages/coordinator/*`: coordinator pages
- `src/pages/sales/*`: sales pages
- `src/store/*`: global client state
- `src/data/*`: hiện chỉ còn type definitions + empty collections tương thích
- `src/lib/api/*`: điểm bắt đầu cho API client thật

## 2.2 Layout responsibilities

- `PublicLayout`: navbar, footer, điều hướng public/customer.
- `AuthLayout`: khung đăng nhập/đăng ký.
- `AdminLayout`: shell admin.
- `ManagerLayout`: shell manager.
- `CoordinatorLayout`: shell coordinator.
- `SalesLayout`: shell sales.

## 2.3 Shared state

- `useAuthStore`: session client-side.
- Chưa có query cache layer.
- Chưa có shared service/repository layer cho domain modules.

## 2.4 Vấn đề hiện tại của frontend

- Nhiều page đọc trực tiếp từ `src/data/*`.
- Chưa có lớp `services` hoặc `repositories`.
- Chưa có chuẩn response mapping từ API sang UI model.
- Một số màn đang tính toán trực tiếp trong component thay vì view-model/service.

## 2.5 Hướng refactor đúng

### Bước 1

- Giữ page/component như hiện tại.
- Tạo `api client` và `domain service` riêng.

### Bước 2

- Chuyển page từ `import mock*` sang `useEffect + apiRequest`.
- Tách loading / empty / error state.

### Bước 3

- Tách formatter, mapper, state machine helper ra khỏi component lớn.

## 2.6 Module nên ưu tiên chuyển API trước

1. Auth
2. Public tours + booking lookup
3. Booking checkout + booking history
4. Tour program + tour instance
5. Voucher
6. Supplier/service catalog
7. Report/dashboard aggregates

### Sales booking queue

- Route list chính: `/sales/bookings`.
- Tab `Đã hủy` chỉ hiển thị 2 trạng thái hoàn tiền ở UI:
  - `Chưa hoàn` = dữ liệu `refundStatus = pending`
  - `Hoàn thành` = gộp `refundStatus = refunded | not_required`
- Bộ lọc con ở tab `Đã hủy` cũng chỉ giữ `Tất cả trạng thái`, `Chưa hoàn`, `Hoàn thành`.
- Cột `Trạng thái đơn` không còn xuất hiện trong tab `Đã hủy`; bảng chỉ giữ `Lý do hủy`, `Số tiền hoàn`, `TT hoàn tiền`.
- Khi chuyển sang API thật, backend vẫn có thể giữ raw enum chi tiết; frontend list view phải map về 2 trạng thái hiển thị như trên để bám đúng nghiệp vụ hiện tại.

## 2.7 Coordinator - thêm chương trình tour

Route: `/coordinator/tour-programs/create`.

Luồng tạo mới hiện là wizard 4 bước:

- `Thông tin chung`: thông tin tour, phương tiện, loại tour.
- `Lịch trình`: từng ngày trong tour, bữa ăn, mô tả, và `Địa điểm lưu trú` cho các đêm cần ở khách sạn.
- `Giá & Cấu hình`: cấu hình giá và bảng kê chi phí theo wireframe sheet.
- `Tour dự kiến`: preview các lần khởi hành sẽ sinh, chỉ xuất hiện trong màn tạo mới.

Quy tắc ngày dự kiến:

- Với `Mùa lễ`, ngày dự kiến lấy từ các ngày người dùng chọn trên lịch dịp lễ.
- Với `Quanh năm`, người dùng nhập `Ngày bắt đầu` và `Ngày kết thúc`; frontend tự sinh danh sách ngày dự kiến trong khoảng này. Nếu có chọn thứ trong tuần thì lọc theo thứ, nếu chưa chọn thì lấy toàn bộ ngày trong khoảng.
- Tab `Tour dự kiến` dùng cùng cấu trúc preview với popup sinh tour: mã tour, ngày khởi hành, ngày kết thúc, loại ngày, số khách dự kiến, giá vốn, giá bán, lợi nhuận, hạn đặt tour, trạng thái trùng thời điểm và checkbox tạo.

Quy tắc dự toán chương trình:

- `Vận chuyển`, `Khách sạn`, `Chi phí ăn` hiển thị bảng nhà cung cấp/dịch vụ, có checkbox mặc định và nút xóa từng dòng.
- `Vé thắng cảnh` và `Chi phí khác` là chi phí trực tiếp, không cần danh sách lựa chọn nhà cung cấp riêng khi thêm dòng.
- Phần `Khách sạn` bỏ block thiết lập lưu trú riêng; nhóm khách sạn được suy ra từ các ngày liên tiếp có cùng `Địa điểm lưu trú`.
- Phần `Hướng dẫn viên` chỉ nhập `Đơn giá`; không hiển thị `Số lần` và `Thành tiền`.
- Sticky `Tính toán dự kiến` tính giá net, giá bán người lớn/trẻ em/trẻ sơ sinh, tỷ lệ lợi nhuận thực tế và phụ phí phòng đơn. Các trường giá bán/phụ phí có chế độ sửa tay và reset về giá gợi ý.

## 2.8 Coordinator - dự toán, nhận điều hành, quyết toán

Màn lập dự toán tour:

- Route chính: `/coordinator/tours/:id/estimate`.
- Tab `Dự toán` không hiển thị `Dịch vụ` và `Nhà cung cấp` ở bảng chính.
- Bảng chính chỉ hiển thị khoản mục tính tiền: `STT`, `Khoản mục`, `Đơn vị`, `Đối tượng`, `Số lượng`, `Đêm/Lượt/Bữa`, `Đơn giá áp dụng`, `Thành tiền`, `Thao tác`.
- Nút expand nằm ở cuối dòng. Khi expand, bảng giá NCC/dịch vụ hiển thị tách riêng bên dưới dòng đó, gồm `Nhà cung cấp`, `Dịch vụ`, `Báo giá`, `Ghi chú`, `Sử dụng`, `Sửa giá`.

Màn nhận điều hành:

- Route: `/coordinator/tour-programs/:id/receive`.
- Có 4 tab read-only: `Tổng quan`, `Danh sách booking`, `Lịch trình`, `Dự toán`.
- Tab `Dự toán` kế thừa dữ liệu dự toán chương trình/tour, hiển thị bảng read-only cùng cấu trúc bảng chính và expand bảng giá đang áp dụng.
- Nút `Nhận điều hành` nằm ở đầu màn; khi nhận, UI chuyển sang trạng thái đã nhận. Backend sau này cần đảm bảo tour không còn hiển thị với điều phối viên khác.

Màn phân công HDV:

- Route thao tác: `/coordinator/tours`, tab `Phân công HDV`, nút `Phân công HDV`.
- Popup chỉ chọn hướng dẫn viên, hiển thị `Tên HDV`, `Số điện thoại`, `Số lần đã dẫn tour này`.
- Không hiển thị thông tin xe và không hiển thị số năm kinh nghiệm.

Màn quyết toán:

- Route: `/coordinator/tours/:id/settle`.
- Tab `Bảng Quyết Toán` kế thừa các dòng từ dự toán tour, không thêm mới dịch vụ/hạng mục.
- Bảng gộp quan hệ khoản mục/dịch vụ bằng header khoản mục và dòng dịch vụ/NCC bên dưới, gồm `STT`, `Nhà cung cấp`, `Dịch vụ`, `Dự toán`, `Thực chi`, `Chênh lệch`, `Ghi chú`.
- Ô `Thực chi` được edit trực tiếp bằng input number và nút tăng/giảm nhanh 500.000 đ.

## 2.9 Những file frontend quan trọng nhất

- Router: `frontend/src/App.tsx`
- Auth store: `frontend/src/store/useAuthStore.ts`
- API client: `frontend/src/lib/api/client.ts`
- Domain types: `frontend/src/data/*.ts`

## 2.10 Nguyên tắc implement tiếp

- Không gọi `fetch` trực tiếp trong nhiều page khác nhau cho cùng một resource.
- Mỗi domain có một service file riêng.
- Mapping từ response API sang UI model phải tập trung một chỗ.
- Empty state phải được giữ lại vì repo hiện mặc định không có data seed.

## 2.11 Coordinator - kho dịch vụ và nhà cung cấp

Route chính:

- `/coordinator/services`
- `/coordinator/suppliers`

Kho dịch vụ:

- Chỉ tạo mới service catalog cho `Vé tham quan` và `Các dịch vụ khác`.
- `Vận chuyển` vẫn hiển thị trong catalog nhưng không còn flow tạo mới từ màn này.
- Màn xem chi tiết chỉ có `Sửa`, `Xóa`.
- Màn sửa mới có `Thêm bảng giá` và `Chỉnh sửa` cho từng dòng bảng giá.
- `Vé tham quan` có `Tỉnh thành` dạng select value, không phải nhập tay.

Nhà cung cấp:

- Tách rõ 2 mode `xem` và `sửa`.
- Màn xem chi tiết chỉ có `Sửa`, `Xóa`.
- Màn sửa mới có `Thêm dịch vụ`, `Thêm bảng giá`.
- Nếu là `Khách sạn` và có dịch vụ ăn kèm thì `Thêm bảng giá` nằm ngoài hai bảng, popup cập nhật được cả lưu trú lẫn ăn uống.
- Popup thêm báo giá phải có cả `Đơn giá hiện tại` và `Đơn giá mới`.
- Tab `Hướng dẫn viên` có nút `Thêm HDV` riêng; form chuyên môn có thêm `Ngoại ngữ` dạng multi-select.
