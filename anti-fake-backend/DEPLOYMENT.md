# Hướng dẫn triển khai hệ thống lên Internet

Áp dụng cho cả 3 project: `anti-fake-backend`, `anti-fake-web-admin`,
`anti-fake-consumer-web`. Làm đúng thứ tự — mỗi bước phụ thuộc bước trước.

Tổng quan kiến trúc sau khi deploy:

```
GitHub (3 repo) ──build tu dong──> Railway (backend) ──> Supabase (Postgres + Storage)
                  └─build tu dong─> Vercel (web-admin)
                  └─build tu dong─> Vercel (consumer-web)
```

---

## Phần 1 — Đẩy code lên GitHub

Lặp lại các bước sau cho **cả 3 thư mục** (`anti-fake-backend`,
`anti-fake-web-admin`, `anti-fake-consumer-web`) — mỗi cái là 1 repo riêng.

1. Vào **github.com** → bấm **New repository** → đặt tên (ví dụ
   `anti-fake-backend`) → chọn **Private** (khuyến nghị, vì code chứa logic
   bảo mật) → **Create repository**. Đừng tick "Add README" (project đã có sẵn).

2. Mở terminal VS Code tại đúng thư mục project đó, chạy:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<ten-repo>.git
git push -u origin main
```

Thay `<username>` và `<ten-repo>` bằng thông tin thật. Nếu Git hỏi đăng
nhập, dùng tài khoản GitHub của bạn (có thể cần tạo **Personal Access
Token** thay mật khẩu — GitHub sẽ tự hướng dẫn nếu cần).

**Lưu ý:** file `.env` đã nằm trong `.gitignore` nên sẽ **không** bị đẩy
lên GitHub — đúng như mong muốn (không public secret).

---

## Phần 2 — Tạo database trên Supabase

1. Vào **supabase.com** → **New project** → đặt tên, chọn vùng gần Việt Nam
   nhất (Singapore), đặt mật khẩu database → đợi vài phút khởi tạo.

2. Lấy connection string: **Project Settings** (icon bánh răng) → **Database**
   → mục **Connection string**:
   - Chọn tab **Transaction** (pooler, port 6543) → copy → đây là
     `DATABASE_URL`
   - Chọn tab **Session** (direct, port 5432) → copy → đây là `DIRECT_URL`
   - Cả 2 đều có placeholder `[YOUR-PASSWORD]` → thay bằng mật khẩu bạn đặt
     lúc tạo project.

3. Lấy API key: **Project Settings** → **API**:
   - `Project URL` → đây là `SUPABASE_URL`
   - `service_role` key (KHÔNG phải `anon` key) → đây là
     `SUPABASE_SERVICE_ROLE_KEY`

4. Tạo bucket lưu ảnh: **Storage** (menu trái) → **New bucket** → đặt tên
   chính xác **`fraud-report-images`** → bật **Public bucket** → **Create**.

5. Cập nhật file `.env` cục bộ (để test trước khi deploy) với 4 giá trị vừa
   lấy, rồi chạy thử:

```bash
npx prisma migrate deploy
npm run seed
```

Nếu chạy thành công (không lỗi đỏ) — nghĩa là database Supabase đã có đủ
bảng và dữ liệu mẫu. `npm run seed` sẽ in ra tài khoản đăng nhập demo, ghi
lại để dùng sau.

---

## Phần 3 — Deploy Backend lên Railway

Railway phù hợp cho backend NestJS hơn Vercel vì đây là server chạy liên
tục (không phải serverless function).

1. Vào **railway.app** → đăng nhập bằng GitHub → **New Project** → **Deploy
   from GitHub repo** → chọn repo `anti-fake-backend`.

2. Railway tự nhận diện Node.js project và bắt đầu build. **Trong lúc chờ**,
   vào tab **Variables** của service vừa tạo, thêm từng biến (giống hệt file
   `.env` cục bộ của bạn):

```
DATABASE_URL=...       (tu Supabase, tab Transaction)
DIRECT_URL=...          (tu Supabase, tab Session)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SECRET_HASH_PEPPER=...  (chuoi ngau nhien rieng, KHAC voi luc chay local)
JWT_SECRET=...          (chuoi ngau nhien rieng, KHAC voi luc chay local)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
PORT=3000
```

(`CORS_ORIGIN` sẽ sửa lại thành domain Vercel thật ở Phần 5 — tạm để vậy đã.)

3. File `railway.json` đã có sẵn trong repo, tự động cấu hình Railway chạy
   `npx prisma migrate deploy` trước khi khởi động server mỗi lần deploy —
   không cần làm gì thêm.

4. Đợi build xong (xem tab **Deployments**). Vào tab **Settings** → mục
   **Networking** → bấm **Generate Domain** để có URL public dạng
   `https://anti-fake-backend-production.up.railway.app`.

5. Test thử: mở `https://<domain-railway>/api/v1/verify/public/test` trên
   trình duyệt — thấy JSON trả về (kể cả báo lỗi "not found") nghĩa là
   backend đã chạy được, không phải lỗi 502/504.

**Ghi lại URL Railway này** — cần dùng ở Phần 4.

---

## Phần 4 — Deploy 2 Frontend lên Vercel

Lặp lại cho cả **`anti-fake-web-admin`** và **`anti-fake-consumer-web`**.

1. Vào **vercel.com** → đăng nhập bằng GitHub → **Add New** → **Project** →
   chọn repo tương ứng.

2. Vercel tự nhận diện Vite project (Framework Preset: Vite) — giữ nguyên
   Build Command (`npm run build` hoặc `vite build`) và Output Directory
   (`dist`) mặc định.

3. Mở rộng mục **Environment Variables**, thêm:

```
VITE_API_BASE_URL=https://<domain-railway-tu-Phan-3>
```

4. Bấm **Deploy**. Đợi 1-2 phút, Vercel trả về URL dạng
   `https://anti-fake-web-admin.vercel.app`.

**Ghi lại cả 2 URL Vercel** (web-admin và consumer-web) — cần dùng ở Phần 5.

---

## Phần 5 — Nối lại CORS (bước cuối, bắt buộc)

Quay lại **Railway** → service backend → tab **Variables** → sửa
`CORS_ORIGIN` thành 2 domain Vercel thật vừa có, cách nhau dấu phẩy, **không
có dấu `/` ở cuối**:

```
CORS_ORIGIN=https://anti-fake-web-admin.vercel.app,https://anti-fake-consumer-web.vercel.app
```

Lưu lại — Railway tự động redeploy khi biến môi trường thay đổi. Đợi
redeploy xong (~1 phút).

---

## Kiểm tra toàn hệ thống

1. Mở URL Vercel của `web-admin` → đăng nhập bằng tài khoản đã có từ
   `npm run seed` ở Phần 2 → thử tạo sản phẩm, sinh mã.
2. Mở URL Vercel của `consumer-web` trên điện thoại → quét thử mã QR vừa
   sinh (in mã ra giấy hoặc hiện trên màn hình máy tính khác để quét) →
   kiểm tra luồng xác thực chạy đúng.
3. Thử gửi 1 báo cáo hàng giả (`/report`) có kèm ảnh → vào **Supabase
   Dashboard → Storage → fraud-report-images** kiểm tra ảnh đã xuất hiện.

## Cập nhật code sau này

Từ giờ, mỗi lần bạn `git push` lên GitHub, Railway/Vercel **tự động build
và deploy lại** — không cần thao tác thủ công gì thêm.

## Những gì CHƯA có trong lần deploy này

- **Redis**: chưa deploy Redis (Supabase không cung cấp Redis). Hệ thống
  vẫn chạy được bình thường vì code đã thiết kế "fail-open" khi thiếu Redis
  — chỉ mất tạm tính năng cache tăng tốc và giới hạn tần suất quét. Nếu cần
  sau này, có thể dùng **Upstash Redis** (có gói miễn phí, tương thích
  `ioredis` qua `rediss://` URL) — chỉ cần thêm biến `REDIS_URL` trên
  Railway, không cần sửa code.
- **Custom domain** (ví dụ `admin.tencongty.vn` thay vì `*.vercel.app`) —
  làm được trong Vercel/Railway Settings → Domains, cần bạn có sẵn tên miền.
- **Giám sát lỗi/log tập trung** (Sentry, LogTail...) — chưa cấu hình.
