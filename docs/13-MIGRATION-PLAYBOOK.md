# 13. Mock-To-API Migration Playbook

Tài liệu này là kế hoạch thực thi để chuyển repo hiện tại từ:

- frontend demo
- mock data trong `entities/*/data/*`
- local session/localStorage

sang:

- backend API thật
- PostgreSQL + Prisma
- Docker local/staging/prod rõ ràng
- test nhiều lớp

Chỉ là kế hoạch, chưa phải implementation.

## 13.1 Mục tiêu kỹ thuật

Đích đến:

1. Frontend không còn đọc business data trực tiếp từ file mock ở các module đã ship.
2. Tất cả thao tác tạo/sửa/duyệt/nhận điều hành đi qua API.
3. DB lưu được state transition, audit trail, price history, và dữ liệu seed QA.
4. Docker stack chạy được local, staging, production với cùng một contract env.
5. Test được chia tầng: unit, integration, contract, E2E.

## 13.2 Cách chuyển đổi để ít rủi ro nhất

Áp dụng cho từng module:

1. Chốt contract dữ liệu: request/response/error.
2. Chốt schema DB và migration.
3. Seed dữ liệu tối thiểu cho QA.
4. Implement backend repository/service/controller.
5. Tạo frontend API adapter + mapper.
6. Đặt feature flag hoặc fallback adapter nếu cần rollout mềm.
7. Chạy test theo 4 lớp.
8. Chỉ sau khi smoke test pass mới bỏ mock import ở module đó.

## 13.3 Target architecture

### Frontend

- `page` chỉ orchestration UI
- `api client` gọi HTTP
- `mapper` convert response -> UI model
- `form schema` giữ validation frontend
- `calculation preview` chỉ mang tính hỗ trợ; backend là source of truth cuối

### Backend

- `route/controller`
- `service/use-case`
- `repository`
- `Prisma models`
- `zod` validation

### Database

- PostgreSQL
- Migrate bằng Prisma
- Seed riêng cho local/staging QA

## 13.4 Module sequence chi tiết

### Wave A. Auth + session

Frontend ảnh hưởng:

- `frontend/src/shared/store/useAuthStore.ts`
- `frontend/src/features/auth/pages/*`
- các layout guard

Backend cần có:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`

DB cần có:

- `User`
- `RefreshToken`

Điều kiện hoàn tất:

- bỏ `__authLogin`
- test có thể login bằng API hoặc seed token

### Wave B. Public tour + blog

Frontend ảnh hưởng:

- `TourList.tsx`
- `TourDetail.tsx`
- `BlogList.tsx`
- `BlogDetail.tsx`

Backend cần có:

- `GET /tours`
- `GET /tours/:slug`
- `GET /blogs`
- `GET /blogs/:slug`

DB cần có:

- `TourProgram`
- `TourInstance`
- `BlogPost`

### Wave C. Booking end-to-end

Frontend ảnh hưởng:

- `BookingCheckout.tsx`
- `OrderLookup.tsx`
- `BookingHistory.tsx`
- `BookingDetail.tsx`
- `CancelBooking.tsx`
- `SalesBookings.tsx`
- `SalesBookingDetail.tsx`

Backend cần có:

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `GET /bookings/lookup/:bookingCode`
- `POST /bookings/:id/confirm`
- `POST /bookings/:id/cancel-request`
- `POST /bookings/:id/cancel-confirm`

DB cần có:

- `Booking`
- `BookingPassenger`
- `PaymentTransaction`

### Wave D. Tour program + tour instance + internal ops

Frontend ảnh hưởng:

- `TourPrograms.tsx`
- `TourProgramDetail.tsx`
- `TourProgramWizard.tsx`
- `TourInstances.tsx`
- `TourReceiveDispatch.tsx`
- `TourEstimate.tsx`
- `TourSettlement.tsx`
- `ActiveTours.tsx`
- `ManagerTourEstimateApproval.tsx`
- `AdminTourProgramApproval.tsx`

Backend cần có:

- CRUD `tour-programs`
- generate `tour-instances`
- receive dispatch
- save estimate
- approve estimate
- save settlement
- state transition endpoint rõ ràng

DB cần có:

- `TourProgram`
- `TourInstance`
- thêm `estimate` và `settlement` snapshot/history strategy

### Wave E. Supplier + service catalog + guide

Frontend ảnh hưởng:

- `ServiceList.tsx`
- `Suppliers.tsx`
- `DispatchHDVModal.tsx`
- các màn dự toán/nhận điều hành/quyết toán có tham chiếu NCC-dịch vụ

Backend cần có:

- `GET /services`
- `POST /services`
- `PATCH /services/:id`
- `POST /services/:id/prices`
- `GET /suppliers`
- `POST /suppliers`
- `PATCH /suppliers/:id`
- `POST /suppliers/:id/service-lines`
- `POST /suppliers/:id/quotes`
- `GET /guides`
- `POST /guides`
- `PATCH /guides/:id`

DB cần có thêm:

- service catalog master
- supplier service line
- supplier price history
- guide profile
- guide language join table hoặc enum array

### Wave F. Voucher + dashboards

Frontend ảnh hưởng:

- `sales/pages/Vouchers.tsx`
- `manager/pages/Vouchers.tsx`
- `manager/pages/ManagerVoucherApproval.tsx`
- `coordinator/pages/Vouchers.tsx`
- dashboard pages các role

Backend cần có:

- voucher CRUD/approval
- aggregate endpoints cho dashboard

## 13.5 DB extension plan cho internal ops

Schema hiện tại chưa đủ cho 3 cụm sau:

### Service catalog master

Đề xuất:

- `ServiceCatalog`
- `ServiceCatalogPrice`

Lưu:

- loại dịch vụ
- đơn vị
- setup giá
- tỉnh thành với vé tham quan
- công thức quantity/count với dịch vụ khác
- price history

### Supplier operation

Đề xuất:

- `Supplier`
- `SupplierServiceLine`
- `SupplierServicePrice`

Lưu:

- NCC
- loại NCC
- dịch vụ chính/phụ
- quote history
- giá hiện tại và lịch sử giá

### Guide profile

Đề xuất:

- `GuideProfile`
- `GuideLanguage`
- hoặc `languages Json` nếu chấp nhận query/filter nhẹ hơn

Lưu:

- thông tin cá nhân
- số thẻ
- ngày cấp/hết hạn/nơi cấp
- ngoại ngữ

## 13.6 Frontend refactor method theo file

Cho mỗi page đang dùng mock:

1. Tìm toàn bộ `import ... from '@entities/.../data/...`.
2. Tạo `loaders/api` riêng cho domain.
3. Tạo `ui model mapper`.
4. Giữ nguyên DOM/test id/hành vi UI nếu có thể.
5. Đổi test từ mock hook sang seed API.

Ví dụ áp dụng:

- `TourProgramWizard.tsx`: tách `date generation`, `pricing section builder`, `preview row builder`.
- `TourEstimate.tsx`: tách `estimate row builder` và `supplier price expansion`.
- `TourSettlement.tsx`: tách `settlement table adapter`.
- `Suppliers.tsx`: tách `supplier form`, `guide form`, `quote modal`, `service line table`.

## 13.7 Docker plan

### Local

- `docker compose up --build`
- service gồm `frontend`, `api`, `db`
- thêm `seed` step nếu cần

### Staging

- frontend build static
- backend image riêng
- DB staging riêng
- migrate + seed staging sau deploy API

### Production

- frontend deploy static qua Cloudflare Pages
- backend container/VM riêng
- DB managed PostgreSQL
- secret inject từ platform

### Bổ sung nên có

- healthcheck cho `api`
- readiness smoke cho `frontend`
- script migrate + seed tách riêng
- release artifact versioned

## 13.8 Test strategy sau khi chuyển đổi

### Unit test

Backend:

- validator
- service/use-case
- mapper domain

Frontend:

- format/calculation helper
- complex form reducer/adapter

### Integration test

- API + test DB
- Prisma repository
- state transition receive/estimate/settlement

### Contract test

- request/response schema
- error contract
- pagination/filter/sort shape

### E2E

Tách 2 mode:

1. `mock-mode`: giữ để check layout thuần khi dev UI nhanh.
2. `api-mode`: staging-like, dùng seed thật.

### Regression matrix bắt buộc

- public browse + checkout + lookup
- customer history/detail/cancel
- sales confirm/cancel/passenger update
- coordinator create program -> receive -> estimate -> settlement
- manager approve/reject program/estimate/voucher
- supplier/service/guide CRUD cơ bản

## 13.9 Seed strategy

Seed phải có 3 cấp:

### Minimal seed

- user theo role
- vài tour program + tour instance
- vài booking
- vài supplier/guide/service

### QA scenario seed

- tour đủ khách
- tour thiếu khách
- booking chưa thanh toán / thanh toán một phần / hoàn tiền
- voucher draft/pending/active/rejected
- supplier hotel có ăn kèm
- service catalog có attraction + other

### Production bootstrap seed

- role admin/manager/coordinator/sales
- config master data
- không seed booking fake

## 13.10 Deploy checklist khi đã bắt đầu dùng API thật

1. Build frontend pass.
2. Build backend pass.
3. Prisma migrate pass.
4. Seed staging pass.
5. Smoke test route chính pass.
6. E2E api-mode pass tối thiểu cho happy path.
7. Rollback image/build trước đó sẵn sàng.
8. Docs `05`, `06`, `07`, `09`, `10`, `12`, `13` được cập nhật.

## 13.11 Definition of ready cho từng module migration

Một module chỉ được bắt đầu cắt mock khi có đủ:

- danh sách file bị ảnh hưởng
- API contract chốt
- schema DB chốt
- seed plan
- test matrix
- rollback note

## 13.12 Definition of done cho từng module migration

- không còn import mock data business ở page/module đó
- frontend chỉ đọc qua API adapter
- backend có validation + permission + persistence
- seed QA chạy được
- docs cập nhật
- smoke test pass

## 13.13 Interaction contract trước khi cắt mock

Trong giai đoạn hiện tại, frontend vẫn dùng mock data nhưng không được để nút/tương tác đứng yên. Khi chuyển từng module sang API, giữ nguyên nguyên tắc sau:

1. Mỗi action hiện đang cập nhật local state phải được map sang một endpoint hoặc command backend tương ứng.
2. Nếu action hiện chỉ hiển thị `message`, backend phase phải quyết định rõ: đó là command thật, audit event, hay chỉ là UI affordance cần bỏ.
3. Các bảng dự toán/quyết toán phải giữ quan hệ `category -> item -> supplier quote/service quote` để API/DB không mất khả năng expand bảng giá.
4. `TourProgramPricingTables` hiện là mock-state boundary cho chi phí dự kiến khi tạo chương trình; khi nối API nên thay bằng adapter trả về cùng shape UI trước, rồi mới refactor sâu.
5. Các trạng thái nhận điều hành, gửi duyệt dự toán, ngừng kinh doanh, tạm ngừng, hoàn tất quyết toán phải có audit trail: `actorId`, `actedAt`, `fromStatus`, `toStatus`, `reason`.
6. Test sau migration phải chạy lại cùng regression matrix ở mục 13.8, thêm contract test cho payload state transition và price history.

Các lệnh chốt trước khi deploy một batch frontend/mock:

```powershell
cd frontend
cmd /c npx tsc -b --pretty false
cmd /c npm.cmd run build
cmd /c "set PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174&& npx.cmd playwright test"
```

Nếu Playwright CLI bị chặn bởi sandbox `spawn EPERM`, ghi rõ trong release note và chạy lại ở terminal local/CI có quyền spawn browser trước khi coi là verified đầy đủ.
