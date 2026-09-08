# Anti-Fake Backend — Code-Gen Service + Verify Service (loi xac thuc)

> **Muốn deploy lên Internet (Supabase + Railway + Vercel)?** Xem
> [`DEPLOYMENT.md`](./DEPLOYMENT.md) — hướng dẫn đầy đủ từng bước.

Trien khai phan loi cua tai lieu SRS: sinh ma QR hai lop (muc 4.2), xac thuc
quet chong double-scan/brute-force (muc 4.3), va dong goi Parent-Child (muc
2.3 / 3.2). Day la MVP cua Giai doan 1 trong Roadmap (muc 6.1) — chua co
Kafka/message broker, chua co cac service phu (Loyalty, Warranty, Fraud
Detection rieng biet) — cac phan nay se duoc them o giai doan sau, da co
ghi chu `TODO(giai doan sau)` tai vi tri can moc noi trong code.

## Yeu cau moi truong

- Node.js >= 20
- Docker (de chay Postgres + Redis local), hoac tu chuan bi 2 dich vu nay

## Cai dat

```bash
npm install
cp .env.example .env
# Sua SECRET_HASH_PEPPER trong .env thanh chuoi ngau nhien rieng cua ban

docker compose up -d          # khoi dong Postgres + Redis

npx prisma migrate dev --name init     # tao schema DB
npm run seed                            # tao du lieu mau (doanh nghiep + API key demo)
```

Lenh `npm run seed` se in ra `API Key` va `Batch ID` demo — luu lai de test
cac buoc ben duoi.

## Chay server

```bash
npm run start:dev
```

Server chay tai `http://localhost:3000`.

## Kiem thu nhanh luong day du (curl)

### 1. Sinh ma hang loat cho mot lo san xuat

```bash
curl -X POST http://localhost:3000/api/v1/codegen/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY_TU_SEED>" \
  -d '{"batchId": "<BATCH_ID_TU_SEED>", "quantity": 5}'
```

Ket qua tra ve mang `codes`, moi phan tu co `publicId` (lop cong khai, in
truc tiep len bao bi) va `secretCode` (lop phu cao — **CHI hien thi mot lan
duy nhat luc nay**, khong the lay lai vi DB chi luu hash).

### 2. Tra cuu thong tin cong khai (truoc khi cao)

```bash
curl http://localhost:3000/api/v1/verify/public/<PUBLIC_ID>
```

### 3. Xac thuc quet (sau khi cao lay duoc secretCode)

```bash
curl -X POST http://localhost:3000/api/v1/verify/scan \
  -H "Content-Type: application/json" \
  -d '{
    "publicId": "<PUBLIC_ID>",
    "secretCode": "<SECRET_CODE>",
    "lat": 21.0285,
    "lng": 105.8542,
    "deviceFingerprint": "test-device-001"
  }'
```

Lan dau: `{"result":"VALID"}`.
Goi lai lan hai voi cung publicId/secretCode: `{"result":"DUPLICATE", ...}` —
day chinh la co che chong quet-lai/lam gia tem da su dung, kiem chung dung
theo muc 4.3 buoc 4 (atomic UPDATE, khong phai select-roi-update).

### 4. Dong goi Parent-Child (gan nhieu don vi vao 1 thung)

Truoc tien sinh mot ma thung rieng bang tham so `hierarchyLevel` trong body
(`"hierarchyLevel": "carton"`), sau do sinh cac ma don vi binh thuong
(mac dinh `hierarchyLevel: "unit"`).

```bash
curl -X POST http://localhost:3000/api/v1/codegen/aggregate \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY_TU_SEED>" \
  -d '{"parentPublicId": "<MA_THUNG>", "childPublicIds": ["<MA_1>", "<MA_2>"]}'
```

### 5. Truy vet cay dong goi

```bash
curl http://localhost:3000/api/v1/codegen/trace/<MA_THUNG_HOAC_DON_VI>
```

## Nhung gi CHUA co trong MVP nay (can lam o giai doan sau — xem muc 6.1 SRS)

- **Message broker (Kafka/RabbitMQ)**: hien scan hop le chi ghi `scan_log`,
  chua bat su kien de kich hoat Loyalty/Warranty Service bat dong bo.
- **Fraud Detection Service rieng** (muc 4.4 — `fraud_score_by_region`,
  Heatmap): can them bang `warehouse_export` va job dinh ky tinh
  `volume_anomaly`.
- **`scan_log` dang nam chung Postgres**: theo SRS nen chuyen sang
  ClickHouse/TimescaleDB khi luu luong that lon (muc 3.1) — MVP dung chung DB
  de don gian ha tang luc khoi dong.
- **Xac thuc nguoi dung cuoi (Consumer app)**: hien Verify Service khong yeu
  cau JWT nguoi dung (cho phep quet an danh, dung thiet ke trong luong 5.1),
  nhung cac tinh nang CU-04/CU-05 (bao hanh, tich diem) can them
  `Authorization` header va lien ket `user_id` — se bo sung khi build module
  Consumer.
- **Product Ingestion API (muc 3.3)** cho ERP doanh nghiep day du lieu vao —
  hien moi co CRUD Product/Batch qua Prisma seed, chua co endpoint
  `POST /api/v1/products` public cho tich hop ngoai.
- **Test tu dong (unit/e2e)**: chua co, nen them truoc khi len production,
  dac biet cho VerifyService.verifyScan (kiem tra race condition bang test
  goi song song 2 request cung mot ma).

## API mới cho Web Admin (bổ sung sau bản đầu)

Ngoài Code-Gen/Verify Service ở trên, backend đã có thêm các API phục vụ
frontend `web-admin` (React):

| Endpoint | Method | Auth | Mô tả |
|---|---|---|---|
| `/api/v1/auth/login` | POST | — | Đăng nhập, trả JWT (dùng tài khoản từ `npm run seed`) |
| `/api/v1/auth/me` | GET | Bearer JWT | Thông tin tài khoản hiện tại |
| `/api/v1/products` | GET/POST | Bearer JWT | Danh sách/tạo sản phẩm (EN-01) |
| `/api/v1/products/:id` | GET/PUT/DELETE | Bearer JWT | Chi tiết/sửa/xóa sản phẩm |
| `/api/v1/products/batches` | GET/POST | Bearer JWT | Danh sách/tạo lô sản xuất |
| `/api/v1/warehouse-exports` | GET/POST | Bearer JWT | Ghi nhận & xem lịch sử xuất kho (EN-03) |
| `/api/v1/dashboard/summary` | GET | Bearer JWT | Số liệu tổng hợp cho Dashboard (EN-04) |
| `/api/v1/fraud-reports` | POST | — (public) | Gửi báo cáo hàng giả kèm ảnh (CU-03) |
| `/api/v1/fraud-reports` | GET | Bearer JWT | Danh sách báo cáo cho Web Admin, kèm tổng hợp theo trạng thái/loại hàng hóa (EN-07) |
| `/api/v1/fraud-reports/:id/status` | PATCH | Bearer JWT | Duyệt/từ chối báo cáo |
| `/api/v1/search/products` | GET | — (public) | Tìm kiếm toàn trường (1 từ khóa `q`) — quét tên sản phẩm, số lô, mã ĐKSP, doanh nghiệp... |
| `/api/v1/search/suggest` | GET | — (public) | Gợi ý nhanh cho autocomplete (dùng chung tham số `q`) |
| `/api/v1/counterfeit-alerts` | GET | — (public) | Danh sách sản phẩm đã bị xác nhận hàng giả/vi phạm |
| `/api/v1/counterfeit-alerts` | POST | header `x-admin-key` | Thêm mới 1 bản ghi vào danh sách hàng giả |

## Nhập dữ liệu "Danh sách hàng giả" (Counterfeit Alert)

Đã có sẵn dữ liệu mẫu 40 sản phẩm tại `prisma/data/counterfeit-alerts-seed.json`
(bóc tách từ dữ liệu người dùng cung cấp ban đầu). Import vào DB bằng:

```bash
npm run import:counterfeit
```

Chạy lại nhiều lần an toàn — script tự bỏ qua bản ghi đã tồn tại (so khớp
theo tên sản phẩm + mã ĐKSP). Muốn import file khác:

```bash
npm run import:counterfeit -- duong/dan/file-cua-ban.json
```

File JSON phải là mảng các object theo đúng cấu trúc trong file mẫu
(`productName`, `productType`, `registrationNumber`, `violatingBatches`
(mảng), `responsibleEntity`, `sourceGroup` — chỉ `productName` và
`violatingBatches` là bắt buộc).

Muốn thêm từng bản ghi qua API (ví dụ từ hệ thống khác gọi sang), dùng:

```bash
curl -X POST http://localhost:3000/api/v1/counterfeit-alerts \
  -H "Content-Type: application/json" \
  -H "x-admin-key: <ADMIN_API_KEY trong .env>" \
  -d '{"productName": "...", "violatingBatches": ["..."]}'
```

`/api/v1/codegen/*` giờ chấp nhận **cả** `x-api-key` (ERP) **lẫn** Bearer JWT
(nhân viên đăng nhập Web Admin) — xem `EnterpriseAuthGuard`.

Nhớ set thêm `JWT_SECRET` và `CORS_ORIGIN=http://localhost:5173` trong `.env`
(đã có sẵn trong `.env.example`) để frontend `web-admin` gọi được.

## Kiem thu chiu tai (muc 6.2 SRS)

Sau khi co it nhat vai nghin ma da sinh (buoc 1), dung k6 nham vao
`POST /api/v1/verify/scan` de kiem tra nguong 5.000 req/s. File script mau
`k6-scan-test.js` di kem trong repo — sua `BASE_URL` va danh sach
publicId/secretCode hop le truoc khi chay:

```bash
k6 run k6-scan-test.js
```
