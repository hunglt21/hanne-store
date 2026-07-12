import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Chủ cửa hàng';

/** Sample catalogue drawn from the shop's real bills. */
const SAMPLE_PRODUCTS = [
  { name: 'Nạ thạch Medi Answer Vàng', sku: 'MASK-MEDI-01', category: 'Mặt nạ', quantity: 12, importPrice: 300000, salePrice: 409000, promotionPercent: 0 },
  { name: 'Mặt nạ Cellfusion C (2 màu)', sku: 'MASK-CELL-01', category: 'Mặt nạ', quantity: 200, importPrice: 14000, salePrice: 21500, promotionPercent: 0 },
  { name: 'Nạ HA Tím Rosemine', sku: 'MASK-ROSE-01', category: 'Mặt nạ', quantity: 150, importPrice: 11000, salePrice: 17500, promotionPercent: 0 },
  { name: 'Mặt nạ Luminous các màu Mix', sku: 'MASK-LUMI-01', category: 'Mặt nạ', quantity: 180, importPrice: 10000, salePrice: 16500, promotionPercent: 0 },
  { name: 'Mặt nạ Carophy Mix 2 màu', sku: 'MASK-CARO-01', category: 'Mặt nạ', quantity: 120, importPrice: 16000, salePrice: 25500, promotionPercent: 0 },
  { name: 'Nạ Surmedic Mix 3 loại', sku: 'MASK-SUR-01', category: 'Mặt nạ', quantity: 90, importPrice: 18000, salePrice: 28500, promotionPercent: 0 },
  { name: 'Ủ môi Laneige Fullsize Berry', sku: 'LIP-LAN-01', category: 'Chăm sóc môi', quantity: 25, importPrice: 240000, salePrice: 325000, promotionPercent: 0 },
  { name: 'Ủ môi Laneige Fullsize 3 lớp Box', sku: 'LIP-LAN-02', category: 'Chăm sóc môi', quantity: 18, importPrice: 270000, salePrice: 365000, promotionPercent: 0 },
  { name: 'Tẩy trang Bioderma Hồng 500ml (nắp nhấn)', sku: 'CLEAN-BIO-01', category: 'Tẩy trang', quantity: 30, importPrice: 300000, salePrice: 385000, promotionPercent: 0 },
  { name: 'Bảng mắt Clio Fullsize + Box', sku: 'MAKEUP-CLIO-01', category: 'Trang điểm', quantity: 15, importPrice: 210000, salePrice: 295000, promotionPercent: 5 },
];

const SAMPLE_CUSTOMERS = [
  { name: 'Ms Khánh Linh', phone: '0901234567', address: 'Hà Nội', isVip: true, note: 'Khách quen, hay mua mặt nạ số lượng lớn' },
  { name: 'Ms Diệp Linh', phone: '0912345678', address: 'TP. Hồ Chí Minh', isVip: true, note: 'Thích dòng Laneige' },
  { name: 'Chị Thu Hà', phone: '0987654321', address: 'Đà Nẵng', isVip: false, note: '' },
  { name: 'Khách lẻ', phone: '', address: '', isVip: false, note: 'Khách vãng lai' },
];

function makeCode(n: number) {
  return 'HD' + String(n).padStart(4, '0');
}

async function main() {
  console.log('▶ Seeding Hanne Store database...');

  // 1) Admin user (idempotent upsert)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: { passwordHash, name: ADMIN_NAME },
    create: { username: ADMIN_USERNAME, passwordHash, name: ADMIN_NAME, role: 'owner' },
  });
  console.log(`  ✔ Admin user ready: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);

  // 2) Products — only seed if empty (don't clobber real data)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      await prisma.product.create({ data: p });
    }
    console.log(`  ✔ Inserted ${SAMPLE_PRODUCTS.length} sample products`);
  } else {
    console.log(`  … Products already present (${productCount}), skipping`);
  }

  // 3) Customers — only seed if empty
  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    for (const c of SAMPLE_CUSTOMERS) {
      await prisma.customer.create({ data: c });
    }
    console.log(`  ✔ Inserted ${SAMPLE_CUSTOMERS.length} sample customers`);
  } else {
    console.log(`  … Customers already present (${customerCount}), skipping`);
  }

  // 4) Sample invoices spread over the last few months (for stats/dashboard demo)
  const invoiceCount = await prisma.invoice.count();
  if (invoiceCount === 0) {
    const products = await prisma.product.findMany();
    const customers = await prisma.customer.findMany();
    const byName = (needle: string) => products.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()));

    // A repeatable pseudo set of past sales.
    const now = new Date();
    const salesPlan = [
      { daysAgo: 2, customer: 'Khánh Linh', lines: [['Medi Answer', 1], ['Cellfusion', 5], ['Rosemine', 5], ['Luminous', 5], ['Carophy', 6], ['Surmedic', 6]] as [string, number][], discount: 10500, note: 'TẶNG MASK (CHƯA GIAO)' },
      { daysAgo: 4, customer: 'Diệp Linh', lines: [['Laneige Fullsize Berry', 2], ['Laneige Fullsize 3 lớp', 1], ['Bioderma', 1], ['Clio', 1]] as [string, number][], discount: 10000, note: 'GIFT MASK ĐI KÈM' },
      { daysAgo: 20, customer: 'Thu Hà', lines: [['Cellfusion', 10], ['Rosemine', 10]] as [string, number][], discount: 0, note: '' },
      { daysAgo: 38, customer: 'Khánh Linh', lines: [['Surmedic', 8], ['Carophy', 8]] as [string, number][], discount: 5000, note: '' },
      { daysAgo: 55, customer: 'Diệp Linh', lines: [['Bioderma', 2], ['Laneige Fullsize Berry', 1]] as [string, number][], discount: 0, note: '' },
      { daysAgo: 80, customer: 'Khách lẻ', lines: [['Luminous', 6], ['Cellfusion', 6]] as [string, number][], discount: 0, note: '' },
      { daysAgo: 110, customer: 'Thu Hà', lines: [['Clio', 1], ['Bioderma', 1]] as [string, number][], discount: 20000, note: '' },
    ];

    let counter = 1;
    for (const sale of salesPlan) {
      const cust = customers.find((c) => c.name.toLowerCase().includes(sale.customer.toLowerCase()));
      const createdAt = new Date(now.getTime() - sale.daysAgo * 24 * 60 * 60 * 1000);
      const items = sale.lines
        .map(([needle, qty]) => {
          const prod = byName(needle);
          if (!prod) return null;
          const unitPrice = Math.round(prod.salePrice * (1 - prod.promotionPercent / 100));
          return {
            productId: prod.id,
            name: prod.name,
            quantity: qty,
            unitPrice,
            importPrice: prod.importPrice,
            lineTotal: unitPrice * qty,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const costTotal = items.reduce((s, i) => s + i.importPrice * i.quantity, 0);
      const total = subtotal - sale.discount;

      await prisma.invoice.create({
        data: {
          code: makeCode(counter++),
          customerId: cust?.id ?? null,
          customerName: cust?.name ?? 'Khách lẻ',
          customerPhone: cust?.phone ?? null,
          subtotal,
          discount: sale.discount,
          total,
          amountPaid: total,
          costTotal,
          note: sale.note || null,
          status: 'confirmed',
          createdAt,
          items: { create: items },
        },
      });
    }
    console.log(`  ✔ Inserted ${salesPlan.length} sample invoices`);
  } else {
    console.log(`  … Invoices already present (${invoiceCount}), skipping`);
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
