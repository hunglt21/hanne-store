# Hanne Store 🌿 (Hanne Authentic)

Hệ thống **quản lý kho & bán hàng** (CMS): sản phẩm, khách hàng, hóa đơn, thống kê doanh thu/lợi nhuận — có thể chạy local hoặc **triển khai miễn phí lên internet để dùng ở bất cứ đâu**.

- **Frontend:** React + Vite + TypeScript + Tailwind + MUI
- **Backend:** Node + Express + Prisma + **PostgreSQL**
- **Ảnh sản phẩm** lưu ngay trong database (không cần dịch vụ lưu file riêng)
- Triển khai 1 dịch vụ duy nhất (Express phục vụ luôn bản build React)

## Tính năng

| Module | Mô tả |
| --- | --- |
| 🔐 Đăng nhập | JWT + bcrypt, chống dò mật khẩu (rate-limit) |
| 📦 Sản phẩm | CRUD, ảnh, giá nhập/bán, khuyến mãi, tồn kho — xem **bảng/lưới** + phân trang |
| 👥 Khách hàng | Hồ sơ, VIP, doanh số tháng/quý/năm — xem **bảng/lưới** + phân trang |
| 🧾 Hóa đơn | Lên đơn, xem trước bill, **lưu ảnh / chia sẻ / in** để gửi khách |
| 📊 Thống kê | Doanh thu – chi phí – lợi nhuận theo tháng/quý/năm, top SP & KH |

---

## A. Chạy ở máy (local)

Yêu cầu: **Node.js 18+** và **một database PostgreSQL** (dùng free tại [neon.tech](https://neon.tech) — nên tạo 1 "branch" riêng cho local).

```bash
# 1) Tạo DB Neon, copy connection string dán vào server/.env → DATABASE_URL
#    (giữ ?sslmode=require ở cuối)

# 2) Cài dependencies (root + server + client)
npm run install:all

# 3) Tạo bảng + seed dữ liệu (SEED_SAMPLE="true" trong .env sẽ thêm dữ liệu mẫu)
npm run setup

# 4) Chạy (web :5173, api :4000)
npm run dev
```

Đăng nhập mặc định: **admin / admin123** (đổi trong `server/.env` hoặc màn hình Cài đặt).

---

## B. Triển khai miễn phí lên internet (Render + Neon)

Kết quả: 1 URL `https://...onrender.com` dùng được từ điện thoại/laptop ở bất cứ đâu, **$0/tháng**, tự deploy mỗi khi push GitHub.

> Lưu ý: dữ liệu sẽ nằm trên **Neon** (Postgres đám mây, free tier ~0.5GB) thay vì trên máy bạn. Web trên gói free của Render sẽ "ngủ" khi lâu không dùng → lần truy cập đầu chờ ~30–50 giây.

### Bước 1 — Tạo database (Neon)
1. Đăng ký [neon.tech](https://neon.tech) → **New Project**.
2. Copy **Connection string** (dạng `postgresql://...neon.tech/...?sslmode=require`).

### Bước 2 — Đẩy code lên GitHub
```bash
git init && git add . && git commit -m "Hanne Store"
git branch -M main
git remote add origin https://github.com/<bạn>/hanne-store.git
git push -u origin main
```
(`server/.env` đã được `.gitignore` nên **không** bị đẩy lên — an toàn.)

### Bước 3 — Deploy trên Render
1. Đăng ký [render.com](https://render.com) → **Blueprints** → **New Blueprint Instance** → chọn repo vừa push. Render tự đọc file [`render.yaml`](render.yaml).
2. Điền 2 biến khi được hỏi:
   - `DATABASE_URL` = connection string của Neon (Bước 1)
   - `ADMIN_PASSWORD` = mật khẩu admin bạn muốn
   - (`JWT_SECRET` tự sinh; các biến khác đã có sẵn)
3. **Apply** → Render sẽ cài đặt, tạo bảng, seed tài khoản admin, build web và chạy.
4. Mở URL Render cấp → đăng nhập **admin / mật khẩu bạn đặt**.

> Muốn có sẵn dữ liệu mẫu: đặt biến `SEED_SAMPLE = true` trong Render rồi deploy lại.

### Cập nhật về sau
Chỉ cần `git push` — Render tự build & deploy lại.

---

## Bảo mật & sao lưu
- Đổi `ADMIN_PASSWORD` và để `JWT_SECRET` là chuỗi ngẫu nhiên mạnh (Render tự sinh).
- Đã bật `helmet`, rate-limit đăng nhập, HTTPS (Render tự cấp).
- **Sao lưu**: Neon có snapshot/branch tự động; hoặc `pg_dump` chuỗi kết nối để lấy file backup.

## Đổi logo thật
App đang dùng logo vector tái tạo. Muốn dùng **ảnh gốc**: lưu file vào
`client/public/brand/hanne-logo.png` — logo sẽ tự thay ở mọi nơi (không cần sửa code).

## Cấu trúc
```
hanne-store/
├─ client/            # React SPA (Vite + Tailwind + MUI)
├─ server/            # Express + Prisma API (ảnh lưu trong DB)
│  ├─ prisma/         # schema.prisma (PostgreSQL) + seed.ts
│  └─ src/routes/     # auth, products, customers, invoices, stats, upload, images
├─ render.yaml        # Render Blueprint (deploy 1 dịch vụ)
└─ package.json       # scripts điều phối cả hai
```
