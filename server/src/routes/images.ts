import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

// GET /api/images/:id — public (product photos, referenced directly by <img> tags).
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const img = await prisma.image.findUnique({ where: { id: req.params.id } });
    if (!img) throw new HttpError(404, 'Không tìm thấy ảnh');
    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(img.data));
  })
);

export default router;
