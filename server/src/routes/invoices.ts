import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const itemSchema = z.object({
  productId: z.coerce.number().int().nullable().optional(),
  name: z.string().trim().min(1, 'Tên sản phẩm trống'),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().int().min(0),
  importPrice: z.coerce.number().int().min(0).optional(),
});

const invoiceSchema = z.object({
  customerId: z.coerce.number().int().nullable().optional(),
  customerName: z.string().trim().min(1).default('Khách lẻ'),
  customerPhone: z.string().trim().nullable().optional(),
  items: z.array(itemSchema).min(1, 'Hóa đơn cần ít nhất 1 sản phẩm'),
  discount: z.coerce.number().int().min(0).default(0),
  amountPaid: z.coerce.number().int().min(0).optional(),
  note: z.string().nullable().optional(),
  status: z.enum(['confirmed', 'draft', 'cancelled']).default('confirmed'),
});

function makeCode(n: number) {
  return 'HD' + String(n).padStart(4, '0');
}

// GET /api/invoices?q=&from=&to=&sort=createdAt|total&order=&page=&pageSize=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, from, to, sort = 'createdAt', order = 'desc' } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));

    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ code: { contains: q } }, { customerName: { contains: q } }];
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    const orderBy = { [sort === 'total' ? 'total' : 'createdAt']: order === 'asc' ? 'asc' : 'desc' };

    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { items: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ data: rows, total, page, pageSize });
  })
);

// GET /api/invoices/:id — full invoice with items + customer
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, customer: true },
    });
    if (!invoice) throw new HttpError(404, 'Không tìm thấy hóa đơn');
    res.json(invoice);
  })
);

// POST /api/invoices — create a bill (deducts stock in a transaction)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = invoiceSchema.parse(req.body);

    const created = await prisma.$transaction(async (tx) => {
      // Resolve cost snapshots + validate products, build line items.
      const productIds = body.items.map((i) => i.productId).filter((x): x is number => typeof x === 'number');
      const products = productIds.length
        ? await tx.product.findMany({ where: { id: { in: productIds } } })
        : [];
      const productMap = new Map(products.map((p) => [p.id, p]));

      const items = body.items.map((i) => {
        const prod = i.productId != null ? productMap.get(i.productId) : undefined;
        const importPrice = i.importPrice ?? prod?.importPrice ?? 0;
        return {
          productId: prod ? prod.id : null,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          importPrice,
          lineTotal: i.unitPrice * i.quantity,
        };
      });

      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const costTotal = items.reduce((s, i) => s + i.importPrice * i.quantity, 0);
      const total = Math.max(0, subtotal - body.discount);
      const amountPaid = body.amountPaid ?? total;

      // Sequential code based on the latest invoice id (unique, monotonic).
      const last = await tx.invoice.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
      const code = makeCode((last?.id ?? 0) + 1);

      // Deduct stock for real products (only for confirmed sales).
      if (body.status === 'confirmed') {
        for (const i of items) {
          if (i.productId != null) {
            await tx.product.update({ where: { id: i.productId }, data: { quantity: { decrement: i.quantity } } });
          }
        }
      }

      return tx.invoice.create({
        data: {
          code,
          customerId: body.customerId ?? null,
          customerName: body.customerName,
          customerPhone: body.customerPhone ?? null,
          subtotal,
          discount: body.discount,
          total,
          amountPaid,
          costTotal,
          note: body.note ?? null,
          status: body.status,
          items: { create: items },
        },
        include: { items: true, customer: true },
      });
    });

    res.status(201).json(created);
  })
);

// DELETE /api/invoices/:id — delete + restore stock
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id }, include: { items: true } });
      if (!invoice) throw new HttpError(404, 'Không tìm thấy hóa đơn');
      // Return stock if the sale had deducted it.
      if (invoice.status === 'confirmed') {
        for (const i of invoice.items) {
          if (i.productId != null) {
            await tx.product.update({ where: { id: i.productId }, data: { quantity: { increment: i.quantity } } });
          }
        }
      }
      await tx.invoice.delete({ where: { id } }); // items cascade
    });
    res.json({ ok: true });
  })
);

export default router;
