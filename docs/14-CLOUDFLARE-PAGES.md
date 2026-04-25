# 14. Cloudflare Pages and PayOS Webhook

## Frontend deploy với Cloudflare Pages

Frontend có thể deploy lên Cloudflare Pages sau khi backend có public URL.

Build local:

```bash
cd frontend
npm ci
npm run build
```

Deploy:

```bash
npx wrangler pages deploy dist --project-name tourist-grade
```

Env Pages cần có:

```bash
VITE_API_BASE_URL=https://<public-backend-domain>/api/v1
```

Nếu frontend deploy nhưng backend không public, login/booking/payment sẽ fail.

## Backend public URL

PayOS webhook không gọi được localhost. Backend cần public HTTPS URL.

Các lựa chọn:

- Cloudflare Tunnel.
- Ngrok.
- VPS/container hosting có HTTPS.
- Railway/Render/Fly/Cloud Run hoặc nền tảng tương tự.

## Local PayOS webhook bằng Cloudflare Tunnel

Chạy backend local trước:

```bash
docker compose up -d --build
```

Mở tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
```

Lấy URL dạng:

```text
https://<generated-host>.trycloudflare.com
```

Set root `.env`:

```bash
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
PAYOS_WEBHOOK_URL=https://<generated-host>.trycloudflare.com/api/v1/payments/payos/webhook
```

Restart backend:

```bash
docker compose up -d --build backend
```

Confirm webhook:

```bash
POST http://localhost:4000/api/v1/payments/payos/confirm-webhook
Authorization: Bearer <access-token>
```

## PayOS payment consistency

Khi tạo payment link mới:

1. Backend tìm các PayOS transaction cũ của cùng booking còn `UNPAID`.
2. Backend gọi PayOS cancel cho các order cũ.
3. Backend set local transaction cũ thành `CANCELLED`.
4. Backend tạo link mới và lưu transaction mới `UNPAID`.
5. Webhook của transaction cũ đã `CANCELLED` bị ignore.

Mục tiêu là tránh dashboard PayOS có nhiều yêu cầu thanh toán cùng booking gây nhầm lẫn.

## Test payment thật

Có hai mức test:

### Giả lập webhook hợp lệ

Dùng test backend để verify:

- Signature hợp lệ.
- `code = "00"`.
- Transaction thành `PAID`.
- Booking cập nhật `paidAmount`, `remainingAmount`, `paymentStatus`.

### Thanh toán thật

Cần:

- PayOS credentials thật/sandbox.
- Webhook URL public được PayOS chấp nhận.
- Người test quét QR/chuyển khoản vào link mới nhất.

Sau khi thanh toán thật:

- PayOS dashboard hiển thị giao dịch thành công.
- Backend nhận webhook.
- Booking trong Travela chuyển trạng thái thanh toán đúng.

## Troubleshooting

- `Webhook URL invalid`: URL tunnel/domain không được PayOS chấp nhận hoặc không reachable HTTPS.
- Nhiều dòng `Chờ thanh toán`: kiểm tra backend đã chạy bản có cancel stale payment chưa; hủy các order cũ trên dashboard/API nếu chúng được tạo trước bản fix.
- Webhook không update booking: kiểm tra signature, `orderCode`, transaction local, và backend logs.
