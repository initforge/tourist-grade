# Travela

Travela la he thong dat tour va van hanh tour cho customer, sales, coordinator, manager va admin.

## Chay nhanh

Can:

- Docker Desktop
- file `backend/.env`

```powershell
git clone https://github.com/initforge/tourist-grade.git
cd tourist-grade
# copy file .env vao: tourist-grade/backend/.env
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Setup script khong tu dong seed du lieu.

Khi can du lieu mau, chay thu cong:

```powershell
docker compose exec backend npm run prisma:seed
```

Mo web:

```text
http://localhost:8080
```

## Docs

- `docs/SETUP.md`: huong dan chay local nhanh nhat.
- `docs/00-MUC-LUC.md`: muc luc tai lieu.
- `docs/01-TONG-QUAN.md`: tong quan du an.
- `docs/02-KIEN-TRUC.md`: kien truc he thong.
- `docs/03-LUONG-NGHIEP-VU.md`: cac luong nghiep vu chinh.
