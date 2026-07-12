# Hanne Store 🌿

Hệ thống **quản lý kho & bán hàng** (CMS) chạy hoàn toàn trên máy cá nhân — thay thế cho KiotViet/Sapo mà không tốn phí và không gửi dữ liệu lên bên thứ ba.

- **Frontend:** React + Vite + TypeScript + Tailwind + MUI
- **Backend:** Node + Express + Prisma + **SQLite** (một file, không cần cài server DB)
- Toàn bộ dữ liệu lưu tại `server/prisma/dev.db` trên máy bạn.

## Tính năng

| Module | Mô tả |
| --- | --- |
| 🔐 Đăng nhập | Xác thực JWT, tài khoản admin mặc định |
| 📦 Sản phẩm | Thêm/sửa/xóa, ảnh, giá nhập, giá bán, khuyến mãi, tồn kho |
| 👥 Khách hàng | Hồ sơ, VIP, doanh số theo tháng/quý/năm, lịch sử mua |
| 🧾 Hóa đơn | Lên đơn, xem trước bill, **lưu ảnh / chia sẻ / in** để gửi khách |
| 📊 Thống kê | Doanh thu – chi phí – lợi nhuận theo tháng/quý/năm, top SP & KH |

## Cài đặt (chạy lần đầu)

Yêu cầu: **Node.js 18+**.

```bash
# 1) Cài dependencies cho cả root, server, client
npm run install:all

# 2) Tạo database SQLite + seed dữ liệu mẫu (sản phẩm, khách, hóa đơn)
npm run setup
```

## Chạy ứng dụng

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

Đăng nhập mặc định: **admin / admin123** (đổi trong `server/.env` hoặc màn hình Cài đặt).

## Cấu trúc

```
hanne-store/
├─ client/            # React SPA (Vite + Tailwind + MUI)
│  └─ src/
│     ├─ components/  # Layout, BillPreview, StatCard, RevenueChart...
│     ├─ hooks/       # React Query hooks
│     ├─ pages/       # Dashboard, Products, Customers, Invoices, Stats...
│     └─ lib/         # api client, formatters
├─ server/            # Express + Prisma API
│  ├─ prisma/         # schema.prisma + seed.ts
│  ├─ src/routes/     # auth, products, customers, invoices, stats, upload
│  └─ uploads/        # ảnh sản phẩm (lưu cục bộ)
└─ package.json       # scripts điều phối cả hai
```

## Ghi chú

- Chỉ dùng cục bộ, một người dùng. Không nhằm mục đích production.
- Đổi `JWT_SECRET` trong `server/.env` cho an toàn.
- Sao lưu dữ liệu: copy file `server/prisma/dev.db` và thư mục `server/uploads/`.
- Xem dữ liệu trực quan: `npm --prefix server run db:studio` (Prisma Studio).
