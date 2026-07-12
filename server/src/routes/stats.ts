import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/http.js';
import { addMonths, quarterOf, startOfDay, startOfMonth, startOfYear } from '../utils/dates.js';

const router = Router();

const LOW_STOCK_THRESHOLD = 10;

type Money = { total: number; costTotal: number; createdAt: Date | string };
const sumTotal = (arr: Money[]) => arr.reduce((s, i) => s + i.total, 0);
const sumCost = (arr: Money[]) => arr.reduce((s, i) => s + i.costTotal, 0);

// GET /api/stats/overview
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const dStart = startOfDay(now);
    const mStart = startOfMonth(now);
    const yStart = startOfYear(now);

    const [productAgg, lowStockCount, customerCount, invoiceCount, products, yInvoices] = await Promise.all([
      prisma.product.aggregate({ _count: { _all: true }, _sum: { quantity: true } }),
      prisma.product.count({ where: { quantity: { lte: LOW_STOCK_THRESHOLD } } }),
      prisma.customer.count(),
      prisma.invoice.count({ where: { status: 'confirmed' } }),
      prisma.product.findMany({ select: { quantity: true, importPrice: true, salePrice: true } }),
      prisma.invoice.findMany({
        where: { status: 'confirmed', createdAt: { gte: yStart } },
        select: { total: true, costTotal: true, createdAt: true },
      }),
    ]);

    const inventoryCostValue = products.reduce((s, p) => s + p.importPrice * p.quantity, 0);
    const inventoryRetailValue = products.reduce((s, p) => s + p.salePrice * p.quantity, 0);

    const since = (from: Date) => yInvoices.filter((i) => new Date(i.createdAt) >= from);
    const today = since(dStart);
    const month = since(mStart);

    res.json({
      products: {
        count: productAgg._count._all,
        totalUnits: productAgg._sum.quantity ?? 0,
        lowStockCount,
        inventoryCostValue,
        inventoryRetailValue,
      },
      customers: { count: customerCount },
      invoices: { count: invoiceCount },
      revenue: { today: sumTotal(today), month: sumTotal(month), year: sumTotal(yInvoices) },
      profit: {
        today: sumTotal(today) - sumCost(today),
        month: sumTotal(month) - sumCost(month),
        year: sumTotal(yInvoices) - sumCost(yInvoices),
      },
      orders: { today: today.length, month: month.length, year: yInvoices.length },
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    });
  })
);

// GET /api/stats/revenue?granularity=month|quarter|year&periods=12
router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const granularity = (['month', 'quarter', 'year'].includes(req.query.granularity as string)
      ? req.query.granularity
      : 'month') as 'month' | 'quarter' | 'year';
    const defaults = { month: 12, quarter: 8, year: 5 } as const;
    const periods = Math.min(36, Math.max(1, Number(req.query.periods ?? defaults[granularity])));

    const now = new Date();
    type Bucket = { key: string; label: string; start: Date; end: Date; revenue: number; cost: number; profit: number; orders: number };
    const buckets: Bucket[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      let start: Date;
      let end: Date;
      let label: string;
      let key: string;
      if (granularity === 'month') {
        start = addMonths(startOfMonth(now), -i);
        end = addMonths(start, 1);
        label = `${String(start.getMonth() + 1).padStart(2, '0')}/${start.getFullYear()}`;
        key = label;
      } else if (granularity === 'quarter') {
        const base = addMonths(startOfMonth(now), -i * 3);
        const q = quarterOf(base);
        start = new Date(base.getFullYear(), (q - 1) * 3, 1);
        end = new Date(base.getFullYear(), (q - 1) * 3 + 3, 1);
        label = `Q${q}/${base.getFullYear()}`;
        key = label;
      } else {
        const year = now.getFullYear() - i;
        start = new Date(year, 0, 1);
        end = new Date(year + 1, 0, 1);
        label = String(year);
        key = label;
      }
      buckets.push({ key, label, start, end, revenue: 0, cost: 0, profit: 0, orders: 0 });
    }

    const rangeStart = buckets[0].start;
    const invoices = await prisma.invoice.findMany({
      where: { status: 'confirmed', createdAt: { gte: rangeStart } },
      select: { total: true, costTotal: true, createdAt: true },
    });

    for (const inv of invoices) {
      const t = new Date(inv.createdAt).getTime();
      const b = buckets.find((x) => t >= x.start.getTime() && t < x.end.getTime());
      if (b) {
        b.revenue += inv.total;
        b.cost += inv.costTotal;
        b.orders += 1;
      }
    }
    buckets.forEach((b) => (b.profit = b.revenue - b.cost));

    res.json({
      granularity,
      data: buckets.map(({ start, end, ...rest }) => rest),
      totals: {
        revenue: buckets.reduce((s, b) => s + b.revenue, 0),
        cost: buckets.reduce((s, b) => s + b.cost, 0),
        profit: buckets.reduce((s, b) => s + b.profit, 0),
        orders: buckets.reduce((s, b) => s + b.orders, 0),
      },
    });
  })
);

// GET /api/stats/top-products?limit=5&days=
router.get(
  '/top-products',
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 5)));
    const days = req.query.days ? Number(req.query.days) : null;
    const from = days ? new Date(Date.now() - days * 86400000) : undefined;

    const items = await prisma.invoiceItem.findMany({
      where: { invoice: { status: 'confirmed', ...(from ? { createdAt: { gte: from } } : {}) } },
      select: { productId: true, name: true, quantity: true, lineTotal: true, importPrice: true },
    });

    const map = new Map<string, { productId: number | null; name: string; quantity: number; revenue: number; profit: number }>();
    for (const it of items) {
      const key = it.productId != null ? `p${it.productId}` : `n:${it.name}`;
      const cur = map.get(key) ?? { productId: it.productId, name: it.name, quantity: 0, revenue: 0, profit: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.lineTotal;
      cur.profit += it.lineTotal - it.importPrice * it.quantity;
      map.set(key, cur);
    }
    const data = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    res.json({ data });
  })
);

// GET /api/stats/top-customers?limit=5&days=
router.get(
  '/top-customers',
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 5)));
    const days = req.query.days ? Number(req.query.days) : null;
    const from = days ? new Date(Date.now() - days * 86400000) : undefined;

    const agg = await prisma.invoice.groupBy({
      by: ['customerId', 'customerName'],
      where: { status: 'confirmed', ...(from ? { createdAt: { gte: from } } : {}) },
      _sum: { total: true },
      _count: { _all: true },
    });

    const data = agg
      .map((a) => ({
        customerId: a.customerId,
        name: a.customerName,
        totalSpent: a._sum.total ?? 0,
        orderCount: a._count._all,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    res.json({ data });
  })
);

export default router;
