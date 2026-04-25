# 15. Local Real PayOS Setup For Non-Technical Users

Tài liệu này hướng dẫn chạy Travela trên một máy mới bằng Docker, dùng dữ liệu thật trong PostgreSQL local và PayOS thật. Không dùng mock payment.

## 1. Cần chuẩn bị gì?

Máy mới chỉ cần cài sẵn:

1. Git.
2. Docker Desktop.
3. Trình duyệt Chrome/Edge.
4. Internet ổn định.
5. PayOS credentials thật:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`

Nếu chỉ xem app và test các luồng không thanh toán PayOS thật, không cần PayOS credentials. Nếu muốn tạo link PayOS thật và nhận webhook thanh toán thật, bắt buộc cần 3 key trên và một public webhook URL.

## 2. Clone source code

Mở Terminal/PowerShell tại thư mục muốn lưu project, ví dụ `D:\projects`, rồi chạy:

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

Sau bước này, bạn đang đứng trong thư mục repo, ví dụ:

```text
D:\projects\tourist-grade
```

## 3. Tạo file `.env` ở đúng chỗ

Tạo một file tên chính xác là:

```text
.env
```

Đặt file này ở thư mục gốc repo, ngang hàng với `docker-compose.yml`:

```text
tourist-grade/
  .env                  <-- tạo ở đây
  docker-compose.yml
  README.md
  backend/
  frontend/
  docs/
```

Không tạo file ở `backend/.env` cho Docker Compose flow mới. Docker Compose đọc root `.env`.

## 4. Nội dung file `.env`

Có hai cách điền `.env`:

### Cách A: dùng credentials local đã chuẩn bị trên máy này

Trên máy hiện tại, credentials thật được đặt trong file local-only:

```text
.local/LOCAL-CREDENTIALS.md
```

File này không được commit lên GitHub. Mở file đó, copy block `bash`, rồi dán vào file:

```text
tourist-grade/.env
```

### Cách B: tự điền từ PayOS dashboard

Dán nội dung sau vào file `.env` và thay 3 dòng PayOS bằng credentials thật của tài khoản PayOS đang dùng.

```bash
PAYOS_CLIENT_ID=PASTE_CLIENT_ID_HERE
PAYOS_API_KEY=PASTE_API_KEY_HERE
PAYOS_CHECKSUM_KEY=PASTE_CHECKSUM_KEY_HERE

PAYOS_RETURN_URL=http://localhost:8080/booking/success
PAYOS_CANCEL_URL=http://localhost:8080/booking/lookup
PAYOS_WEBHOOK_URL=https://PASTE_PUBLIC_TUNNEL_URL_HERE/api/v1/payments/payos/webhook

JWT_ACCESS_SECRET=travela-local-access-secret-change-in-production
JWT_REFRESH_SECRET=travela-local-refresh-secret-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Giải thích đơn giản:

- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`: lấy trong PayOS dashboard hoặc copy từ `.local/LOCAL-CREDENTIALS.md` trên máy này.
- `PAYOS_RETURN_URL`: khách thanh toán xong thì quay về local frontend.
- `PAYOS_CANCEL_URL`: khách hủy thanh toán thì quay về trang tra cứu booking.
- `PAYOS_WEBHOOK_URL`: địa chỉ public để PayOS gọi về backend local.
- JWT secret: dùng cho login local, có thể giữ nguyên ở môi trường local.

## 5. Nếu chưa có public tunnel cho webhook

PayOS không gọi được `localhost`. Nếu muốn webhook thật, cần mở tunnel từ internet vào backend local.

Cài Cloudflare Tunnel (`cloudflared`) hoặc dùng công cụ tương đương như ngrok.

Chạy tunnel:

```powershell
cloudflared tunnel --url http://localhost:4000
```

Terminal sẽ in ra một URL dạng:

```text
https://something.trycloudflare.com
```

Copy URL đó và sửa dòng trong `.env`:

```bash
PAYOS_WEBHOOK_URL=https://something.trycloudflare.com/api/v1/payments/payos/webhook
```

Lưu file `.env`.

## 6. Chạy hệ thống

Từ thư mục gốc repo `tourist-grade`, chạy:

```powershell
docker compose up -d --build
```

Lần đầu có thể mất vài phút vì Docker cần tải image và build frontend/backend.

## 7. Mở app

Mở trình duyệt:

```text
http://localhost:8080
```

Backend health check:

```text
http://localhost:4000/health
```

Nếu health trả JSON có `status: "ok"` là backend chạy được.

## 8. Tài khoản đăng nhập

Tất cả dùng mật khẩu:

```text
123456aA@
```

Tài khoản:

- Admin: `admin@travela.vn`
- Manager: `manager@travela.vn`
- Coordinator: `coordinator@travela.vn`
- Sales: `sales@travela.vn`
- Customer: `customer@travela.vn`

## 9. Confirm PayOS webhook

Sau khi backend chạy và `PAYOS_WEBHOOK_URL` đã đúng, đăng nhập một tài khoản bất kỳ để lấy token hoặc dùng UI nếu có chức năng admin gọi confirm.

Cách dễ nhất cho technical operator là gọi API:

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"admin@travela.vn","password":"123456aA@"}'
$token = $login.accessToken
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/payments/payos/confirm-webhook" -Headers @{Authorization="Bearer $token"}
```

Nếu PayOS trả `Webhook URL invalid`, nghĩa là tunnel/domain chưa được PayOS chấp nhận hoặc URL không reachable từ internet.

## 10. Test PayOS thật

Luồng test đúng:

1. Đăng nhập customer hoặc dùng tra cứu booking.
2. Mở booking còn `remainingAmount > 0`, ví dụ booking seed còn nợ.
3. Bấm thanh toán để tạo PayOS link.
4. App mở PayOS checkout URL.
5. Thanh toán bằng QR/chuyển khoản thật hoặc sandbox chính thức nếu PayOS cung cấp.
6. PayOS gọi webhook về backend local qua tunnel.
7. Booking cập nhật:
   - transaction thành `PAID`
   - `paidAmount` tăng
   - `remainingAmount` giảm về đúng số tiền còn lại
   - `paymentStatus` thành `PAID` hoặc `PARTIAL`

## 11. Quy tắc tránh rối payment

Backend hiện xử lý nhất quán như sau:

- Tạo payment link mới cho cùng booking sẽ hủy các PayOS request cũ còn `UNPAID`.
- DB local đánh dấu request cũ là `CANCELLED`.
- Webhook cũ của request đã `CANCELLED` bị ignore.
- Chỉ payment request mới nhất còn hiệu lực nên được khách thanh toán.

Nếu PayOS dashboard còn nhiều dòng `Chờ thanh toán` từ trước khi có bản fix, hãy hủy thủ công trên PayOS dashboard hoặc hủy qua API theo mã đơn hàng.

## 12. Reset dữ liệu local

Nếu test xong muốn đưa DB về trạng thái seed ban đầu:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

Nếu muốn xóa sạch database volume và seed lại từ đầu:

```powershell
docker compose down -v
docker compose up -d --build
```

## 13. Xem logs khi lỗi

Backend logs:

```powershell
docker compose logs -f backend
```

Frontend logs:

```powershell
docker compose logs -f frontend
```

Database logs:

```powershell
docker compose logs -f db
```

## 14. Những lỗi thường gặp

### Mở `localhost:8080` không lên

Chạy:

```powershell
docker compose ps
```

Kiểm tra `travela-frontend` có trạng thái `Up` không.

### Backend health không ok

Chạy:

```powershell
docker compose logs -f backend
```

Thường là DB chưa healthy hoặc env sai.

### PayOS tạo link được nhưng không chuyển paid

Kiểm tra:

1. Tunnel còn chạy không.
2. `PAYOS_WEBHOOK_URL` trong `.env` có đúng tunnel mới nhất không.
3. Đã restart backend sau khi sửa `.env` chưa.
4. Đã confirm webhook với PayOS chưa.
5. PayOS dashboard có ghi giao dịch thành công chưa.

### PayOS dashboard còn nhiều pending cũ

Đó là payment request đã tạo trước đó. Hủy trên PayOS dashboard hoặc dùng API cancel theo `Mã đơn hàng`.

## 15. Lưu ý bảo mật

- Không commit file `.env` thật.
- Không gửi PayOS API key lên GitHub.
- `.env` đã nằm trong `.gitignore`, nhưng vẫn phải cẩn thận không copy credentials vào docs public.
- Production phải dùng JWT secret mạnh riêng, không dùng secret local demo.

