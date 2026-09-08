# Anti-Fake Consumer Web (Frontend công khai cho người tiêu dùng)

Trang web tra cứu công khai — không cần đăng nhập, tối ưu cho điện thoại.
Trien khai CU-01, CU-02, CU-03 trong SRS (thay cho Mobile App o giai doan
dau, xem README goc). Nối trực tiếp vào `anti-fake-backend`.

## Yeu cau

- Backend `anti-fake-backend` đang chạy tại `http://localhost:3000`
- Node.js >= 20
- Trình duyệt hỗ trợ camera (Chrome/Safari/Edge bản mới) để dùng tính năng
  quét QR; nếu không, người dùng vẫn nhập mã thủ công được.

## Cài đặt & chạy

```bash
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:5174` (khác port với `web-admin` — 5173 — để chạy song
song được cả hai).

**Lưu ý:** file `.env` của `anti-fake-backend` cần có
`CORS_ORIGIN="http://localhost:5173,http://localhost:5174"` để cả 2 frontend
đều gọi được API (đã có sẵn trong `.env.example` của backend).

**Camera cần HTTPS hoặc localhost:** trình duyệt chỉ cho phép truy cập
camera trên `localhost` hoặc trang HTTPS. Chạy qua `npm run dev` (localhost)
thì không vấn đề gì; nhưng nếu deploy thật, domain phải có HTTPS.

## Luồng người dùng đã có

1. **Trang chủ** (`/`) — nút "Quét mã QR" (mở camera) hoặc "Nhập mã thủ công"
2. **`/verify/:publicId`** — tra cứu công khai (CU-01), hiển thị thông tin
   sản phẩm, form nhập mã phủ cào, gọi API xác thực và hiển thị 1 trong 6
   trạng thái (CU-02): Chính hãng / Trùng lặp / Sai mã / Thu hồi / Không tồn
   tại / Tạm chặn — mỗi trạng thái có màu và icon riêng theo hệ thống màu
   ngữ nghĩa dùng chung toàn sản phẩm
3. **`/report`** — form báo cáo hàng giả (CU-03): chụp/chọn ảnh (tối đa 4),
   tự động lấy vị trí GPS (xin quyền trình duyệt), tên điểm bán, mô tả

## Chưa có (giai đoạn sau)

- **CU-04 Bảo hành điện tử**, **CU-05 Tích điểm Loyalty**, **CU-06 Lịch sử
  quét cá nhân**, **CU-07 Thông báo đẩy** — các chức năng này cần tài khoản
  người dùng (đăng nhập), trong khi trang này thiết kế để dùng **không cần
  tài khoản** (giống cổng tra cứu công khai GV-05). Muốn có các tính năng
  này cần thêm hệ thống đăng ký/đăng nhập người tiêu dùng — khác hẳn JWT
  doanh nghiệp đang dùng ở `web-admin`.
- **App mobile thật (React Native)** — bản này là web, chưa phải app cài
  đặt qua App Store/Play Store. Về mặt trải nghiệm quét QR và giao diện thì
  tương đương, nhưng thiếu: push notification, hoạt động offline, và cảm
  giác "app" (icon trên màn hình chính) — nếu cần, có thể "Add to Home
  Screen" tạm thời (PWA cơ bản) hoặc build bản React Native riêng sau.
- **Không có PWA manifest/service worker** — trang chưa cài được như app
  qua "Add to Home Screen" một cách chuẩn (thiếu icon, manifest.json).
