import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/http.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Không tìm thấy tài nguyên' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Giá trị đã tồn tại (trùng lặp)', details: err.meta });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    }
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
}
