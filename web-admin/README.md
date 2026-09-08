# Anti-Fake Web Admin (Frontend)

> **Deploy lên Vercel?** Xem `DEPLOYMENT.md` trong repo `anti-fake-backend`
> (Phần 4) — hướng dẫn chung cho cả 2 frontend.

Giao diện Web Admin cho Doanh nghiệp (muc 2.3 SRS: EN-01, EN-02, EN-03, EN-04).
React + Vite + TypeScript + Tailwind, nối trực tiếp vào backend NestJS
(`anti-fake-backend`) qua REST API.

## Yeu cau

- Backend `anti-fake-backend` da chay tai `http://localhost:3000` (xem README
  cua backend — chay `npm run seed` de co tai khoan dang nhap demo).
- Node.js >= 20

## Cai dat & chay

```bash
npm install
cp .env.example .env      # chinh VITE_API_BASE_URL neu backend chay port khac
npm run dev
```

Mo `http://localhost:5173`. Dang nhap bang tai khoan duoc in ra tu lenh
`npm run seed` phia backend (mac dinh `admin@demo.vn`).

**Luu y CORS:** backend can bien `CORS_ORIGIN=http://localhost:5173` trong
file `.env` cua backend (da co san trong `.env.example` cua backend) de trinh
duyet cho phep goi API cheo origin.

## Cac man hinh da co

| Man hinh | Chuc nang SRS tuong ung | Mo ta |
|---|---|---|
| Đăng nhập | Xac thuc Web Admin (muc 7 SRS) | Dang nhap bang email/mat khau, luu JWT vao localStorage |
| Dashboard | EN-04 | So mã đã sinh, lượt quét hợp lệ/nghi vấn 30 ngày, biểu đồ theo ngày 14 ngày gần nhất |
| Sản phẩm & Lô | EN-01, EN-02 | Tạo/xem sản phẩm, tạo lô sản xuất, sinh mã hàng loạt (tải CSV) |
| Xuất kho | EN-03 | Ghi nhận thùng hàng xuất đi từng vùng/đại lý |

## Kien truc frontend ngan gon

- `src/lib/api.ts` — wrapper fetch, tu dinh kem JWT, tu dang xuat khi 401
- `src/context/AuthContext.tsx` — trang thai dang nhap toan app
- `src/components/Layout.tsx` — sidebar + topbar dung chung sau dang nhap
- `src/pages/*` — moi trang tuong ung 1 nhom chuc nang EN-xx trong SRS

## Chua co (giai doan sau — xem muc 6.1 SRS)

- **EN-05 Quan ly dai ly phan phoi**, **EN-06 Cau hinh Loyalty**, **EN-07 Xu
  ly bao cao nghi van**, **EN-08 Xuat bao cao tong hop** — chua co man hinh,
  vi backend cung chua co API tuong ung (chi moi lam Product/Warehouse/
  Dashboard).
- **Dong goi Parent-Child qua UI** — backend da co API
  (`POST /api/v1/codegen/aggregate`), nhung chua co man hinh keo-tha/quet de
  thao tac; hien phai goi API truc tiep.
- **Trang chi tiet mot lo** (xem toan bo danh sach ma da sinh, trang thai
  tung ma) — hien chi xem duoc luc vua sinh (trong modal), chua co man hinh
  tra cuu lai sau nay.
- **Phan trang / tim kiem** cho bang San pham, Lo, Xuat kho — dang hien thi
  toan bo danh sach, se cham khi du lieu lon.
- **Responsive mobile day du** — da dung Tailwind responsive co ban nhung
  chua duoc kiem tra ky tren man hinh nho (Web Admin uu tien desktop, dung
  nguyen tac trong tai lieu tong).
