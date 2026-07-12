import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên sản phẩm'),
  sku: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  description: z.preprocess(emptyToNull, z.string().nullable().optional()),
  imageUrl: z.preprocess(emptyToNull, z.string().nullable().optional()),
  category: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  quantity: z.coerce.number().int().min(0).default(0),
  importPrice: z.coerce.number().int().min(0).default(0),
  salePrice: z.coerce.number().int().min(0).default(0),
  promotionPercent: z.coerce.number().min(0).max(100).default(0),
  isActive: z.coerce.boolean().default(true),
});

// GET /api/products?q=&category=&sort=&order=&lowStock=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, category, sort = 'createdAt', order = 'desc', lowStock } = req.query as Record<string, string>;
    const sortable = ['createdAt', 'name', 'quantity', 'salePrice', 'importPrice'];
    const orderBy = { [sortable.includes(sort) ? sort : 'createdAt']: order === 'asc' ? 'asc' : 'desc' };

    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }, { category: { contains: q } }];
    if (category) where.category = category;
    if (lowStock === 'true') where.quantity = { lte: Number(req.query.threshold ?? 10) };

    const products = await prisma.product.findMany({ where, orderBy });
    res.json({ data: products, total: products.length });
  })
);

// GET /api/products/categories — distinct category list
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.product.findMany({
      where: { category: { not: null } },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    res.json(rows.map((r) => r.category).filter(Boolean));
  })
);

// GET /api/products/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    res.json(product);
  })
);

// POST /api/products
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  })
);

// PUT /api/products/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data });
    res.json(product);
  })
);

// PATCH /api/products/:id/stock  { delta } or { quantity }
router.patch(
  '/:id/stock',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      delta: z.coerce.number().int().optional(),
      quantity: z.coerce.number().int().min(0).optional(),
    });
    const { delta, quantity } = schema.parse(req.body);
    const id = Number(req.params.id);
    let product;
    if (typeof quantity === 'number') {
      product = await prisma.product.update({ where: { id }, data: { quantity } });
    } else if (typeof delta === 'number') {
      product = await prisma.product.update({ where: { id }, data: { quantity: { increment: delta } } });
    } else {
      throw new HttpError(400, 'Cần truyền delta hoặc quantity');
    }
    res.json(product);
  })
);

// DELETE /api/products/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  })
);

export default router;
