# 10. Setup To Production Runbook

Mục tiêu của tài liệu này là chốt thứ tự setup và các quyết định vận hành để sau này triển khai nhanh, ít sai và không phải suy luận lại từ đầu.

## 10.1 Mục tiêu cuối

Đi từ trạng thái hiện tại:

- frontend đã có đủ màn
- một phần flow vẫn đang cần mock để demo UI
- backend mới là scaffold
- DB schema mới là draft đầu tiên

đến trạng thái:

- local full stack chạy được ổn định
- staging có seed dữ liệu dùng cho QA/demo
- production dùng API thật, không phụ thuộc mock frontend
- deploy có checklist và rollback rõ ràng

## 10.2 Quy tắc thực hiện

1. Không xóa mock frontend trước khi API thay thế module đó đã chạy end-to-end.
2. Với mỗi module, chốt theo thứ tự `schema -> migration -> seed -> API -> frontend integration -> test -> deploy`.
3. Chỉ cho phép frontend đọc dữ liệu thật qua API khi endpoint, validation và error contract đã ổn.
4. Seed demo phải nằm ở backend/DB, không hard-code trực tiếp trong page/component.
5. Mọi thay đổi ảnh hưởng deploy phải cập nhật lại docs `05`, `06`, `07`, `09`, `10`.

## 10.3 Môi trường cần có

### Công cụ máy dev

- Node.js `20.x`
- npm `10.x`
- Docker Desktop
- PostgreSQL client hoặc TablePlus/DBeaver
- Git
- Wrangler CLI cho Cloudflare Pages nếu frontend production đang deploy qua Pages

### Tài khoản / quyền truy cập

- Cloudflare Pages project cho frontend
- Registry hoặc máy host cho backend production
- PostgreSQL staging và production
- nơi lưu secret: `.env`, secret manager, hoặc Cloudflare/host config

## 10.4 Ma trận môi trường

### Local

- frontend chạy Vite hoặc Docker
- backend chạy Node/Express
- DB chạy PostgreSQL local
- cho phép seed dữ liệu demo

### Staging

- giống production về kiến trúc
- có seed QA/demo
- test deploy trước khi lên production

### Production

- frontend build tĩnh
- backend API chạy độc lập
- DB production riêng
- không dùng mock frontend cho nghiệp vụ thật

## 10.5 Env cần chuẩn hóa

### Frontend

File mẫu: `frontend/.env.example`

Biến tối thiểu:

- `VITE_API_BASE_URL`
- `VITE_AUTH_TOKEN_KEY`
- `VITE_APP_ENV`

### Backend

File mẫu: `backend/.env.example`

Biến tối thiểu:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV`

### Quy ước

- local: `.env.local`
- staging: `.env.staging`
- production: inject từ hệ thống deploy, không commit

## 10.6 Trình tự setup local chuẩn

1. Cài dependency frontend và backend.
2. Copy file env từ `.env.example`.
3. Khởi động PostgreSQL local bằng Docker.
4. Chạy Prisma generate.
5. Tạo migration đầu tiên.
6. Seed dữ liệu demo vào DB.
7. Chạy backend.
8. Chạy frontend trỏ về API local.
9. Verify các route quan trọng.

### Lệnh chuẩn dự kiến

```bash
npm --prefix frontend install
npm --prefix backend install
docker compose up -d db
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Ở terminal khác:

```bash
cd frontend
npm run dev
```

## 10.7 Dữ liệu demo và seed

### Giai đoạn chuyển tiếp

- giữ mock frontend chỉ để không làm gãy demo
- nhưng khi một module có API thật thì frontend phải chuyển sang gọi API module đó

### Đích đến

- seed nằm ở backend
- staging luôn có seed ổn định cho các flow:
  - public list/detail/checkout
  - booking lookup
  - customer booking history
  - sales booking review
  - coordinator tour instance / estimate
  - manager approval

### Bộ seed tối thiểu

- `users`
- `tour_programs`
- `tour_instances`
- `bookings`
- `vouchers`
- `suppliers`
- `blog_posts`

## 10.8 Thứ tự triển khai để nhanh nhất

### Wave 1. Foundation

- hoàn thiện `docker-compose`
- chạy được `frontend + api + db`
- Prisma migrate + seed cơ bản
- `/health` và API versioning ổn

### Wave 2. Auth + User

- login
- refresh token
- auth middleware
- role guard
- frontend auth bỏ session giả

### Wave 3. Public Tour

- `/tours`
- `/tours/:slug`
- `/booking/lookup`
- `/blog`

Đây là wave cần ưu tiên cao vì ảnh hưởng demo trực tiếp.

### Wave 4. Checkout + Booking

- tạo booking
- tính giá
- mã giảm giá
- partial/full payment flow
- lookup / history / detail

### Wave 5. Internal Ops

- tour program
- tour instance
- supplier
- estimate
- settlement
- voucher approval

## 10.9 Checklist trước khi tích hợp từng module

Trước khi frontend bỏ mock cho một module, bắt buộc có:

- schema DB của module
- migration chạy được
- seed tối thiểu
- API contract rõ request/response/error
- service validation
- permission check
- smoke test route chính

## 10.10 Staging checklist

1. Build frontend pass.
2. Backend compile pass.
3. Prisma migrate chạy trên DB staging.
4. Seed staging chạy được.
5. Env staging đúng origin frontend/backend.
6. Login hoạt động.
7. Public list/detail hoạt động.
8. Checkout tạo booking thành công.
9. Lookup và booking history đọc được dữ liệu thật.
10. Các role admin/manager/coordinator/sales vào đúng dashboard.

## 10.11 Production kiến trúc mục tiêu

### Frontend

- build từ `frontend/dist`
- deploy qua Cloudflare Pages hoặc static hosting tương đương
- env production phải trỏ tới API production

### Backend

- chạy container riêng hoặc VM riêng
- expose HTTPS domain riêng, ví dụ `api.<domain>`
- có healthcheck, restart policy và log tập trung

### Database

- PostgreSQL managed hoặc self-host có backup
- tách riêng DB staging và production
- bật backup định kỳ và retention

## 10.12 Release flow đề xuất

1. Merge vào branch staging.
2. Deploy staging.
3. Chạy smoke test theo checklist.
4. Approve release.
5. Tag version.
6. Deploy production backend trước.
7. Chạy migration production.
8. Deploy frontend production sau.
9. Chạy smoke test production.

## 10.13 Smoke test production tối thiểu

- trang chủ mở được
- `/tours` mở được
- một slug detail mở được
- checkout vào được
- booking lookup trả đúng đơn mẫu
- login từng role hoạt động
- dashboard từng role không trắng trang

## 10.14 Rollback plan

### Frontend

- redeploy build trước đó trên Pages/static host

### Backend

- rollback container image về tag cũ
- nếu migration phá backward compatibility thì phải có migration down hoặc hotfix tương ứng

### Database

- migration production chỉ được chạy khi đã có backup
- migration phá dữ liệu phải có kế hoạch rollback trước khi approve

## 10.15 Definition of Ready để bắt đầu implementation thật

Bắt đầu code production-ready khi tất cả điều kiện sau đúng:

- docs `03`, `05`, `06`, `09`, `10` đã đủ
- env local/staging đã chốt
- tên domain deploy đã chốt
- nơi lưu secret đã chốt
- chiến lược seed staging đã chốt
- người chịu trách nhiệm deploy và rollback đã chốt

## 10.16 Definition of Done để lên production

- frontend không còn phụ thuộc mock cho module đã ship
- backend API chạy qua staging và production
- DB migration + seed + backup đã xác nhận
- smoke test production pass
- docs được cập nhật theo trạng thái thực tế cuối cùng

## 10.17 Cleanup sau khi hoàn tất từng giai đoạn

Nguyên tắc là file/phần tạm chỉ được tồn tại khi nó còn phục vụ một mục đích rõ ràng. Khi đã hết nhiệm vụ, phải dọn ngay thay vì để tích tụ.

### Phải xóa khi module đã hoàn tất

- mock frontend của module đó nếu API thật đã thay thế hoàn toàn
- seed tạm chỉ dùng một lần để migrate thủ công
- script ad-hoc chỉ phục vụ một đợt fix hoặc import dữ liệu
- docs cũ bị superseded bởi docs mới
- export artifact không còn được tham chiếu

### Được giữ lại nếu còn giá trị vận hành

- test e2e/integration
- seed staging/QA có kiểm soát
- migration lịch sử
- runbook deploy/rollback
- wireframe/reference còn dùng để đối chiếu nghiệm thu

### Điều kiện xóa mock frontend của một module

Chỉ xóa khi tất cả điều kiện sau đúng:

- list page của module đọc API thật
- detail page của module đọc API thật
- create/update flow của module ghi API thật nếu module có thao tác ghi
- empty/error/loading state đã có
- test smoke của module pass
- staging đã verify xong

### Checklist cleanup sau mỗi wave

1. Xác định file tạm được tạo trong wave đó.
2. Gắn nhãn từng file: `keep`, `replace`, hoặc `delete`.
3. Xóa các file `delete` ngay trong cùng PR/đợt hoàn tất.
4. Nếu giữ lại file `replace` tạm thời, ghi rõ lý do và deadline xóa trong docs hoặc issue.
5. Cập nhật docs index nếu source of truth thay đổi.

### Cleanup bắt buộc trước production final

- xóa hoặc cô lập toàn bộ mock business data còn lại trên frontend
- xóa import trực tiếp từ `frontend/src/data/*` cho các module đã có API
- xóa script/dev helper không còn phục vụ deploy, test hoặc rollback
- dọn docs trùng lặp và artifact đã hết giá trị
- rà lại `.env.example`, `README`, `00-INDEX`, `07`, `09`, `10`

### Kết quả mong muốn

Sau khi hoàn tất production:

- repo không còn file “để đó cho chắc”
- mọi file còn lại đều có lý do tồn tại rõ ràng
- không còn mock frontend bị lẫn với code production-ready
- người mới vào chỉ cần đọc docs + code hiện hành, không bị nhiễu bởi tàn dư của giai đoạn chuyển tiếp
