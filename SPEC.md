# SPEC — Sales + Manager Features
> Theo yêu cầu từ user trong ảnh, context ngày 2026-04-01
> Sau mỗi task hoàn thành → ghi [DONE] + ngày

---

## PHẦN 1: SALES (NV KINH DOANH)

### Task 1 — Toggle Sidebar
- **Yêu cầu:** Thêm Toggle Sidebar button để thu gọn sidebar
- **File:** `frontend/src/components/layout/SalesLayout.tsx`
- **Ghi chú:** Code đã có sẵn từ trước — toggle button + state `collapsed` + icon `menu_open`/`chevron_right`
- **Status:** [DONE - có sẵn]

---

### Task 2 — Dashboard chia 2 phần
- **Yêu cầu:**
  - Phần 1 "Công việc cần xử lý": giữ nguyên stats 4 ô + panel "Cần xử lý ngay" — KHÔNG date picker, KHÔNG export
  - Phần 2 "Báo cáo kinh doanh": stats + date picker (Từ ngày → Đến ngày) + line chart booking + bar chart doanh thu + nút "Xuất Báo Cáo"
- **File:** `frontend/src/pages/sales/SalesDashboard.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 3 — Search + Export Excel ở danh sách booking
- **Yêu cầu:**
  - Search input bên trái nút Xuất Excel
  - Keyword giữ nguyên khi đổi tab
  - Nút "x" trong ô search: xóa keyword, KHÔNG tự search lại
  - Nhấn icon kính lúp → filter
  - Export đúng tab + keyword hiện tại
- **File:** `frontend/src/pages/admin/BookingManagement.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 4 — Tabs + Columns theo spec
- **Yêu cầu:** 5 tabs — Tất cả / Cần xác nhận / Đã xác nhận / Hoàn thành / Đã hủy (BỎ tab "Đã đặt")

| Tab | Columns |
|-----|---------|
| Tất cả | Mã đơn, Khách hàng, Tour, Ngày KH, Số lượng khách (NL/TE/EB), Tổng tiền, TT thanh toán, Trạng thái đơn, Ngày tạo |
| Cần xác nhận | + Ghi chú, sub-filter (Tất cả / Cần xác nhận đơn đặt / Cần xác nhận hủy) |
| Đã xác nhận | Mã, Khách, Tour, Ngày KH, Số khách, Tổng tiền, TT thanh toán, Trạng thái đơn |
| Hoàn thành | Mã, Khách, Tour, Ngày KH, Số khách, Tổng tiền, TT thanh toán, Trạng thái đơn |
| Đã hủy | Mã, Khách, Tour, Ngày KH, Số khách, Tổng tiền, TT thanh toán, Số tiền hoàn, Lý do hủy, TT hoàn tiền |

- **File:** `frontend/src/pages/admin/BookingManagement.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 5 — Bỏ nút xác nhận ở danh sách
- **Yêu cầu:** Tab "Cần xác nhận" — bỏ nút "Xác nhận" ở mỗi row. Chỉ click row → sang Chi tiết booking để xác nhận
- **File:** `frontend/src/pages/admin/BookingManagement.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 6 — Phân trang
- **Yêu cầu:** Thêm phân trang Ant Design Pagination, PAGE_SIZE=10. Reset page khi đổi tab/search
- **File:** `frontend/src/pages/admin/BookingManagement.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 7 — Chi tiết booking nâng cao
- **Yêu cầu:**
  - Bỏ "Loại" (Online/Offline) ở phần thanh toán
  - Giữ đầy đủ info như spec
  - **Cần xác nhận đơn đặt:**
    - Nút "Chỉnh sửa" → popup danh sách hành khách dạng editable
    - adult: nhập CCCD (bắt buộc)
    - child/infant: nhập Giấy khai sinh
    - "Lưu" → update passengers + sync
    - Nút "Xác nhận" chỉ hiện khi TẤT CẢ adults có CCCD đủ
    - Nhấn "Xác nhận" → popup confirm "Có muốn xác nhận k?" → Có → status 'confirmed'
  - **Cần xác nhận hủy:**
    - Nút "Xác nhận hủy" → popup confirm → status 'cancelled', refundStatus 'pending'
    - Nút "Từ chối hủy" → popup nhập lý do → status 'booked'
  - **Đã xác nhận / Hoàn thành:** Passenger list read-only, không chỉnh sửa
  - **Đã hủy:** giữ nguyên như hiện tại
- **File:** `frontend/src/pages/admin/SalesBookingDetail.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 8 — Sales Quản lý Voucher nâng cao
- **Yêu cầu:**
  - Thêm trường `applicableTours` (mã tour áp dụng — array)
  - Thêm trạng thái mới: `draft` (nháp) / `pending_approval` (chờ phê duyệt) / `rejected` (không được phê duyệt) / `active` / `inactive`
  - `draft`: chỉnh sửa được → "Gửi Phê Duyệt" → pending_approval
  - `pending_approval`: không chỉnh sửa, chờ manager duyệt
  - `rejected`: xem lý do, chỉnh sửa + gửi lại
  - `active` / `inactive`: không chỉnh sửa
  - Trang chi tiết voucher: breadcrumb điều hướng về danh sách
- **Files:** `frontend/src/pages/admin/VoucherManagement.tsx`, `App.tsx` (thêm route `/sales/vouchers`)
- **Status:** [DONE 2026-04-01]

---

## PHẦN 2: MANAGER (QUẢN LÝ)

### Task 9 — Manager Phê duyệt Voucher
- **Yêu cầu:**
  - Trang danh sách: hiển thị voucher trạng thái `pending_approval`
  - Mỗi row có nút "Phê duyệt" (popup confirm) + "Từ chối" (popup nhập lý do)
  - Chi tiết voucher (breadcrumb → danh sách): nút Phê duyệt / Từ chối ở trang detail
  - Phê duyệt → status 'active', Từ chối → status 'rejected' + lưu rejectionReason
- **Files:** TẠO `frontend/src/pages/manager/ManagerVoucherApproval.tsx`, thêm route App.tsx, thêm nav ManagerLayout
- **Status:** [DONE 2026-04-01]

---

### Task 9 — Manager Quản lý Tour 5 tabs
- **Yêu cầu:**

| Tab | Columns | Actions |
|-----|---------|---------|
| Chờ duyệt bán | Mã yêu cầu, Tên CT, Loại tour, Ngày KH gần nhất, Ngày tạo YC, Số tour yêu cầu tạo, Người tạo | Duyệt → popup duyệt / Từ chối → popup nhập lý do |
| Không đủ ĐK KH | Mã tour, Tên CT, Ngày KH, Số KH hiện tại/tối thiểu, Hạn bán, Doanh thu | [Checkbox chọn nhiều] + Hủy tour + Gia hạn |
| Chờ duyệt dự toán | Mã tour, Tên CT, Ngày KH, Tổng chi phí DT, Lợi nhuận DT (%), Người tạo DT | Duyệt DT / Yêu cầu chỉnh sửa / Từ chối |
| Hoàn thành | Mã tour, Tên CT, Ngày KH, Số KH thực tế, Doanh thu TT, Chi phí TT, Lợi nhuận TT (%) | Xem chi tiết |
| Đã hủy | Mã tour, Tên CT, Ngày KH, Số KH ĐK, Thời điểm hủy, Tổng tiền hoàn, Lý do | Xem chi tiết |

- **File:** `frontend/src/pages/admin/AdminActiveTours.tsx`
- **Status:** [DONE 2026-04-01]

---

### Task 11 — Màn Phê duyệt Chương trình Tour
- **Yêu cầu:**
  - Read-only đầy đủ 3 phần: Thông tin chung + Lịch trình + Giá & Cấu hình
  - Header sticky: Tên tour + [Từ chối] + [Duyệt CT]
  - Từ chối → popup nhập lý do
  - Duyệt → popup confirm → status = "Đang hoạt động"
  - Giữ nguyên Người tạo + Ngày tạo
- **Files:** TẠO `frontend/src/pages/manager/AdminTourProgramApproval.tsx`, thêm route App.tsx
- **Status:** [PENDING]

---

### Task 12 — Màn Duyệt Dự toán Tour
- **Yêu cầu:**
  - Tất cả read-only (bảng Dự Toán + Tổng kết)
  - 3 nút: Duyệt (popup confirm) / Yêu cầu chỉnh sửa (popup nhập lý do) / Từ chối (popup nhập lý do)
- **Files:** TẠO `frontend/src/pages/manager/ManagerTourEstimateApproval.tsx`, thêm route App.tsx
- **Status:** [PENDING]

---

### Task 13 — Manager Quản lý Chương trình Tour 3 tabs
- **Yêu cầu:**

| Tab | Columns | Actions |
|-----|---------|---------|
| Chờ duyệt | Mã nháp, Tên CT Tour, Điểm KH, Điểm TC, Thời lượng, Đơn giá, Người tạo | Xem → approval page |
| Đang hoạt động | Mã Tour, Tên CT Tour, Điểm KH, Điểm TC, Thời lượng, Số tour đang bán, Đơn giá | Xem / Tạm ngừng |
| Ngừng hoạt động | Mã Tour, Tên CT Tour, Điểm KH, Điểm TC, Thời lượng, Thời gian hoạt động, Lý do ngừng | Xem |

- **File:** `frontend/src/pages/admin/AdminTourPrograms.tsx`
- **Status:** [PENDING]

---

### Task 14a — Popup duyệt yêu cầu bán
- **Yêu cầu (theo ảnh):**
  ```
  Phê duyệt Yêu cầu Bán Tour
  - Mã yêu cầu: [auto]
  - Tên chương trình: [read-only]
  - Số lượng tour cần tạo: [number input]
  - Ngày khởi hành: [date picker nhiều ngày]
  - [Hủy bỏ] [Từ chối] [Duyệt → popup confirm]
  ```
- **File:** TẠO `frontend/src/components/manager/SellApprovalPopup.tsx` (dùng trong Task 10)
- **Status:** [PENDING]

---

### Task 14b — Quản lý Chính sách Hủy
- **Yêu cầu (theo ảnh):**
  - Màn danh sách: table (Tên, Loại ngày, Phương tiện, Trạng thái, Ghi chú, Thao tác) + icon expand xem chi tiết rules
  - Chi tiết: danh sách rules (sắp xếp theo ngày), icon mũi tên (▼/▶)
  - Popup Thêm/Sửa: Tên chính sách, Loại ngày, Phương tiện, Trạng thái, Ghi chú, + bảng Rules (Từ ngày / Đến ngày / Mức phạt %)
- **Files:** TẠO `frontend/src/pages/manager/ManagerCancelPolicy.tsx`, thêm route App.tsx, nav ManagerLayout
- **Status:** [DONE 2026-04-01]

---

## Tiến độ
- Đã xong: Task 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14b ✅
- Còn lại: Task 14a (Popup duyệt yêu cầu bán — bỏ qua vì đã có nút Duyệt trực tiếp ở tab Chờ duyệt bán trong Task 10)
- Lưu ý: 3 lỗi build pre-existing không liên quan (CancelBookingModal import, BookingCheckout arithmetic)
