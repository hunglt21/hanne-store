import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

// Keep the file in memory, then persist the bytes to Postgres.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Chỉ chấp nhận file ảnh'));
  },
});

// POST /api/upload  (multipart/form-data, field "image") → stores image in DB, returns its URL.
router.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Không có file được tải lên');
    const img = await prisma.image.create({
      data: { data: req.file.buffer, mimeType: req.file.mimetype || 'image/jpeg' },
    });
    res.status(201).json({ url: `/api/images/${img.id}`, id: img.id });
  })
);

export default router;
