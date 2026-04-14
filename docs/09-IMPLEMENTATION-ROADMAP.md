# 09. Implementation Roadmap

## 9.1 Mục tiêu

Đi từ trạng thái:

- frontend có đủ màn
- backend mới là scaffold
- không còn mock business data

đến trạng thái:

- full stack chạy được
- frontend đọc dữ liệu thật từ API
- workflow booking/tour/voucher hoạt động end-to-end

## 9.2 Thứ tự implement tối ưu

### Phase 1. Foundation

- cài backend deps
- generate Prisma client
- tạo migration đầu tiên
- chạy được `db + api + frontend` qua Docker

Done khi:

- `/health` trả `200`
- frontend truy cập bình thường
- DB connect ổn định

### Phase 2. Auth

- login
- refresh token
- auth middleware
- role guard phía server

Done khi:

- frontend login bằng API
- bỏ session giả trong `useAuthStore`

### Phase 3. Tour Program + Tour Instance

- CRUD tour program
- generate tour instance
- duyệt bán
- nhận điều hành

Done khi:

- coordinator + manager flow cơ bản chạy bằng DB thật

### Phase 4. Booking

- public list/detail tour đọc API
- checkout tạo booking
- booking lookup
- customer booking history/detail
- sales confirm/cancel flow

Done khi:

- booking end-to-end hoàn chỉnh

### Phase 5. Voucher

- sales tạo voucher
- manager duyệt voucher
- apply voucher ở checkout

### Phase 6. Supplier + Cost Estimate + Settlement

- supplier catalog
- service variants
- estimate save/approve
- settlement save

### Phase 7. Reports

- sales dashboard aggregate
- coordinator dashboard aggregate
- manager summary

### Phase 8. Hardening

- validation hoàn chỉnh
- permission matrix
- audit logging
- integration tests
- seed riêng cho QA

## 9.3 Quy tắc implement để nhanh và chính xác

1. Không làm nhiều module cùng lúc.
2. Mỗi phase phải chốt API contract trước rồi mới code controller/service.
3. Làm migration trước UI integration.
4. Không cho frontend tự suy đoán business status nếu backend có thể trả thẳng.
5. Với mỗi module, hoàn thành theo thứ tự `schema -> repository -> service -> controller -> frontend integration`.

## 9.4 Checklist trước khi chuyển phase

### Trước Phase 2

- env chạy ổn
- DB schema migrate được

### Trước Phase 4

- tour program và tour instance đã có dữ liệu thật

### Trước Phase 6

- booking, payment, voucher phải ổn định

## 9.5 Definition Of Done cho mỗi module

- có schema DB
- có API contract rõ
- có validation
- có permission check
- có happy path test
- frontend bỏ hoàn toàn import dữ liệu cứng cho module đó
