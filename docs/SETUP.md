# Setup Nhanh

## 1. Chay app

Can co:

- Docker Desktop dang mo
- file `backend/.env` hoac `backend/internal.local.env`

Clone repo:

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
```

Neu khong dung file internal co san, copy file `.env` vao dung vi tri:

```text
tourist-grade/backend/.env
```

Chay setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Script se sync PayOS, EmailJS va Cloudflare credentials tu `backend/internal.local.env` vao `backend/.env` neu co san. Sau do script build Docker, chay database/backend/frontend, mo Cloudflare tunnel, cap nhat `PAYOS_WEBHOOK_URL`, restart backend va confirm webhook PayOS.

Mac dinh script khong chay seed du lieu. Neu can du lieu mau, chay co chu dich bang option:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -RunSeed
```

Hoac chay seed rieng:

```powershell
docker compose exec backend npm run prisma:seed
```

Mo web:

```text
http://localhost:8080
```

## 2. Tai khoan seed

Mat khau cho cac tai khoan seed:

```text
123456
```

- `admin@travela.vn`
- `manager@travela.vn`
- `coordinator@travela.vn`
- `sales@travela.vn`
- `customer@travela.vn`

## 3. Chay lai lan sau

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Chay lai script se sync lai credentials va webhook URL, nhung khong seed lai neu khong truyen `-RunSeed`, nen khong xoa du lieu hien co trong database.

## 4. Lenh huu ich

Xem backend log:

```powershell
docker compose logs -f backend
```

Reset booking test fixtures:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/v1/dev/reset-booking-fixtures"
```
