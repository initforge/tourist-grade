# 08. Cleanup Decisions

## 8.1 Mục tiêu cleanup

- Bỏ lệ thuộc vào mock data frontend.
- Chuẩn hóa docs thành một bộ duy nhất, có thứ tự đọc rõ ràng.
- Dọn artefact không tham gia runtime hoặc không còn giá trị cao.

## 8.2 Mock data đã bị rút

- `frontend/src/data/users.ts`
- `frontend/src/data/tours.ts`
- `frontend/src/data/bookings.ts`
- `frontend/src/data/tourProgram.ts`
- `frontend/src/data/vouchers.ts`
- `frontend/src/data/mockData.ts` đã bị thay bằng `frontend/src/data/blogs.ts`

Các file trên hiện chỉ còn:

- type definitions
- status labels/constants
- empty collections tương thích với code hiện tại

## 8.3 Tác động runtime sau cleanup

- Không còn record giả cho users/tours/bookings/tour programs/vouchers/blogs.
- Các màn list/detail liên quan đã được vá empty state hoặc not-found state ở các điểm có nguy cơ crash.

## 8.4 File có thể xóa mà runtime không phụ thuộc

### Đã xác định là không thuộc runtime chính

- root utility scripts kiểu phân tích/tải wireframe
- docs HTML sinh ra từ sheet/export cũ
- file txt parse/extract tạm
- zip tài liệu export

### Đã dọn trong đợt này

- xóa các script tạm ở root: `analyze_images.js`, `download_wireframes.js`, `coordinator_bugs.txt`
- xóa bộ docs cũ trùng chức năng: technical spec, user guide, RBAC, implementation plan, use case markdown cũ
- xóa các file export text/html không còn là source of truth

### Còn sót vì giới hạn sandbox xoá file nhị phân

- `docs/Tour booking -Tính năng.zip`
- `docs/resources/*.jpg`

Các file này không tham gia runtime và không còn được docs mới tham chiếu.

### Chủ động giữ lại

- Playwright config/test
- wireframe/reference nếu còn hữu ích cho QA hoặc đối chiếu UI

Lý do giữ:

- Chúng không ảnh hưởng runtime nhưng vẫn có giá trị cho kiểm thử và đối chiếu nghiệp vụ.

## 8.5 Quy tắc cleanup tiếp theo

- Xóa file chỉ khi không phục vụ runtime, test, docs chuẩn, hoặc roadmap implement.
- Nếu file chỉ là artefact export và không còn được tham chiếu, xóa.
- Khi một module đã có API thật end-to-end, phải lên kế hoạch xóa mock frontend của module đó thay vì để tồn tại vô thời hạn.
- Script/tài liệu tạm tạo ra để xử lý một đợt việc phải bị xóa hoặc hợp thức hóa thành runbook chính thức ngay khi đợt việc kết thúc.
