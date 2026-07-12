import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { UPLOAD_DIR } from '../paths.js';
import { HttpError } from '../utils/http.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Chỉ chấp nhận file ảnh'));
  },
});

// POST /api/upload  (multipart/form-data, field name "image")
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Không có file được tải lên');
  res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

export default router;
