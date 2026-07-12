import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { startOfMonth, startOfQuarter, startOfYear } from '../utils/dates.js';

const router = Router();

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên khách hàng'),
  phone: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  note: z.preprocess(emptyToNull, z.string().nullable().optional()),
  isVip: z.coerce.boolean().default(false),
});

// GET /api/customers?q=&sort=name|createdAt|totalSpent|orderCount&order=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, sort = 'totalSpent', order = 'desc' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ name: { contains: q } }, { phone: { contains: q } }];

    const customers = await prisma.customer.findMany({ where });

    // Aggregate spend + order count per customer (confirmed invoices only).
    const agg = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: { status: 'confirmed', customerId: { not: null } },
      _sum: { total: true },
      _count: { _all: true },
    });
    const stats = new Map<number, { totalSpent: number; orderCount: number }>();
    for (const a of agg) {
      if (a.customerId != null) {
        stats.set(a.customerId, { totalSpent: a._sum.total ?? 0, orderCount: a._count._all });
      }
    }

    let enriched = customers.map((c) => ({
      ...c,
      totalSpent: stats.get(c.id)?.totalSpent ?? 0,
      orderCount: stats.get(c.id)?.orderCount ?? 0,
    }));

    const dir = order === 'asc' ? 1 : -1;
    enriched.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'vi') * dir;
        case 'orderCount':
          return (a.orderCount - b.orderCount) * dir;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        case 'totalSpent':
        default:
          return (a.totalSpent - b.totalSpent) * dir;
      }
    });

    res.json({ data: enriched, total: enriched.length });
  })
);

// GET /api/customers/:id — profile + stats + recent invoices
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new HttpError(404, 'Không tìm thấy khách hàng');

    const invoices = await prisma.invoice.findMany({
      where: { customerId: id, status: 'confirmed' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });

    const now = new Date();
    const mStart = startOfMonth(now);
    const qStart = startOfQuarter(now);
    const yStart = startOfYear(now);

    const sumIn = (from: Date) =>
      invoices.filter((i) => new Date(i.createdAt) >= from).reduce((s, i) => s + i.total, 0);
    const countIn = (from: Date) => invoices.filter((i) => new Date(i.createdAt) >= from).length;

    res.json({
      customer,
      stats: {
        totalSpent: invoices.reduce((s, i) => s + i.total, 0),
        orderCount: invoices.length,
        month: { spent: sumIn(mStart), orders: countIn(mStart) },
        quarter: { spent: sumIn(qStart), orders: countIn(qStart) },
        year: { spent: sumIn(yStart), orders: countIn(yStart) },
        lastOrderAt: invoices[0]?.createdAt ?? null,
      },
      invoices,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({ where: { id: Number(req.params.id) }, data });
    res.json(customer);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    // Invoices keep their customerName snapshot; customerId is set to null (onDelete: SetNull).
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  })
);

export default router;
