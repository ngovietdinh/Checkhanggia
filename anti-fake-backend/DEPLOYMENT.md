# Hướng dẫn triển khai hệ thống lên Internet (Vercel)

Áp dụng cho repo gộp chung `anti-fake-system` chứa 3 thư mục con: `backend`,
`web-admin`, `consumer-web`. Cả 3 đều deploy lên Vercel (backend chạy dạng
Serverless Function). Làm đúng thứ tự.

Tổng quan kiến trúc:

```
GitHub (1 repo, 3 thu muc con)
   ├─ backend/       ──build tu dong──> Vercel (Serverless Function) ──> Supabase (Postgres + Storage)
   ├─ web-admin/      ──build tu dong─> Vercel (static site)
   └─ consumer-web/    ──build tu dong─> Vercel (static site)
```

**Lưu ý quan trọng về backend trên Vercel (đọc trước khi deploy):**
- Vercel Serverless Function giới hạn cứng **4.5MB/request** — vì vậy ảnh
  báo cáo hàng giả đã được giới hạn **1MB/ảnh, tối đa 3 ảnh**, và frontend
  tự động nén ảnh trước khi gửi (xem `src/lib/image-compress.ts` trong
  `consumer-web`).
- Rate-limit (`@nestjs/throttler`) dùng bộ nhớ trong tiến trình — trên
  serverless, mỗi lần "cold start" có thể là 1 tiến trình mới, nên giới hạn
  tần suất **không hoàn toàn chính xác tuyệt đối** giữa các lần gọi (không
  ảnh hưởng chức năng chính, chỉ là lớp phòng thủ phụ — lớp chính chống
  double-scan vẫn là UPDATE nguyên tử ở database, luôn đúng).
- Có độ trễ "cold start" (~1-3 giây) cho lần gọi đầu tiên sau một thời gian
  không có traffic — các lần gọi tiếp theo nhanh hơn nhiều nhờ tái sử dụng
  tiến trình.

---

## Phần 1 — Đẩy code lên GitHub

Nếu repo `anti-fake-system` đã tồn tại (đã push trước đó), chỉ cần:

```bash
cd anti-fake-system
git add .
git commit -m "Chuan bi deploy len Vercel"
git push
```

---

## Phần 2 — Tạo database trên Supabase

1. **supabase.com** → **New project** → đặt tên, chọn vùng **Southeast Asia
   (Singapore)**, đặt mật khẩu database (ghi lại) → đợi khởi tạo.

2. Bấm nút **Connect** (đầu trang dashboard) → lấy 2 connection string:
   - Tab **Transaction pooler** (cổng 6543) → đây là `DATABASE_URL`
   - Tab **Session pooler** (cổng 5432) → đây là `DIRECT_URL`
   - Thay `[YOUR-PASSWORD]` trong cả 2 bằng mật khẩu đã đặt.

3. **Project Settings → Data API**: copy **Project URL** → `SUPABASE_URL`.

4. **Project Settings → API Keys**: copy key **`service_role`** →
   `SUPABASE_SERVICE_ROLE_KEY`.

5. **Storage** → **New bucket** → tên chính xác **`fraud-report-images`** →
   bật **Public bucket** → **Create**.

6. Cập nhật `.env` cục bộ trong `backend/` với các giá trị trên, chạy thử:

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
npm run import:counterfeit
```

Không lỗi đỏ là Supabase đã sẵn sàng. `npm run seed` in ra tài khoản đăng
nhập demo — ghi lại.

---

## Phần 3 — Deploy Backend lên Vercel

1. **vercel.com** → đăng nhập bằng GitHub → **Add New → Project** → chọn
   repo `anti-fake-system`.

2. Ở bước cấu hình, mở **Root Directory** → **Edit** → chọn thư mục
   **`backend`**.

3. **Framework Preset**: chọn **Other** (không phải Next.js/Vite — Vercel
   dùng `vercel.json` có sẵn trong thư mục để biết cách chạy `api/index.ts`).

4. Mở **Environment Variables**, thêm đầy đủ (giống file `.env` cục bộ, trừ
   2 dòng nên đổi giá trị khác local để tách biệt môi trường):

```
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SECRET_HASH_PEPPER=...   (tao chuoi moi, khac local)
JWT_SECRET=...            (tao chuoi moi, khac local)
ADMIN_API_KEY=...
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

(`CORS_ORIGIN` sửa lại domain Vercel thật ở Phần 5. Không cần set `PORT` —
Vercel tự quản lý, biến này chỉ dùng khi chạy `main.ts` cục bộ.)

5. **Deploy**. Vercel dùng `vercel.json` có sẵn trong `backend/` để route
   toàn bộ request vào `api/index.ts` — không cần chỉnh Build Command.

6. Sau khi deploy xong, lấy URL dạng `https://anti-fake-backend-xxx.vercel.app`.

7. **Chạy migration cho Supabase** (Vercel không có bước "release command"
   như Railway — tự chạy 1 lần từ máy mình, trỏ vào cùng database; nếu đã
   làm ở Phần 2 rồi thì bỏ qua):

```bash
cd backend
npx prisma migrate deploy
```

8. Test: mở `https://<domain-vercel-backend>/api/v1/verify/public/test` —
   ra JSON (kể cả lỗi "not found") là backend chạy được.

**Ghi lại URL backend này** — dùng ở Phần 4.

---

## Phần 4 — Deploy 2 Frontend lên Vercel

Lặp lại cho cả `web-admin` và `consumer-web`:

1. **Add New → Project** → chọn lại cùng repo `anti-fake-system` (Vercel
   cho phép tạo nhiều project từ 1 repo, mỗi project trỏ Root Directory
   khác nhau).

2. **Root Directory** → chọn `web-admin` (hoặc `consumer-web` ở lần thứ 2).

3. Framework Preset: Vercel tự nhận **Vite** — giữ mặc định.

4. **Environment Variables**, thêm:

```
VITE_API_BASE_URL=https://<domain-vercel-backend-tu-Phan-3>
```

5. **Deploy** → lấy URL (ví dụ `https://anti-fake-system-web-admin.vercel.app`
   và `https://anti-fake-system-consumer-web.vercel.app`).

---

## Phần 5 — Nối lại CORS (bắt buộc, làm cuối)

Quay lại project **backend** trên Vercel → **Settings → Environment
Variables** → sửa `CORS_ORIGIN` thành 2 domain Vercel thật vừa có:

```
CORS_ORIGIN=https://anti-fake-system-web-admin.vercel.app,https://anti-fake-system-consumer-web.vercel.app
```

Lưu lại → vào tab **Deployments** → bấm **Redeploy** ở bản mới nhất (sửa
biến môi trường trên Vercel **không** tự động redeploy như Railway, phải
bấm tay).

---

## Kiểm tra toàn hệ thống

1. Mở URL `web-admin` → đăng nhập bằng tài khoản từ `npm run seed` → thử
   tạo sản phẩm, sinh mã.
2. Mở URL `consumer-web` trên điện thoại → quét thử mã QR vừa sinh.
3. Thử gửi báo cáo hàng giả kèm ảnh (`/report`) → kiểm tra ảnh xuất hiện
   trong **Supabase Dashboard → Storage → fraud-report-images**.
4. Thử `/search` — gõ vài ký tự xem gợi ý tự động có hiện không.

## Cập nhật code sau này

Mỗi lần `git push`, cả 3 project trên Vercel **tự động build và deploy
lại**. Vì dùng chung 1 repo, Vercel rebuild cả 3 project mỗi khi có commit
mới (kể cả chỉ sửa 1 file ở 1 thư mục) — không hại gì, chỉ tốn thêm thời
gian build so với 3 repo riêng.

## Những gì CHƯA có / cần lưu ý

- **Redis**: chưa deploy. Hệ thống chạy bình thường (fail-open) nhưng thiếu
  cache tăng tốc + rate-limit theo Redis. Muốn thêm: dùng **Upstash Redis**
  (free tier, tương thích `ioredis` qua `rediss://`), chỉ cần thêm biến
  `REDIS_URL` trên Vercel.
- **File upload giới hạn 1MB/ảnh** do giới hạn cứng của Vercel Serverless
  Function — đã có nén ảnh tự động ở frontend để giảm ảnh hưởng UX.
- **Cold start**: lần gọi đầu tiên sau thời gian không hoạt động sẽ chậm
  hơn (~1-3s). Nếu cần độ trễ ổn định tuyệt đối, cân nhắc chuyển backend
  sang Railway/Render (server chạy liên tục) — code đã tương thích cả 2
  kiểu (`main.ts` cho server thường, `api/index.ts` cho serverless), không
  cần viết lại gì thêm.
- **Custom domain** — làm được trong Vercel Settings → Domains.
