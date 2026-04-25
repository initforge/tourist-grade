# Setup Nhanh

## 1. Chay app

Can co:

- Docker Desktop dang mo.
- File `.env` duoc gui rieng.

Clone repo:

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

Copy file `.env` vao dung vi tri:

```text
tourist-grade/backend/.env
```

Chay mot lenh:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script tu build Docker, chay database/backend/frontend, mo Cloudflare tunnel, cap nhat `PAYOS_WEBHOOK_URL`, restart backend va confirm webhook PayOS.

Mo web:

```text
http://localhost:8080
```

## 2. Tai khoan

Mat khau tat ca tai khoan:

```text
123456
```

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`

## 3. Mo lai lan sau

Chay lai lenh nay:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Cloudflare quick tunnel co the doi link moi lan chay. Script tu cap nhat webhook PayOS, khong can sua tay.

## 4. Test nhanh

Backend:

```powershell
cd backend
npm run build
npm test
```

Frontend:

```powershell
cd frontend
npm run build
```

E2E khi Docker dang chay:

```powershell
cd frontend
$env:PLAYWRIGHT_BASE_URL='http://localhost:8080'
$env:PLAYWRIGHT_API_BASE_URL='http://localhost:4000/api/v1'
npx playwright test tests/customer-flow.spec.ts tests/ui-surface-audit.spec.ts --workers=1
```

## 5. Lenh huu ich

Xem backend log:

```powershell
docker compose logs -f backend
```

Reset du lieu booking test:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```

## 6. Tunnel co dinh

Quick tunnel khong giu URL co dinh. Muon link co dinh thi can Cloudflare named tunnel + domain that.

Neu chi chay local cho khach xem/test thi dung script la du.
